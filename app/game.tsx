/**
 * Ludo: Legends — Game Screen
 * 
 * Active match view with Skia board, animated dice, and HUD.
 * Full integration of engine + store + rendering layers.
 * 
 * SME Agent: game-development, react-native-architecture, mobile-design
 */

import React, { useEffect, useCallback } from 'react';
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
    GameMode,
    MatchType,
    Move,
    getCurrentPlayer,
    getPlayerTokens,
} from '../src/engine';
import GameBoard from '../src/rendering/GameBoard';
import DiceRenderer from '../src/rendering/DiceRenderer';
import { colors, typography, spacing, radii, shadows, layout, getPlayerColor } from '../src/theme/design-system';

export default function GameScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ mode: string; matchType: string }>();

    const {
        gameState,
        isAnimating,
        selectedTokenId,
        startGame,
        rollDice,
        selectMove,
        selectToken,
        processAITurn,
        resetGame,
    } = useGameStore();

    // Initialize game on mount
    useEffect(() => {
        const mode = (params.mode as GameMode) || 'classic';
        const matchType = (params.matchType as MatchType) || 'vs_ai';
        startGame(mode, matchType);
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

    const handleDiceRoll = useCallback(() => {
        if (!gameState || gameState.phase !== 'rolling' || isAnimating) return;
        const currentPlayer = getCurrentPlayer(gameState);
        if (currentPlayer.isAI) return;
        rollDice();
    }, [gameState, isAnimating, rollDice]);

    const handleMoveSelect = useCallback(async (move: Move) => {
        if (isAnimating) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        selectMove(move);
    }, [isAnimating, selectMove]);

    const handleTokenPress = useCallback((tokenId: string) => {
        if (!gameState || gameState.phase !== 'moving') return;
        const currentPlayer = getCurrentPlayer(gameState);

        // Find moves for this token
        const movesForToken = gameState.validMoves.filter(m => m.tokenId === tokenId);
        if (movesForToken.length === 0) return;

        if (movesForToken.length === 1) {
            // Auto-execute if only one move
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

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Top HUD ── */}
            <View style={styles.topHud}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.turnInfo}>
                    <View style={[styles.turnDot, { backgroundColor: playerColors.primary }]} />
                    <Text style={styles.turnText}>
                        {isMyTurn ? 'Your turn' : `${currentPlayer.name}'s turn`}
                    </Text>
                </View>
                <View style={styles.turnCounter}>
                    <Text style={styles.turnCounterText}>T{gameState.turnNumber}</Text>
                </View>
            </View>

            {/* ── Player Status Bar ── */}
            <View style={styles.playerBar}>
                {gameState.players.map(player => {
                    const tokens = getPlayerTokens(gameState, player.color);
                    const pColors = getPlayerColor(player.color);
                    const finished = tokens.filter(t => t.state === 'finished').length;
                    const isActive = player.color === currentPlayer.color;

                    return (
                        <View key={player.color} style={[
                            styles.playerChip,
                            isActive && { borderColor: pColors.primary, backgroundColor: pColors.primary + '15' },
                        ]}>
                            <View style={[styles.chipDot, { backgroundColor: pColors.primary }]} />
                            <Text style={[styles.chipName, isActive && { color: colors.ui.text }]}>
                                {player.name.length > 6 ? player.name.slice(0, 6) : player.name}
                            </Text>
                            <Text style={styles.chipScore}>
                                {finished}/{tokens.length}
                            </Text>
                        </View>
                    );
                })}
            </View>

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
            <View style={styles.controls}>
                {/* Game Over State */}
                {gameState.phase === 'finished' ? (
                    <View style={styles.gameOver}>
                        <Text style={styles.gameOverEmoji}>🏆</Text>
                        <Text style={styles.gameOverText}>
                            {gameState.winner === gameState.players[0].color
                                ? 'You Win!'
                                : `${gameState.players.find(p => p.color === gameState.winner)?.name} Wins!`}
                        </Text>
                        <View style={styles.gameOverButtons}>
                            <TouchableOpacity
                                style={[styles.rematchButton, { backgroundColor: playerColors.primary }]}
                                onPress={() => {
                                    const mode = (params.mode as GameMode) || 'classic';
                                    const matchType = (params.matchType as MatchType) || 'vs_ai';
                                    startGame(mode, matchType);
                                }}
                            >
                                <Text style={styles.rematchText}>🔄 REMATCH</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.homeButton}
                                onPress={() => { resetGame(); router.back(); }}
                            >
                                <Text style={styles.homeButtonText}>HOME</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    /* Active Game Controls */
                    <View style={styles.activeControls}>
                        {/* Dice */}
                        <DiceRenderer
                            currentRoll={gameState.currentDice}
                            isRolling={false}
                            playerColor={playerColors.primary}
                            onRoll={handleDiceRoll}
                            disabled={!isMyTurn || gameState.phase !== 'rolling' || isAnimating}
                        />

                        {/* AI Thinking Indicator */}
                        {gameState.phase === 'rolling' && currentPlayer.isAI && (
                            <Text style={styles.aiText}>🤖 Thinking...</Text>
                        )}

                        {/* Move Selection (when multiple moves available) */}
                        {gameState.phase === 'moving' && gameState.validMoves.length > 1 && isMyTurn && (
                            <View style={styles.moveHint}>
                                <Text style={styles.moveHintText}>Tap a token on the board to move</Text>
                            </View>
                        )}

                        {/* No moves available */}
                        {gameState.phase === 'moving' && gameState.validMoves.length === 0 && (
                            <Text style={styles.noMovesText}>No valid moves</Text>
                        )}
                    </View>
                )}
            </View>
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
    turnCounter: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        backgroundColor: colors.ui.surface,
        borderRadius: radii.full,
    },
    turnCounterText: {
        fontSize: typography.size.xs,
        color: colors.ui.textSecondary,
        fontWeight: typography.weight.medium,
    },

    // Player Status Bar
    playerBar: {
        flexDirection: 'row',
        paddingHorizontal: spacing.sm,
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    playerChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.ui.border,
        backgroundColor: colors.ui.surface,
    },
    chipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    chipName: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.medium,
        color: colors.ui.textSecondary,
        flex: 1,
    },
    chipScore: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary,
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

    // Game Over
    gameOver: {
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    gameOverEmoji: {
        fontSize: 48,
        marginBottom: spacing.xs,
    },
    gameOverText: {
        fontSize: typography.size['2xl'],
        fontWeight: typography.weight.extraBold,
        color: colors.ui.gold,
        marginBottom: spacing.md,
    },
    gameOverButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    rematchButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radii.xl,
        ...shadows.md,
    },
    rematchText: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    homeButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radii.xl,
        backgroundColor: colors.ui.surface,
        borderWidth: 1,
        borderColor: colors.ui.border,
    },
    homeButtonText: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
        color: colors.ui.textSecondary,
        letterSpacing: 1,
    },
});
