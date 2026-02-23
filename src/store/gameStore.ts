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
import {
    type ReplayData,
    startRecording,
    addFrame,
    finalizeReplay
} from '../engine/ReplaySystem';
import { computeMatchStats } from '../engine/GameState';
import { saveProgression, getProgression, addMatchToHistory, saveWallet, getWallet } from '../services/StorageService';
import { soundManager } from '../services/SoundManager';
import { calculateMatchXP, calculateMatchCoins, xpForLevel } from '../services/ProgressionService';
import { showToast } from '../components/Toast';

// ─── Types ──────────────────────────────────────────────────────

interface GameStore {
    // State
    gameState: GameState | null;
    replayData: ReplayData | null;
    isAnimating: boolean;
    selectedTokenId: string | null;
    showCoaching: boolean;
    isOnline: boolean;
    aiProcessing: boolean;

    // Actions
    startGame: (mode: GameMode, matchType: MatchType, playerName?: string, aiDifficulty?: import('../engine/types').AIDifficulty) => void;
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
    replayData: null,
    isAnimating: false,
    selectedTokenId: null,
    showCoaching: false,
    isOnline: false,
    aiProcessing: false,

    // ─── Actions ────────────────────────────────────────────

    startGame: (mode, matchType, playerName = 'You', aiDifficulty = 'intermediate') => {
        clearAITimeout();
        const players = createPlayers(matchType, playerName, aiDifficulty);
        const gameState = createGameState(players, mode, matchType);
        const replayData = startRecording(gameState);
        set({ gameState, replayData, isAnimating: false, selectedTokenId: null, aiProcessing: false });
    },

    rollDice: (serverRoll) => {
        const { gameState, isOnline } = get();
        if (!gameState || gameState.phase !== 'rolling') return;

        const newState = processDiceRoll(gameState, serverRoll);
        set({ gameState: newState });

        // Sound effects
        soundManager.play('dice_roll');
        if (newState.currentDice && newState.currentDice.value === 6) {
            setTimeout(() => soundManager.play('extra_turn'), 300);
        }

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
        const { gameState, replayData } = get();
        if (!gameState || gameState.phase !== 'moving') return;

        set({ isAnimating: true, selectedTokenId: null });

        const currentPlayer = getCurrentPlayer(gameState);
        const newReplayData = replayData && gameState.currentDice
            ? addFrame(replayData, currentPlayer.color, gameState.currentDice, move)
            : replayData;

        const newState = executeMove(gameState, move);
        set({ gameState: newState, replayData: newReplayData });

        // Sound effects based on move type
        if (move.capturedToken) {
            soundManager.play('token_capture');
        } else if (move.type === 'spawn') {
            soundManager.play('token_spawn');
        } else {
            soundManager.play('token_move');
        }
        if (move.type === 'finish') {
            soundManager.play('token_finish');
        }

        // Check for game over
        if (newState.phase === 'finished') {
            const won = newState.winner === 'red';
            soundManager.play(won ? 'win_stinger' : 'lose_stinger');
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
        const { gameState, replayData, isOnline } = get();
        if (!gameState) return;

        const currentPlayer = getCurrentPlayer(gameState);
        const newReplayData = replayData && gameState.currentDice
            ? addFrame(replayData, currentPlayer.color, gameState.currentDice, null)
            : replayData;

        const newState = skipTurn(gameState);
        set({ gameState: newState, replayData: newReplayData });

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
        const { gameState, replayData } = get();
        if (!gameState || gameState.phase !== 'finished') return;

        if (replayData) {
            const finalReplayData = finalizeReplay(replayData, gameState.winner);
            set({ replayData: finalReplayData });
        }

        try {
            // Compute stats from engine
            const stats = computeMatchStats(gameState);
            const won = gameState.winner === 'red'; // Player is always red
            const playerCaptures = stats.captures.red ?? 0;
            const playerFinished = stats.tokensFinished.red ?? 0;
            const gameDurationMin = Math.round(stats.duration / 60);

            // Find opponent name
            const opponent = gameState.players.find(p => p.color !== 'red');
            const opponentName = opponent?.name ?? 'Opponent';

            await addMatchToHistory({
                id: `match_${Date.now()}`,
                mode: gameState.mode,
                matchType: gameState.matchType,
                result: won ? 'win' : 'loss',
                eloChange: won ? 25 : -15,
                captures: playerCaptures,
                tokensFinished: playerFinished,
                duration: stats.duration,
                opponentName,
                playedAt: Date.now(),
            });

            // Calculate XP using ProgressionService
            const xpGain = calculateMatchXP({
                won,
                captures: playerCaptures,
                tokensFinished: playerFinished,
                gameDurationMinutes: gameDurationMin,
                opponentEloDiff: 0,
            });

            // Calculate coins using ProgressionService
            const coinsEarned = calculateMatchCoins({
                won,
                captures: playerCaptures,
                tokensFinished: playerFinished,
            });

            // Update progression with proper level-up calculation
            const prog = await getProgression();
            let newXp = prog.xp + xpGain;
            let newLevel = prog.level;
            while (newXp >= xpForLevel(newLevel)) {
                newXp -= xpForLevel(newLevel);
                newLevel++;
            }

            await saveProgression({
                level: newLevel,
                xp: newXp,
                totalWins: prog.totalWins + (won ? 1 : 0),
                totalGames: prog.totalGames + 1,
                winStreak: won ? prog.winStreak + 1 : 0,
                bestStreak: Math.max(prog.bestStreak, won ? prog.winStreak + 1 : 0),
            });

            // Award coins
            const wallet = await getWallet();
            await saveWallet({
                coins: wallet.coins + coinsEarned,
                gems: wallet.gems,
            });

            // Show reward toasts
            showToast(
                `${won ? '🏆 Victory!' : '😤 Defeat!'} +${xpGain} XP, +${coinsEarned} 🪙`,
                won ? 'success' : 'info',
            );
            if (newLevel > prog.level) {
                showToast(`⬆️ Level Up! You are now Level ${newLevel}`, 'reward', '🎉');
            }
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
