/**
 * Ludo: Legends — Socket.io Client Service
 * 
 * Manages real-time connection to the game server.
 * Bridges server events with the client game store.
 */

import { io, Socket } from 'socket.io-client';

// ─── Types ──────────────────────────────────────────────────────

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface MatchFoundData {
    roomId: string;
    gameState: object;
    players: Array<{ id: string; name: string; elo: number }>;
}

export interface DiceRolledData {
    playerId: string;
    roll: { value: number; seed: string };
    validMoves: Array<{
        tokenId: string;
        from: number;
        to: number;
        type: string;
        capturedToken?: string;
    }>;
    gameState: object;
}

export interface MoveExecutedData {
    move: {
        tokenId: string;
        from: number;
        to: number;
        type: string;
        capturedToken?: string;
    };
    gameState: object;
}

export interface GameOverData {
    winner: string;
    eloChanges: Record<string, { oldElo: number; newElo: number; change: number }>;
    stats: object;
}

export interface SocketEventHandlers {
    onConnectionChange?: (status: ConnectionStatus) => void;
    onQueueJoined?: (data: { position: number }) => void;
    onMatchFound?: (data: MatchFoundData) => void;
    onDiceRolled?: (data: DiceRolledData) => void;
    onMoveExecuted?: (data: MoveExecutedData) => void;
    onGameOver?: (data: GameOverData) => void;
    onRematchRequested?: (data: { playerId: string }) => void;
    onRematchStarted?: (data: { gameState: object }) => void;
    onPlayerDisconnected?: (data: { socketId: string }) => void;
    onError?: (data: { message: string }) => void;
}

// ─── Server Config ──────────────────────────────────────────────

const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

const DEFAULT_SERVER_URL = IS_DEV
    ? 'http://localhost:3001'
    : 'https://api.ludolegends.app';

// ─── Service ────────────────────────────────────────────────────

class SocketService {
    private socket: Socket | null = null;
    private status: ConnectionStatus = 'disconnected';
    private handlers: SocketEventHandlers = {};
    private currentRoomId: string | null = null;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts: number = 5;

    /**
     * Connect to the game server.
     */
    connect(serverUrl: string = DEFAULT_SERVER_URL, authToken?: string): void {
        if (this.socket?.connected) return;

        this.updateStatus('connecting');

        this.socket = io(serverUrl, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            auth: authToken ? { token: authToken } : undefined,
        });

        this.setupEventListeners();
    }

    /**
     * Register event handlers.
     */
    setHandlers(handlers: SocketEventHandlers): void {
        this.handlers = handlers;
    }

    /**
     * Join the matchmaking queue.
     */
    joinQueue(data: {
        playerId: string;
        playerName: string;
        mode: string;
        matchType: string;
        elo: number;
    }): void {
        this.socket?.emit('join_queue', data);
    }

    /**
     * Leave the matchmaking queue.
     */
    leaveQueue(): void {
        this.socket?.emit('leave_queue');
    }

    /**
     * Roll the dice in the current room.
     */
    rollDice(playerId: string): void {
        if (!this.currentRoomId) return;
        this.socket?.emit('roll_dice', {
            roomId: this.currentRoomId,
            playerId,
        });
    }

    /**
     * Select a move in the current room.
     */
    selectMove(playerId: string, moveIndex: number): void {
        if (!this.currentRoomId) return;
        this.socket?.emit('select_move', {
            roomId: this.currentRoomId,
            playerId,
            moveIndex,
        });
    }

    /**
     * Request a rematch.
     */
    requestRematch(playerId: string): void {
        if (!this.currentRoomId) return;
        this.socket?.emit('request_rematch', {
            roomId: this.currentRoomId,
            playerId,
        });
    }

    /**
     * Disconnect from the server.
     */
    disconnect(): void {
        this.socket?.disconnect();
        this.socket = null;
        this.currentRoomId = null;
        this.updateStatus('disconnected');
    }

    /**
     * Get current connection status.
     */
    getStatus(): ConnectionStatus {
        return this.status;
    }

    /**
     * Get current room ID.
     */
    getRoomId(): string | null {
        return this.currentRoomId;
    }

    // ─── Private ────────────────────────────────────────────────

    private setupEventListeners(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            this.reconnectAttempts = 0;
            this.updateStatus('connected');
        });

        this.socket.on('disconnect', () => {
            this.updateStatus('disconnected');
        });

        this.socket.on('connect_error', () => {
            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.updateStatus('error');
            } else {
                this.updateStatus('reconnecting');
            }
        });

        // Game events
        this.socket.on('queue_joined', (data: { position: number }) => {
            this.handlers.onQueueJoined?.(data);
        });

        this.socket.on('match_found', (data: MatchFoundData) => {
            this.currentRoomId = data.roomId;
            this.handlers.onMatchFound?.(data);
        });

        this.socket.on('dice_rolled', (data: DiceRolledData) => {
            this.handlers.onDiceRolled?.(data);
        });

        this.socket.on('move_executed', (data: MoveExecutedData) => {
            this.handlers.onMoveExecuted?.(data);
        });

        this.socket.on('game_over', (data: GameOverData) => {
            this.handlers.onGameOver?.(data);
        });

        this.socket.on('rematch_requested', (data: { playerId: string }) => {
            this.handlers.onRematchRequested?.(data);
        });

        this.socket.on('rematch_started', (data: { gameState: object }) => {
            // Stay in room — currentRoomId unchanged
            this.handlers.onRematchStarted?.(data);
        });

        this.socket.on('player_disconnected', (data: { socketId: string }) => {
            this.handlers.onPlayerDisconnected?.(data);
        });

        this.socket.on('error', (data: { message: string }) => {
            this.handlers.onError?.(data);
        });
    }

    private updateStatus(status: ConnectionStatus): void {
        this.status = status;
        this.handlers.onConnectionChange?.(status);
    }
}

// Singleton
export const socketService = new SocketService();
