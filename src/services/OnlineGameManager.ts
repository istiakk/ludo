/**
 * Ludo: Legends — Online Game Manager
 * 
 * Bridges SocketService ↔ useGameStore for real-time multiplayer.
 * Handles matchmaking, server-authoritative game state sync,
 * turn timers, disconnection recovery, and rematch flow.
 */

import { socketService, ConnectionStatus, MatchFoundData, DiceRolledData, MoveExecutedData, GameOverData } from './SocketService';
import { useGameStore } from '../store/gameStore';
import { soundManager } from './SoundManager';
import { getProfile } from './StorageService';
import { GameState, Move, DiceRoll } from '../engine/types';

// ─── Types ──────────────────────────────────────────────────────

export type MatchmakingStatus =
    | 'idle'
    | 'connecting'
    | 'queued'
    | 'matched'
    | 'playing'
    | 'finished'
    | 'disconnected';

export interface OnlineMatchInfo {
    roomId: string;
    opponentName: string;
    opponentElo: number;
    myPlayerId: string;
    turnTimeMs: number;
}

interface OnlineGameCallbacks {
    onStatusChange: (status: MatchmakingStatus) => void;
    onQueuePosition: (position: number) => void;
    onMatchInfo: (info: OnlineMatchInfo) => void;
    onTurnTimer: (remainingMs: number) => void;
    onOpponentDisconnected: () => void;
    onError: (message: string) => void;
}

// ─── Constants ──────────────────────────────────────────────────

const TURN_TIME_MS = 30_000; // 30 seconds per turn
const TIMER_INTERVAL_MS = 100;

// ─── Manager ────────────────────────────────────────────────────

class OnlineGameManager {
    private status: MatchmakingStatus = 'idle';
    private callbacks: Partial<OnlineGameCallbacks> = {};
    private matchInfo: OnlineMatchInfo | null = null;
    private turnTimerInterval: ReturnType<typeof setInterval> | null = null;
    private turnStartTime: number = 0;

    /**
     * Register UI callbacks for status updates.
     */
    setCallbacks(callbacks: Partial<OnlineGameCallbacks>): void {
        this.callbacks = callbacks;
    }

    /**
     * Start matchmaking: connect → join queue → wait for match.
     */
    async startMatchmaking(mode: string, matchType: string): Promise<void> {
        this.setStatus('connecting');

        const profile = await getProfile();
        const playerId = profile?.id ?? `guest_${Date.now()}`;
        const playerName = profile?.displayName ?? 'Guest';
        const elo = profile?.elo ?? 1000;

        // Register socket event handlers
        socketService.setHandlers({
            onConnectionChange: (connStatus: ConnectionStatus) => {
                if (connStatus === 'connected') {
                    this.setStatus('queued');
                    socketService.joinQueue({
                        playerId,
                        playerName,
                        mode,
                        matchType,
                        elo,
                    });
                } else if (connStatus === 'error' || connStatus === 'disconnected') {
                    this.setStatus('disconnected');
                    this.callbacks.onError?.('Connection lost. Please try again.');
                }
            },

            onQueueJoined: (data: { position: number }) => {
                this.callbacks.onQueuePosition?.(data.position);
            },

            onMatchFound: (data: MatchFoundData) => {
                const opponent = data.players.find(p => p.id !== playerId);
                this.matchInfo = {
                    roomId: data.roomId,
                    opponentName: opponent?.name ?? 'Opponent',
                    opponentElo: opponent?.elo ?? 1000,
                    myPlayerId: playerId,
                    turnTimeMs: TURN_TIME_MS,
                };

                this.setStatus('matched');
                this.callbacks.onMatchInfo?.(this.matchInfo);
                soundManager.play('button_tap');

                // Initialize game store for online play
                const store = useGameStore.getState();
                store.setOnline(true);

                // After brief "matched!" display, start playing
                setTimeout(() => {
                    this.setStatus('playing');
                    this.startTurnTimer();
                }, 2000);
            },

            onDiceRolled: (data: DiceRolledData) => {
                const store = useGameStore.getState();
                const serverRoll: DiceRoll = {
                    value: data.roll.value as 1 | 2 | 3 | 4 | 5 | 6,
                    seed: data.roll.seed,
                    timestamp: Date.now(),
                };
                store.rollDice(serverRoll);
                this.resetTurnTimer();
            },

            onMoveExecuted: (data: MoveExecutedData) => {
                const store = useGameStore.getState();
                const move: Move = {
                    tokenId: data.move.tokenId as Move['tokenId'],
                    from: data.move.from,
                    to: data.move.to,
                    diceValue: 0, // server-side already validated
                    type: data.move.type as Move['type'],
                    capturedToken: data.move.capturedToken as Move['capturedToken'],
                };
                store.selectMove(move);
                this.resetTurnTimer();
            },

            onGameOver: (data: GameOverData) => {
                this.setStatus('finished');
                this.stopTurnTimer();
            },

            onPlayerDisconnected: () => {
                this.callbacks.onOpponentDisconnected?.();
                soundManager.play('turn_change');
            },

            onRematchStarted: () => {
                this.setStatus('playing');
                this.startTurnTimer();
            },

            onError: (data: { message: string }) => {
                this.callbacks.onError?.(data.message);
            },
        });

        // Connect
        socketService.connect();
    }

    /**
     * Send dice roll to server (online mode).
     */
    rollDice(): void {
        if (!this.matchInfo) return;
        socketService.rollDice(this.matchInfo.myPlayerId);
    }

    /**
     * Send move selection to server (online mode).
     */
    selectMove(moveIndex: number): void {
        if (!this.matchInfo) return;
        socketService.selectMove(this.matchInfo.myPlayerId, moveIndex);
    }

    /**
     * Request rematch from opponent.
     */
    requestRematch(): void {
        if (!this.matchInfo) return;
        socketService.requestRematch(this.matchInfo.myPlayerId);
    }

    /**
     * Leave match / cancel matchmaking.
     */
    cancel(): void {
        this.stopTurnTimer();
        socketService.leaveQueue();
        socketService.disconnect();
        useGameStore.getState().setOnline(false);
        this.setStatus('idle');
        this.matchInfo = null;
    }

    /**
     * Get current status.
     */
    getStatus(): MatchmakingStatus {
        return this.status;
    }

    /**
     * Get match info (opponent, room, etc).
     */
    getMatchInfo(): OnlineMatchInfo | null {
        return this.matchInfo;
    }

    // ─── Private ────────────────────────────────────────────

    private setStatus(status: MatchmakingStatus): void {
        this.status = status;
        this.callbacks.onStatusChange?.(status);
    }

    private startTurnTimer(): void {
        this.turnStartTime = Date.now();
        this.turnTimerInterval = setInterval(() => {
            const elapsed = Date.now() - this.turnStartTime;
            const remaining = Math.max(0, TURN_TIME_MS - elapsed);
            this.callbacks.onTurnTimer?.(remaining);

            if (remaining <= 0) {
                this.stopTurnTimer();
            }
        }, TIMER_INTERVAL_MS);
    }

    private resetTurnTimer(): void {
        this.turnStartTime = Date.now();
    }

    private stopTurnTimer(): void {
        if (this.turnTimerInterval) {
            clearInterval(this.turnTimerInterval);
            this.turnTimerInterval = null;
        }
    }
}

// Singleton
export const onlineGameManager = new OnlineGameManager();
