/**
 * Ludo: Legends — Server Entry Point
 * 
 * Express + Socket.io real-time multiplayer server.
 * Server-authoritative game logic with ELO matchmaking.
 * 
 * SME Agent: nodejs-backend-patterns, performance-engineer
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameRoom } from './game/GameRoom';
import { MatchmakingQueue } from './matchmaking/Queue';
import { EloEngine } from './matchmaking/EloEngine';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081', 'exp://localhost:8081'],
        methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
});

app.use(cors());
app.use(express.json());

// ─── State ──────────────────────────────────────────────────────

const activeRooms = new Map<string, GameRoom>();
const matchmakingQueue = new MatchmakingQueue();
const eloEngine = new EloEngine();

// ─── Health Check ───────────────────────────────────────────────

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        rooms: activeRooms.size,
        queueSize: matchmakingQueue.size(),
        uptime: process.uptime(),
    });
});

// ─── Rate Limiting ──────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max events per second

function isRateLimited(socketId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(socketId);
    if (!entry || now >= entry.resetAt) {
        rateLimitMap.set(socketId, { count: 1, resetAt: now + 1000 });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT;
}

// ─── Socket Auth Middleware ─────────────────────────────────────

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    // For guest users, token is optional but playerId is required
    const playerId = socket.handshake.auth?.playerId || socket.id;
    (socket as any).playerId = playerId;
    next();
});

// ─── Stale Room Cleanup (every 5 min) ───────────────────────────

setInterval(() => {
    for (const [roomId, room] of activeRooms) {
        if (room.isStale()) {
            room.cleanup();
            activeRooms.delete(roomId);
            console.log(`[GC] Cleaned stale room ${roomId}`);
        }
    }
    // Clean rate limit map
    const now = Date.now();
    for (const [id, entry] of rateLimitMap) {
        if (now >= entry.resetAt) rateLimitMap.delete(id);
    }
}, 5 * 60 * 1000);

// ─── Socket.io Connection ───────────────────────────────────────

io.on('connection', (socket) => {
    console.log(`[Connect] ${socket.id}`);

    // Rate limit wrapper
    const guardedOn = (event: string, handler: (...args: any[]) => void) => {
        socket.on(event, (...args: any[]) => {
            if (isRateLimited(socket.id)) {
                socket.emit('error', { message: 'Rate limited. Slow down.' });
                return;
            }
            handler(...args);
        });
    };

    // ── Matchmaking ──
    guardedOn('join_queue', (data: {
        playerId: string;
        playerName: string;
        mode: string;
        matchType: string;
        elo: number;
    }) => {
        matchmakingQueue.addPlayer({
            socketId: socket.id,
            playerId: data.playerId,
            playerName: data.playerName,
            mode: data.mode,
            matchType: data.matchType,
            elo: data.elo,
            joinedAt: Date.now(),
        });

        socket.emit('queue_joined', { position: matchmakingQueue.size() });

        // Try to find a match
        const match = matchmakingQueue.findMatch(data.matchType, data.mode);
        if (match) {
            const room = new GameRoom(match, data.mode, data.matchType);
            activeRooms.set(room.id, room);

            for (const player of match) {
                const playerSocket = io.sockets.sockets.get(player.socketId);
                if (playerSocket) {
                    playerSocket.join(room.id);
                    playerSocket.emit('match_found', {
                        roomId: room.id,
                        gameState: room.getState(),
                        players: match.map(p => ({
                            id: p.playerId,
                            name: p.playerName,
                            elo: p.elo,
                        })),
                    });
                }
            }

            console.log(`[Match] Room ${room.id} created with ${match.length} players`);
        }
    });

    guardedOn('leave_queue', () => {
        matchmakingQueue.removePlayer(socket.id);
        socket.emit('queue_left');
    });

    // ── Game Actions ──
    guardedOn('roll_dice', (data: { roomId: string; playerId: string }) => {
        const room = activeRooms.get(data.roomId);
        if (!room) return socket.emit('error', { message: 'Room not found' });

        const result = room.rollDice(data.playerId);
        if (result.error) {
            return socket.emit('error', { message: result.error });
        }

        io.to(data.roomId).emit('dice_rolled', {
            playerId: data.playerId,
            roll: result.roll,
            validMoves: result.validMoves,
            gameState: room.getState(),
        });
    });

    guardedOn('select_move', (data: { roomId: string; playerId: string; moveIndex: number }) => {
        const room = activeRooms.get(data.roomId);
        if (!room) return socket.emit('error', { message: 'Room not found' });

        const result = room.executeMove(data.playerId, data.moveIndex);
        if (result.error) {
            return socket.emit('error', { message: result.error });
        }

        io.to(data.roomId).emit('move_executed', {
            move: result.move,
            gameState: room.getState(),
        });

        // Check for game over
        if (result.gameOver) {
            const eloChanges = eloEngine.calculateChanges(
                room.getPlayers(),
                result.winner!,
            );

            io.to(data.roomId).emit('game_over', {
                winner: result.winner,
                eloChanges,
                stats: result.stats,
            });

            // Cleanup room after delay
            setTimeout(() => activeRooms.delete(data.roomId), 30000);
        }
    });

    // ── Rematch ──
    guardedOn('request_rematch', (data: { roomId: string; playerId: string }) => {
        const room = activeRooms.get(data.roomId);
        if (!room) return;

        room.requestRematch(data.playerId);
        io.to(data.roomId).emit('rematch_requested', { playerId: data.playerId });

        if (room.allPlayersWantRematch()) {
            room.restart();
            io.to(data.roomId).emit('rematch_started', {
                gameState: room.getState(),
            });
        }
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
        console.log(`[Disconnect] ${socket.id}`);
        matchmakingQueue.removePlayer(socket.id);

        // Notify rooms of disconnect
        for (const [roomId, room] of activeRooms) {
            if (room.hasPlayer(socket.id)) {
                room.playerDisconnected(socket.id);
                io.to(roomId).emit('player_disconnected', { socketId: socket.id });
            }
        }
    });
});

// ─── Start Server ───────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`🎲 Ludo: Legends server running on port ${PORT}`);
});
