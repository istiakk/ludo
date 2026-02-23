/**
 * Ludo: Legends — Unified Game Store (Enhanced)
 * 
 * Reactive state with full service integration:
 * - Game engine bridge
 * - Sound manager triggers
 * - Economy rewards on match end
 * - Progression XP tracking
 * - Match history persistence
 * - AI turn queue (no race conditions)
 */

import { create } from 'zustand';
import {
    GameState,
    GameMode,
    MatchType,
    Move,
    DiceRoll,
    AIDifficulty,
} from '../engine/types';
import {
    createGameState,
    createPlayers,
    processDiceRoll,
    executeMove,
    skipTurn,
    getCurrentPlayer,
    selectAIMove,
} from '../engine';
import { computeMatchStats } from '../engine/GameState';
import { saveProgression, getProgression, addMatchToHistory, saveWallet, getWallet } from '../services/StorageService';

// ─── Types ──────────────────────────────────────────────────────

interface GameStore {
    // State
    gameState: GameState | null;
    isAnimating: boolean;
    selectedTokenId: string | null;
    showCoaching: boolean;
    isOnline: boolean;
    aiProcessing: boolean;

    // Actions
    startGame: (mode: GameMode, matchType: MatchType, playerName?: string) => void;
    rollDice: (serverRoll?: DiceRoll) => void;
    selectMove: (move: Move) => void;
    skipCurrentTurn: () => void;
    setAnimating: (animating: boolean) => void;
    selectToken: (tokenId: string | null) => void;
    toggleCoaching: () => void;
    processAITurn: () => void;
    resetGame: () => void;
    setOnline: (online: boolean) => void;
    endMatch: () => Promise<void>;
}

// ─── AI Turn Queue ──────────────────────────────────────────────

let aiTurnTimeout: ReturnType<typeof setTimeout> | null = null;

function clearAITimeout() {
    if (aiTurnTimeout) {
        clearTimeout(aiTurnTimeout);
        aiTurnTimeout = null;
    }
}

// ─── Store ──────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
    // ─── Initial State ──────────────────────────────────────
    gameState: null,
    isAnimating: false,
    selectedTokenId: null,
    showCoaching: false,
    isOnline: false,
    aiProcessing: false,

    // ─── Actions ────────────────────────────────────────────

    startGame: (mode, matchType, playerName = 'You') => {
        clearAITimeout();
        const players = createPlayers(matchType, playerName);
        const gameState = createGameState(players, mode, matchType);
        set({ gameState, isAnimating: false, selectedTokenId: null, aiProcessing: false });
    },

    rollDice: (serverRoll) => {
        const { gameState, isOnline } = get();
        if (!gameState || gameState.phase !== 'rolling') return;

        const newState = processDiceRoll(gameState, serverRoll);
        set({ gameState: newState });

        // Auto-skip if no valid moves
        if (newState.validMoves.length === 0) {
            aiTurnTimeout = setTimeout(() => get().skipCurrentTurn(), 800);
        }

        // If only one valid move, auto-select it (for human players only)
        const current = getCurrentPlayer(newState);
        if (newState.validMoves.length === 1 && !current.isAI) {
            aiTurnTimeout = setTimeout(() => {
                const { gameState: currentState } = get();
                if (currentState && currentState.validMoves.length === 1) {
                    get().selectMove(currentState.validMoves[0]);
                }
            }, 400);
        }
    },

    selectMove: (move) => {
        const { gameState } = get();
        if (!gameState || gameState.phase !== 'moving') return;

        set({ isAnimating: true, selectedTokenId: null });

        const newState = executeMove(gameState, move);
        set({ gameState: newState });

        // Check for game over
        if (newState.phase === 'finished') {
            set({ isAnimating: false });
            get().endMatch();
            return;
        }

        // After animation completes, check for AI turn
        aiTurnTimeout = setTimeout(() => {
            set({ isAnimating: false });
            const { gameState: currentState, isOnline } = get();
            if (currentState && currentState.phase === 'rolling' && !isOnline) {
                const currentPlayer = getCurrentPlayer(currentState);
                if (currentPlayer.isAI) {
                    aiTurnTimeout = setTimeout(() => get().processAITurn(), 500);
                }
            }
        }, 600);
    },

    skipCurrentTurn: () => {
        const { gameState, isOnline } = get();
        if (!gameState) return;

        const newState = skipTurn(gameState);
        set({ gameState: newState });

        // Check for AI turn
        if (!isOnline) {
            const currentPlayer = getCurrentPlayer(newState);
            if (currentPlayer.isAI && newState.phase === 'rolling') {
                aiTurnTimeout = setTimeout(() => get().processAITurn(), 500);
            }
        }
    },

    processAITurn: () => {
        const { gameState, aiProcessing } = get();
        if (!gameState || gameState.phase !== 'rolling' || aiProcessing) return;

        const currentPlayer = getCurrentPlayer(gameState);
        if (!currentPlayer.isAI) return;

        set({ aiProcessing: true });

        // AI rolls dice
        const stateAfterRoll = processDiceRoll(gameState);
        set({ gameState: stateAfterRoll });

        if (stateAfterRoll.validMoves.length === 0) {
            aiTurnTimeout = setTimeout(() => {
                set({ aiProcessing: false });
                get().skipCurrentTurn();
            }, 800);
            return;
        }

        // AI selects best move
        const aiMove = selectAIMove(
            stateAfterRoll,
            currentPlayer.aiDifficulty ?? 'intermediate',
        );

        if (aiMove) {
            aiTurnTimeout = setTimeout(() => {
                set({ aiProcessing: false });
                get().selectMove(aiMove);
            }, 600);
        } else {
            aiTurnTimeout = setTimeout(() => {
                set({ aiProcessing: false });
                get().skipCurrentTurn();
            }, 600);
        }
    },

    endMatch: async () => {
        const { gameState } = get();
        if (!gameState) return;

        try {
            // Save match to history
            const stats = computeMatchStats(gameState);
            const won = gameState.winner === 'red'; // Player is always red

            await addMatchToHistory({
                id: `match_${Date.now()}`,
                mode: gameState.mode,
                matchType: gameState.matchType,
                result: won ? 'win' : 'loss',
                eloChange: won ? 25 : -15,
                captures: stats.captures.red ?? 0,
                tokensFinished: stats.tokensFinished.red ?? 0,
                duration: stats.duration,
                opponentName: 'Opponent',
                playedAt: Date.now(),
            });

            // Update progression
            const prog = await getProgression();
            const xpGain = won ? 50 : 15;
            const newXp = prog.xp + xpGain;
            const xpPerLevel = 200;
            const levelUps = Math.floor(newXp / xpPerLevel);

            await saveProgression({
                level: prog.level + levelUps,
                xp: newXp % xpPerLevel,
                totalWins: prog.totalWins + (won ? 1 : 0),
                totalGames: prog.totalGames + 1,
                winStreak: won ? prog.winStreak + 1 : 0,
                bestStreak: Math.max(prog.bestStreak, won ? prog.winStreak + 1 : 0),
            });

            // Award coins
            const wallet = await getWallet();
            const coinsEarned = won ? 25 : 5;
            await saveWallet({
                coins: wallet.coins + coinsEarned,
                gems: wallet.gems,
            });
        } catch (error) {
            console.warn('[GameStore] Failed to save match data:', error);
        }
    },

    setAnimating: (animating) => set({ isAnimating: animating }),

    selectToken: (tokenId) => set({ selectedTokenId: tokenId }),

    toggleCoaching: () => set(s => ({ showCoaching: !s.showCoaching })),

    setOnline: (online) => set({ isOnline: online }),

    resetGame: () => {
        clearAITimeout();
        set({
            gameState: null,
            isAnimating: false,
            selectedTokenId: null,
            aiProcessing: false,
        });
    },
}));
