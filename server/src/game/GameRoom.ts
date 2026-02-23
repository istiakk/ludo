/**
 * Ludo: Legends — Game Room (FIXED)
 * 
 * Server-authoritative game room with proper:
 * - Cryptographic dice (rejection sampling, no modulo bias)
 * - Full move validation (captures, safe zones, blocking, home column)
 * - Triple-six penalty
 * - Turn timer
 */

import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

// ─── Types ──────────────────────────────────────────────────────

interface Player {
    socketId: string;
    playerId: string;
    playerName: string;
    color: PlayerColor;
    elo: number;
    wantsRematch: boolean;
    connected: boolean;
}

type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

interface TokenState {
    id: string;
    color: PlayerColor;
    index: number;
    state: 'home' | 'active' | 'finished';
    position: number;       // Player-relative: 0=home, 1-52=track, 53-57=home column, 57+=finished
    globalPosition: number; // 0-51 on shared track, -1 if home/home column/finished
}

interface DiceResult {
    value: number;
    seed: string;
}

interface MoveResult {
    tokenId: string;
    from: number;
    to: number;
    type: 'spawn' | 'advance' | 'capture' | 'enter_home' | 'finish';
    capturedToken?: string;
}

interface SimpleGameState {
    phase: 'rolling' | 'moving' | 'finished';
    currentPlayerIndex: number;
    tokens: Record<string, TokenState>;
    currentDice: DiceResult | null;
    validMoves: MoveResult[];
    turnNumber: number;
    winner: string | null;
    consecutiveSixes: number;
}

// ─── Board Constants ────────────────────────────────────────────

const TRACK_LENGTH = 52;
const HOME_COLUMN_LENGTH = 6;
const TOTAL_PATH_LENGTH = 57; // 51 track + 6 home column
const SAFE_POSITIONS = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);
const START_POSITIONS: Record<PlayerColor, number> = {
    red: 0, green: 13, yellow: 26, blue: 39,
};
const TURN_TIMEOUT_MS = 30_000; // 30-second turn timer

// ─── GameRoom Class ─────────────────────────────────────────────

export class GameRoom {
    public readonly id: string;
    private players: Player[];
    private gameState: SimpleGameState;
    private mode: string;
    private matchType: string;
    private createdAt: number;
    private moveHistory: MoveResult[];
    private turnTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        queuePlayers: Array<{ socketId: string; playerId: string; playerName: string; elo: number }>,
        mode: string,
        matchType: string,
    ) {
        this.id = `room_${uuid().slice(0, 8)}`;
        this.mode = mode;
        this.matchType = matchType;
        this.createdAt = Date.now();
        this.moveHistory = [];

        const colorAssignment: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
        this.players = queuePlayers.map((p, i) => ({
            ...p,
            color: colorAssignment[i],
            wantsRematch: false,
            connected: true,
        }));

        // Initialize tokens
        const tokens: Record<string, TokenState> = {};
        for (const player of this.players) {
            for (let i = 0; i < 4; i++) {
                const tokenId = `${player.color}-${i}`;
                tokens[tokenId] = {
                    id: tokenId,
                    color: player.color,
                    index: i,
                    state: 'home',
                    position: 0,
                    globalPosition: -1,
                };
            }
        }

        this.gameState = {
            phase: 'rolling',
            currentPlayerIndex: 0,
            tokens,
            currentDice: null,
            validMoves: [],
            turnNumber: 1,
            winner: null,
            consecutiveSixes: 0,
        };
    }

    // ─── Dice ────────────────────────────────────────────────────

    /**
     * Cryptographically fair dice roll using rejection sampling.
     */
    rollDice(playerId: string): { roll?: DiceResult; validMoves?: MoveResult[]; error?: string } {
        const currentPlayer = this.players[this.gameState.currentPlayerIndex];
        if (currentPlayer.playerId !== playerId) {
            return { error: 'Not your turn' };
        }
        if (this.gameState.phase !== 'rolling') {
            return { error: 'Cannot roll now' };
        }

        this.clearTurnTimer();

        // Rejection sampling: no modulo bias
        const seed = crypto.randomBytes(32).toString('hex');
        let value: number;
        let attempts = 0;
        do {
            const hash = crypto.createHash('sha256')
                .update(seed + (attempts > 0 ? String(attempts) : ''))
                .digest();
            value = hash[0];
            attempts++;
        } while (value >= 252); // 252 = 42 * 6, reject for uniform distribution
        value = (value % 6) + 1;

        const roll: DiceResult = { value, seed };

        // Track consecutive sixes
        const consecutiveSixes = value === 6
            ? this.gameState.consecutiveSixes + 1
            : 0;

        // Triple-six penalty
        if (consecutiveSixes >= 3) {
            // Send last-moved active token home
            if (this.moveHistory.length > 0) {
                const lastMove = this.moveHistory[this.moveHistory.length - 1];
                const lastToken = this.gameState.tokens[lastMove.tokenId];
                if (lastToken && lastToken.state === 'active') {
                    lastToken.state = 'home';
                    lastToken.position = 0;
                    lastToken.globalPosition = -1;
                }
            }

            this.gameState.currentDice = roll;
            this.gameState.consecutiveSixes = 0;
            this.gameState.validMoves = [];
            this.advanceTurn();
            return { roll, validMoves: [] };
        }

        this.gameState.consecutiveSixes = consecutiveSixes;

        // Compute valid moves with full validation
        const validMoves = this.computeValidMoves(currentPlayer.color, value);

        this.gameState.currentDice = roll;
        this.gameState.validMoves = validMoves;

        if (validMoves.length === 0) {
            // No valid moves — skip turn (but extra turn if rolled 6)
            if (value === 6) {
                this.gameState.phase = 'rolling';
                this.gameState.currentDice = null;
                this.gameState.validMoves = [];
            } else {
                this.advanceTurn();
            }
        } else {
            this.gameState.phase = 'moving';
            this.startTurnTimer();
        }

        return { roll, validMoves };
    }

    /**
     * Execute a validated move.
     */
    executeMove(
        playerId: string,
        moveIndex: number,
    ): { move?: MoveResult; gameOver?: boolean; winner?: string; stats?: object; error?: string } {
        const currentPlayer = this.players[this.gameState.currentPlayerIndex];
        if (currentPlayer.playerId !== playerId) {
            return { error: 'Not your turn' };
        }
        if (this.gameState.phase !== 'moving') {
            return { error: 'Cannot move now' };
        }
        if (moveIndex < 0 || moveIndex >= this.gameState.validMoves.length) {
            return { error: 'Invalid move index' };
        }

        this.clearTurnTimer();

        const move = this.gameState.validMoves[moveIndex];
        this.applyMove(move);
        this.moveHistory.push(move);

        // Check win
        const winner = this.checkWinner();
        if (winner) {
            this.gameState.winner = winner;
            this.gameState.phase = 'finished';
            return {
                move,
                gameOver: true,
                winner,
                stats: {
                    totalMoves: this.moveHistory.length,
                    duration: Date.now() - this.createdAt,
                    captures: this.countCaptures(),
                },
            };
        }

        // Extra turn on 6, capture, or finish
        const diceValue = this.gameState.currentDice?.value ?? 0;
        const extraTurn = diceValue === 6 || move.type === 'capture' || move.type === 'finish';

        if (extraTurn) {
            this.gameState.phase = 'rolling';
            this.gameState.currentDice = null;
            this.gameState.validMoves = [];
        } else {
            this.advanceTurn();
        }

        return { move };
    }

    // ─── Full Move Validation ────────────────────────────────────

    private computeValidMoves(color: PlayerColor, diceValue: number): MoveResult[] {
        const moves: MoveResult[] = [];
        const playerTokens = Object.values(this.gameState.tokens).filter(t => t.color === color);

        for (const token of playerTokens) {
            if (token.state === 'finished') continue;

            if (token.state === 'home') {
                if (diceValue === 6) {
                    const spawnMove = this.validateSpawn(token);
                    if (spawnMove) moves.push(spawnMove);
                }
                continue;
            }

            // Active token
            const newPos = token.position + diceValue;

            // Can't overshoot finish
            if (newPos > TOTAL_PATH_LENGTH) continue;

            // Home column movement
            if (newPos > TRACK_LENGTH) {
                if (this.isHomeColumnBlocked(color, token.position, newPos)) continue;

                moves.push({
                    tokenId: token.id,
                    from: token.position,
                    to: newPos,
                    type: newPos >= TOTAL_PATH_LENGTH ? 'finish' : 'enter_home',
                });
                continue;
            }

            // Track movement
            const globalNewPos = this.relativeToGlobal(newPos, color);

            // Can't land on friendly token
            if (this.hasFriendlyAt(color, globalNewPos)) continue;

            // Check for capture
            const capturedToken = this.findCaptureTarget(color, globalNewPos);

            // Can't land on enemy on safe zone
            if (!capturedToken && this.hasEnemyOnSafe(color, globalNewPos)) continue;

            moves.push({
                tokenId: token.id,
                from: token.position,
                to: newPos,
                type: capturedToken ? 'capture' : 'advance',
                capturedToken: capturedToken?.id,
            });
        }

        return moves;
    }

    private validateSpawn(token: TokenState): MoveResult | null {
        const startPos = 1;
        const globalStart = this.relativeToGlobal(startPos, token.color);

        // Can't spawn if friendly on start
        if (this.hasFriendlyAt(token.color, globalStart)) return null;

        const capturedToken = this.findCaptureTarget(token.color, globalStart);

        // Can't spawn onto enemy on safe zone
        if (!capturedToken && this.hasEnemyOnSafe(token.color, globalStart)) return null;

        return {
            tokenId: token.id,
            from: 0,
            to: startPos,
            type: capturedToken ? 'capture' : 'spawn',
            capturedToken: capturedToken?.id,
        };
    }

    private findCaptureTarget(attackerColor: PlayerColor, globalPos: number): TokenState | null {
        if (SAFE_POSITIONS.has(globalPos)) return null;

        for (const token of Object.values(this.gameState.tokens)) {
            if (token.color === attackerColor) continue;
            if (token.state !== 'active') continue;
            if (token.position > TRACK_LENGTH) continue; // In home column

            const tokenGlobal = this.relativeToGlobal(token.position, token.color);
            if (tokenGlobal === globalPos) return token;
        }
        return null;
    }

    private hasFriendlyAt(color: PlayerColor, globalPos: number): boolean {
        return Object.values(this.gameState.tokens).some(
            t => t.color === color && t.state === 'active' &&
                t.position <= TRACK_LENGTH &&
                this.relativeToGlobal(t.position, t.color) === globalPos
        );
    }

    private hasEnemyOnSafe(myColor: PlayerColor, globalPos: number): boolean {
        if (!SAFE_POSITIONS.has(globalPos)) return false;
        return Object.values(this.gameState.tokens).some(
            t => t.color !== myColor && t.state === 'active' &&
                t.position <= TRACK_LENGTH &&
                this.relativeToGlobal(t.position, t.color) === globalPos
        );
    }

    private isHomeColumnBlocked(color: PlayerColor, fromPos: number, toPos: number): boolean {
        return Object.values(this.gameState.tokens).some(
            t => t.color === color && t.state === 'active' &&
                t.position > TRACK_LENGTH &&
                t.position > Math.min(fromPos, TRACK_LENGTH) &&
                t.position <= toPos
        );
    }

    private relativeToGlobal(position: number, color: PlayerColor): number {
        if (position <= 0 || position > TRACK_LENGTH) return -1;
        return (START_POSITIONS[color] + position - 1) % TRACK_LENGTH;
    }

    // ─── Move Application ────────────────────────────────────────

    private applyMove(move: MoveResult): void {
        const token = this.gameState.tokens[move.tokenId];
        if (!token) return;

        token.position = move.to;
        if (move.type === 'spawn') {
            token.state = 'active';
            token.globalPosition = this.relativeToGlobal(move.to, token.color);
        } else if (move.type === 'finish') {
            token.state = 'finished';
            token.globalPosition = -1;
        } else if (move.type === 'enter_home') {
            token.globalPosition = -1;
        } else {
            token.globalPosition = this.relativeToGlobal(move.to, token.color);
        }

        // Handle capture
        if (move.capturedToken) {
            const captured = this.gameState.tokens[move.capturedToken];
            if (captured) {
                captured.state = 'home';
                captured.position = 0;
                captured.globalPosition = -1;
            }
        }
    }

    private advanceTurn(): void {
        this.gameState.currentPlayerIndex =
            (this.gameState.currentPlayerIndex + 1) % this.players.length;
        this.gameState.phase = 'rolling';
        this.gameState.currentDice = null;
        this.gameState.validMoves = [];
        this.gameState.consecutiveSixes = 0;
        this.gameState.turnNumber++;
    }

    private checkWinner(): string | null {
        for (const player of this.players) {
            const tokens = Object.values(this.gameState.tokens).filter(t => t.color === player.color);
            if (tokens.every(t => t.state === 'finished')) {
                return player.color;
            }
        }
        return null;
    }

    private countCaptures(): Record<string, number> {
        const captures: Record<string, number> = {};
        for (const player of this.players) captures[player.color] = 0;
        for (const move of this.moveHistory) {
            if (move.type === 'capture') {
                const token = this.gameState.tokens[move.tokenId];
                if (token) captures[token.color] = (captures[token.color] || 0) + 1;
            }
        }
        return captures;
    }

    // ─── Turn Timer ──────────────────────────────────────────────

    private startTurnTimer(): void {
        this.clearTurnTimer();
        this.turnTimer = setTimeout(() => {
            // Auto-skip on timeout — pick first valid move or skip
            if (this.gameState.validMoves.length > 0) {
                const autoMove = this.gameState.validMoves[0];
                this.applyMove(autoMove);
                this.moveHistory.push(autoMove);
            }
            this.advanceTurn();
        }, TURN_TIMEOUT_MS);
    }

    private clearTurnTimer(): void {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
    }

    // ─── Public API ──────────────────────────────────────────────

    getState(): SimpleGameState {
        // Deep copy to prevent external mutation
        return JSON.parse(JSON.stringify(this.gameState));
    }

    getPlayers(): Player[] {
        return this.players.map(p => ({ ...p }));
    }

    hasPlayer(socketId: string): boolean {
        return this.players.some(p => p.socketId === socketId);
    }

    playerDisconnected(socketId: string): void {
        const player = this.players.find(p => p.socketId === socketId);
        if (player) player.connected = false;
        this.clearTurnTimer();
    }

    requestRematch(playerId: string): void {
        const player = this.players.find(p => p.playerId === playerId);
        if (player) player.wantsRematch = true;
    }

    allPlayersWantRematch(): boolean {
        return this.players.every(p => p.wantsRematch);
    }

    isStale(): boolean {
        return Date.now() - this.createdAt > 60 * 60 * 1000; // 1 hour
    }

    restart(): void {
        this.clearTurnTimer();
        for (const player of this.players) {
            player.wantsRematch = false;
        }
        for (const token of Object.values(this.gameState.tokens)) {
            token.state = 'home';
            token.position = 0;
            token.globalPosition = -1;
        }
        this.gameState.phase = 'rolling';
        this.gameState.currentPlayerIndex = 0;
        this.gameState.currentDice = null;
        this.gameState.validMoves = [];
        this.gameState.turnNumber = 1;
        this.gameState.winner = null;
        this.gameState.consecutiveSixes = 0;
        this.moveHistory = [];
    }

    cleanup(): void {
        this.clearTurnTimer();
    }
}
