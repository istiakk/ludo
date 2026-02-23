/**
 * Ludo: Legends — Game Screen (Ultimate Edition)
 *
 * Active match view integrating 6 pillars of premium game experience:
 * 1. Game Effects Engine (combos, screen shake, momentum)
 * 2. Emote System (8 emotes with floating bubbles)
 * 3. Board Theme Engine (12 swappable themes)
 * 4. Cinematic Victory Screen (4-phase animation)
 * 5. Match Commentary (AI play-by-play)
 * 6. Dynamic HUD (animated chips, dice history, momentum)
 */

import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../src/store/gameStore';
import {
    type GameMode,
    type MatchType,
    type Move,
    getCurrentPlayer,
    getPlayerTokens,
} from '../src/engine';
import GameBoard from '../src/rendering/GameBoard';
import DiceRenderer from '../src/rendering/DiceRenderer';
import ScreenEffects from '../src/rendering/ScreenEffects';
import CommentaryBanner from '../src/components/CommentaryBanner';
import EmoteWheel from '../src/components/EmoteWheel';
import VictoryScreen from '../src/components/VictoryScreen';
import GameHUD from '../src/components/GameHUD';
import {
    type GameEffect,
    type MatchStats,
    createMatchStats,
    processCaptureEvent,
    processDiceRoll,
    processNonCaptureMove,
    processTokenFinish,
} from '../src/rendering/GameEffectsEngine';
import {
    type CommentaryLine,
    onCapture,
    onLuckyRoll,
    onCombo,
    onTokenFinish,
} from '../src/engine/MatchCommentary';
import { serializeReplay } from '../src/engine/ReplaySystem';
import { colors, typography, spacing, radii, shadows, layout, getPlayerColor } from '../src/theme/design-system';

export default function GameScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ mode: string; matchType: string; difficulty: string }>();

    const {
        gameState,
        replayData,
        isAnimating,
        selectedTokenId,
        startGame,
        rollDice,
        selectMove,
        selectToken,
        processAITurn,
        resetGame,
    } = useGameStore();

    // ─── Effects Engine State ───────────
    const [matchStats, setMatchStats] = useState<MatchStats>(() =>
        createMatchStats(['red', 'green', 'yellow', 'blue'], 4),
    );
    const [activeEffects, setActiveEffects] = useState<GameEffect[]>([]);
    const [commentary, setCommentary] = useState<CommentaryLine | null>(null);
    const [diceHistory, setDiceHistory] = useState<number[]>([]);
    const prevPhaseRef = useRef<string | null>(null);

    // Initialize game on mount
    useEffect(() => {
        const mode = (params.mode as GameMode) || 'classic';
        const matchType = (params.matchType as MatchType) || 'vs_ai';
        const difficulty = (params.difficulty || 'intermediate') as import('../src/engine/types').AIDifficulty;
        startGame(mode, matchType, 'You', difficulty);
        return () => resetGame();
    }, []);

    // Trigger AI turn
    useEffect(() => {
        if (gameState && gameState.phase === 'rolling') {
            const currentPlayer = getCurrentPlayer(gameState);
            if (currentPlayer.isAI) {
                setTimeout(() => processAITurn(), 800);
            }
        }
    }, [gameState?.currentPlayerIndex]);

    // ─── Track dice rolls for effects ───
    useEffect(() => {
        if (!gameState?.currentDice) return;
        const roll = gameState.currentDice;
        setDiceHistory(prev => [...prev, roll.value]);

        // Process dice roll effects
        const currentPlayer = getCurrentPlayer(gameState);
        const { stats: updatedStats, effects } = processDiceRoll(
            matchStats, currentPlayer.color, roll.value,
        );
        setMatchStats(updatedStats);

        if (effects.length > 0) {
            setActiveEffects(prev => [...prev, ...effects]);
            // Lucky roll commentary
            const luckyEffect = effects.find(e => e.type === 'lucky_roll');
            if (luckyEffect && luckyEffect.type === 'lucky_roll') {
                setCommentary(onLuckyRoll(currentPlayer.name, luckyEffect.value));
            }
        }
    }, [gameState?.currentDice]);

    // ─── Clear effects after consumed ───
    const handleEffectsConsumed = useCallback(() => {
        setActiveEffects([]);
    }, []);

    // ─── EmoteHandler ──────────────────
    const handleEmote = useCallback((emoteId: string) => {
        // In multiplayer: broadcast to other players
        console.log(`[Emote] Sent: ${emoteId}`);
    }, []);

    const handleDiceRoll = useCallback(() => {
        if (!gameState || gameState.phase !== 'rolling' || isAnimating) return;
        const currentPlayer = getCurrentPlayer(gameState);
        if (currentPlayer.isAI) return;
        rollDice();
    }, [gameState, isAnimating, rollDice]);

    const handleMoveSelect = useCallback(async (move: Move) => {
        if (isAnimating || !gameState) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Process effects based on move type
        const currentPlayer = getCurrentPlayer(gameState);
        if (move.type === 'capture') {
            const { stats: updatedStats, effects } = processCaptureEvent(
                matchStats, currentPlayer.color, move.capturedToken ?? 'unknown',
            );
            setMatchStats(updatedStats);
            setActiveEffects(prev => [...prev, ...effects]);

            // Commentary
            const capturedPlayer = gameState.players.find(p =>
                p.color !== currentPlayer.color,
            );
            setCommentary(onCapture(currentPlayer.name, capturedPlayer?.name ?? 'Opponent'));

            // Combo commentary
            if (updatedStats.comboCount >= 2) {
                setTimeout(() => {
                    setCommentary(onCombo(currentPlayer.name, updatedStats.comboCount));
                }, 1500);
            }
        } else if (move.type === 'finish') {
            const { stats: updatedStats, effects } = processTokenFinish(matchStats, currentPlayer.color);
            setMatchStats(updatedStats);
            if (effects.length > 0) setActiveEffects(prev => [...prev, ...effects]);

            const tokens = getPlayerTokens(gameState, currentPlayer.color);
            const remaining = tokens.filter(t => t.state !== 'finished').length - 1;
            setCommentary(onTokenFinish(currentPlayer.name, remaining));
        } else {
            setMatchStats(processNonCaptureMove(matchStats));
        }

        selectMove(move);
    }, [isAnimating, selectMove, gameState, matchStats]);

    const handleTokenPress = useCallback((tokenId: string) => {
        if (!gameState || gameState.phase !== 'moving') return;

        const movesForToken = gameState.validMoves.filter(m => m.tokenId === tokenId);
        if (movesForToken.length === 0) return;

        if (movesForToken.length === 1) {
            handleMoveSelect(movesForToken[0]);
        } else {
            selectToken(tokenId);
        }
    }, [gameState, handleMoveSelect, selectToken]);

    const handleBack = () => {
        Alert.alert('Leave Game', 'Leave the current match?', [
            { text: 'Stay', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => { resetGame(); router.back(); } },
        ]);
    };

    // ─── Derived Data ───────────────────
    const hudPlayers = useMemo(() => {
        if (!gameState) return [];
        const currentColor = getCurrentPlayer(gameState).color;
        return gameState.players.map(player => {
            const tokens = getPlayerTokens(gameState, player.color);
            const pColors = getPlayerColor(player.color);
            return {
                name: player.name,
                color: player.color,
                colorPrimary: pColors.primary,
                isAI: player.isAI,
                isActive: player.color === currentColor,
                tokensFinished: tokens.filter(t => t.state === 'finished').length,
                totalTokens: tokens.length,
            };
        });
    }, [gameState]);

    if (!gameState) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Setting up the board...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const currentPlayer = getCurrentPlayer(gameState);
    const playerColors = getPlayerColor(currentPlayer.color);
    const isMyTurn = !currentPlayer.isAI;
    const isGameOver = gameState.phase === 'finished';
    const isWinner = gameState.winner === gameState.players[0].color;
    const winnerPlayer = gameState.players.find(p => p.color === gameState.winner);

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Top Bar ── */}
            <View style={styles.topHud}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.turnInfo}>
                    <View style={[styles.turnDot, { backgroundColor: playerColors.primary }]} />
                    <Text style={styles.turnText}>
                        {isMyTurn ? 'Your turn' : `${currentPlayer.name}'s turn`}
                    </Text>
                    {currentPlayer.isAI && currentPlayer.aiDifficulty && (
                        <Text style={styles.difficultyBadge}>
                            {currentPlayer.aiDifficulty === 'casual' ? '😊' :
                                currentPlayer.aiDifficulty === 'intermediate' ? '🧠' :
                                    currentPlayer.aiDifficulty === 'expert' ? '👑' : '🏆'}
                        </Text>
                    )}
                </View>
            </View>

            {/* ── Dynamic HUD (replaces static player bar) ── */}
            <GameHUD
                players={hudPlayers}
                stats={matchStats}
                diceHistory={diceHistory}
                turnNumber={gameState.turnNumber}
            />

            {/* ── Skia Game Board ── */}
            <View style={styles.boardContainer}>
                <GameBoard
                    gameState={gameState}
                    onTokenPress={handleTokenPress}
                    onMoveSelect={handleMoveSelect}
                    selectedTokenId={selectedTokenId}
                />
            </View>

            {/* ── Bottom Controls ── */}
            {!isGameOver && (
                <View style={styles.controls}>
                    <View style={styles.activeControls}>
                        <DiceRenderer
                            currentRoll={gameState.currentDice}
                            isRolling={false}
                            playerColor={playerColors.primary}
                            onRoll={handleDiceRoll}
                            disabled={!isMyTurn || gameState.phase !== 'rolling' || isAnimating}
                        />

                        {gameState.phase === 'rolling' && currentPlayer.isAI && (
                            <Text style={styles.aiText}>🤖 Thinking...</Text>
                        )}

                        {gameState.phase === 'moving' && gameState.validMoves.length > 1 && isMyTurn && (
                            <View style={styles.moveHint}>
                                <Text style={styles.moveHintText}>Tap a token on the board to move</Text>
                            </View>
                        )}

                        {gameState.phase === 'moving' && gameState.validMoves.length === 0 && (
                            <Text style={styles.noMovesText}>No valid moves</Text>
                        )}
                    </View>
                </View>
            )}

            {/* ── Screen Effects Overlay ── */}
            <ScreenEffects effects={activeEffects} onEffectsConsumed={handleEffectsConsumed} />

            {/* ── Commentary Banner ── */}
            <CommentaryBanner line={commentary} />

            {/* ── Emote Wheel ── */}
            <EmoteWheel onEmote={handleEmote} playerColor={playerColors.primary} />

            {/* ── Cinematic Victory Screen ── */}
            <VictoryScreen
                isVisible={isGameOver}
                isWinner={isWinner}
                winnerName={winnerPlayer?.name ?? ''}
                winnerColor={playerColors.primary}
                stats={matchStats}
                playerName={gameState.players[0].name}
                xpEarned={isWinner ? 120 : 40}
                coinsEarned={isWinner ? 250 : 50}
                hasReplay={!!replayData?.clutchFrameIndex}
                onPlayReplay={() => {
                    if (replayData) {
                        router.push({
                            pathname: '/replay',
                            params: { data: serializeReplay(replayData) }
                        });
                    }
                }}
                onRematch={() => {
                    const mode = (params.mode as GameMode) || 'classic';
                    const matchType = (params.matchType as MatchType) || 'vs_ai';
                    startGame(mode, matchType);
                }}
                onHome={() => { resetGame(); router.back(); }}
            />
        </SafeAreaView>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ui.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: typography.size.md,
        color: colors.ui.textSecondary,
    },

    // Top HUD
    topHud: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: radii.full,
        backgroundColor: colors.ui.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: {
        fontSize: typography.size.lg,
        color: colors.ui.textSecondary,
    },
    turnInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    turnDot: {
        width: 10,
        height: 10,
        borderRadius: radii.full,
    },
    turnText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semiBold,
        color: colors.ui.text,
    },
    difficultyBadge: {
        fontSize: typography.size.base,
        marginLeft: spacing.xs,
    },

    // Board
    boardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.base,
    },

    // Controls
    controls: {
        paddingHorizontal: spacing.base,
        paddingBottom: spacing.lg,
        minHeight: 120,
    },
    activeControls: {
        alignItems: 'center',
        gap: spacing.sm,
    },
    aiText: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        marginTop: spacing.xs,
    },
    moveHint: {
        marginTop: spacing.xs,
    },
    moveHintText: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
        letterSpacing: 1,
    },
    noMovesText: {
        fontSize: typography.size.sm,
        color: colors.ui.textTertiary,
        marginTop: spacing.xs,
    },
});
