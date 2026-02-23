import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { deserializeReplay, ReplayData, ReplayFrame } from '../src/engine/ReplaySystem';
import {
    createPlayers,
    createGameState,
    executeMove,
    skipTurn,
    GameState,
} from '../src/engine';
import GameBoard from '../src/rendering/GameBoard';
import ScreenEffects from '../src/rendering/ScreenEffects';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';

export default function ReplayScreen() {
    const { data } = useLocalSearchParams<{ data: string }>();
    const router = useRouter();
    const [replay, setReplay] = useState<ReplayData | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!data) return;
        const parsed = deserializeReplay(data);
        if (parsed) {
            setReplay(parsed);

            // Reconstruct initial start state
            const initialPlayers = parsed.players.map(p => ({
                id: p.color,
                color: p.color,
                name: p.name,
                isAI: p.isAI,
                type: (p.isAI ? 'bot' : 'local') as 'bot' | 'local',
                aiDifficulty: 'intermediate' as const,
            }));
            const state = createGameState(initialPlayers, parsed.mode, parsed.matchType);
            setGameState(state);

            // Fast forward? For a clutch highlight, we may just want to play it.
            // But let's start from frame 0 for simplicity.
            setIsPlaying(true);
        }
    }, [data]);

    // Playback Loop
    useEffect(() => {
        if (isPlaying && replay && gameState) {
            const currentFrameData = replay.frames[currentFrame];
            const delay = currentFrameData?.isClutch ? 1500 : 300;

            timerRef.current = setTimeout(() => {
                if (currentFrame >= replay.frames.length) {
                    setIsPlaying(false);
                    return;
                }

                // Process next frame
                const frame = replay.frames[currentFrame];
                // Inject dice roll for accuracy
                const stateWithDice = { ...gameState, currentDice: frame.diceRoll };

                let nextState: GameState;
                if (frame.move) {
                    nextState = executeMove(stateWithDice, frame.move);
                } else {
                    nextState = skipTurn(stateWithDice);
                }

                setGameState(nextState);
                setCurrentFrame(prev => prev + 1);
            }, delay); // Slow-mo on clutch!
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isPlaying, currentFrame, replay, gameState]);

    if (!replay || !gameState) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading Highlight Reel...</Text>
            </View>
        );
    }

    const currentFrameData = replay.frames[Math.max(0, currentFrame - 1)];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>HIGHLIGHT REEL</Text>
                <Text style={styles.subtitle}>{replay.players.map(p => p.name).join(' vs ')}</Text>
            </View>

            {/* Board Viewer */}
            <View style={styles.boardWrapper}>
                <GameBoard
                    gameState={gameState}
                    selectedTokenId={null}
                    onTokenPress={() => { }}
                    onMoveSelect={() => { }}
                />
            </View>

            {/* Cinematic Overlay for Clutch */}
            {currentFrameData?.isClutch && (
                <View style={[StyleSheet.absoluteFill, styles.clutchOverlay]} pointerEvents="none">
                    <Text style={styles.clutchText}>CLUTCH MOMENT</Text>
                </View>
            )}

            {/* Footer Controls */}
            <View style={styles.footer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(currentFrame / replay.frames.length) * 100}%` }]} />
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity style={styles.btn} onPress={() => setIsPlaying(!isPlaying)}>
                        <Text style={styles.btnText}>{isPlaying ? '⏸ PAUSE' : '▶️ PLAY'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.exitBtn]} onPress={() => router.back()}>
                        <Text style={styles.btnText}>EXIT</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A', // Dark cinematic background
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F172A',
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: typography.size.lg,
    },
    header: {
        padding: spacing.md,
        alignItems: 'center',
    },
    title: {
        color: colors.ui.gold,
        fontSize: typography.size.xl,
        fontWeight: typography.weight.extraBold,
        letterSpacing: 3,
    },
    subtitle: {
        color: colors.ui.textSecondary,
        fontSize: typography.size.sm,
        marginTop: spacing.xs,
    },
    boardWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clutchOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(230, 57, 70, 0.1)', // Red tint for slow-mo adrenaline
    },
    clutchText: {
        color: '#E63946',
        fontSize: typography.size['4xl'],
        fontWeight: typography.weight.extraBold,
        textShadowColor: '#000000',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
        letterSpacing: 8,
        transform: [{ scale: 1.2 }, { rotate: '-5deg' }],
    },
    footer: {
        padding: spacing.xl,
        paddingBottom: spacing['3xl'],
    },
    progressBar: {
        height: 4,
        backgroundColor: colors.glass.medium,
        borderRadius: 2,
        marginBottom: spacing.lg,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.ui.accent,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.lg,
    },
    btn: {
        backgroundColor: colors.glass.light,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    exitBtn: {
        backgroundColor: 'rgba(230, 57, 70, 0.2)', // Red back button
        borderColor: 'rgba(230, 57, 70, 0.5)',
    },
    btnText: {
        color: '#FFFFFF',
        fontWeight: typography.weight.bold,
        letterSpacing: 1,
    },
});
