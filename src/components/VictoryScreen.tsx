/**
 * Ludo: Legends — Cinematic Victory Screen
 *
 * 4-phase animation: spotlight → trophy burst → stats reveal → rewards.
 * Replaces the basic "You Win" with a premium game-over experience.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radii, shadows } from '../theme/design-system';
import type { MatchStats } from '../rendering/GameEffectsEngine';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface VictoryScreenProps {
    isVisible: boolean;
    isWinner: boolean;
    winnerName: string;
    winnerColor: string;
    stats: MatchStats;
    playerName: string;
    xpEarned: number;
    coinsEarned: number;
    hasReplay?: boolean;
    onPlayReplay?: () => void;
    onRematch: () => void;
    onHome: () => void;
}

export default function VictoryScreen({
    isVisible,
    isWinner,
    winnerName,
    winnerColor,
    stats,
    playerName,
    xpEarned,
    coinsEarned,
    hasReplay,
    onPlayReplay,
    onRematch,
    onHome,
}: VictoryScreenProps) {
    // ─── Phase Animations ───────────────
    const overlayOpacity = useSharedValue(0);
    const trophyScale = useSharedValue(0);
    const trophyRotation = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const statsOpacity = useSharedValue(0);
    const rewardsOpacity = useSharedValue(0);
    const buttonsOpacity = useSharedValue(0);
    const confettiProgress = useSharedValue(0);

    useEffect(() => {
        if (!isVisible) return;

        // Phase 1: Backdrop dims (0-400ms)
        overlayOpacity.value = withTiming(1, { duration: 400 });

        // Phase 2: Trophy burst (400-1200ms)
        trophyScale.value = withSequence(
            withTiming(0, { duration: 0 }),
            withDelay(400, withSpring(1.3, { damping: 5, stiffness: 200 })),
            withSpring(1.0, { damping: 10 }),
        );
        trophyRotation.value = withSequence(
            withTiming(0, { duration: 0 }),
            withDelay(400, withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) })),
            withTiming(0, { duration: 0 }),
        );

        // Title
        titleOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));

        // Phase 3: Stats (1200-2000ms)
        statsOpacity.value = withDelay(1400, withTiming(1, { duration: 400 }));

        // Phase 4: Rewards (2000ms+)
        rewardsOpacity.value = withDelay(2000, withTiming(1, { duration: 400 }));
        buttonsOpacity.value = withDelay(2400, withTiming(1, { duration: 400 }));

        // Confetti
        confettiProgress.value = withDelay(500,
            withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) })
        );

        // Haptic sequence
        setTimeout(async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
        }, 400);
    }, [isVisible]);

    // ─── Computed Stats ─────────────────
    const playerStats = useMemo(() => {
        const playerId = Object.keys(stats.capturesMade)[0] ?? '';
        return {
            captures: stats.capturesMade[playerId] ?? 0,
            tokensHome: stats.tokensFinished[playerId] ?? 0,
            sixes: stats.sixesRolled[playerId] ?? 0,
            maxCombo: stats.maxCombo,
            turns: stats.turnsPlayed[playerId] ?? 0,
        };
    }, [stats]);

    // ─── Animated Styles ────────────────
    const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
    const trophyStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: trophyScale.value },
            { rotateZ: `${trophyRotation.value}deg` },
        ],
    }));
    const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
    const statsStyle = useAnimatedStyle(() => ({ opacity: statsOpacity.value }));
    const rewardsStyle = useAnimatedStyle(() => ({ opacity: rewardsOpacity.value }));
    const buttonsStyle = useAnimatedStyle(() => ({ opacity: buttonsOpacity.value }));

    if (!isVisible) return null;

    return (
        <Animated.View style={[styles.overlay, overlayStyle]}>
            {/* Trophy */}
            <Animated.View style={[styles.trophyContainer, trophyStyle]}>
                <Text style={styles.trophyEmoji}>
                    {isWinner ? '🏆' : '😔'}
                </Text>
            </Animated.View>

            {/* Title */}
            <Animated.View style={[styles.titleContainer, titleStyle]}>
                <Text style={[styles.titleText, { color: isWinner ? colors.ui.gold : colors.ui.textSecondary }]}>
                    {isWinner ? 'VICTORY!' : `${winnerName} Wins`}
                </Text>
                {isWinner && (
                    <Text style={styles.subtitleText}>Legendary performance!</Text>
                )}
            </Animated.View>

            {/* Stats */}
            <Animated.View style={[styles.statsGrid, statsStyle]}>
                <StatItem icon="💀" label="Captures" value={playerStats.captures} />
                <StatItem icon="🏠" label="Tokens Home" value={playerStats.tokensHome} />
                <StatItem icon="🎲" label="Lucky 6s" value={playerStats.sixes} />
                <StatItem icon="🔥" label="Max Combo" value={playerStats.maxCombo} />
            </Animated.View>

            {/* Rewards */}
            <Animated.View style={[styles.rewardsRow, rewardsStyle]}>
                <View style={styles.rewardCard}>
                    <Text style={styles.rewardIcon}>⚡</Text>
                    <Text style={styles.rewardValue}>+{xpEarned}</Text>
                    <Text style={styles.rewardLabel}>XP</Text>
                </View>
                <View style={styles.rewardCard}>
                    <Text style={styles.rewardIcon}>🪙</Text>
                    <Text style={styles.rewardValue}>+{coinsEarned}</Text>
                    <Text style={styles.rewardLabel}>Coins</Text>
                </View>
            </Animated.View>

            {/* Buttons */}
            <Animated.View style={[styles.buttonsRow, buttonsStyle]}>
                {hasReplay && onPlayReplay && (
                    <TouchableOpacity style={styles.watchBtn} onPress={onPlayReplay}>
                        <Text style={styles.watchText}>🎬 HIGHLIGHT</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.rematchBtn, { backgroundColor: winnerColor }]}
                    onPress={onRematch}
                >
                    <Text style={styles.rematchText}>🔄 REMATCH</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.homeBtn} onPress={onHome}>
                    <Text style={styles.homeText}>HOME</Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
}

// ─── Sub-Components ─────────────────────────────────────────────

const StatItem = React.memo(function StatItem({ icon, label, value }: { icon: string; label: string; value: number }) {
    return (
        <View style={styles.statItem}>
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
});

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000D9',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 500,
        paddingHorizontal: spacing.xl,
    },
    trophyContainer: {
        marginBottom: spacing.lg,
    },
    trophyEmoji: {
        fontSize: 80,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: spacing['2xl'],
    },
    titleText: {
        fontSize: typography.size['5xl'],
        fontWeight: typography.weight.extraBold,
        letterSpacing: 4,
        textShadowColor: colors.ui.gold + '4D',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 12,
    },
    subtitleText: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        marginTop: spacing.xs,
        letterSpacing: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.md,
        marginBottom: spacing['2xl'],
        maxWidth: SCREEN_W * 0.85,
    },
    statItem: {
        width: (SCREEN_W * 0.85 - spacing.md * 3) / 2,
        backgroundColor: colors.glass.medium,
        borderRadius: radii.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    statIcon: { fontSize: 20, marginBottom: spacing.xxs },
    statValue: { fontSize: typography.size['2xl'], fontWeight: typography.weight.extraBold, color: colors.ui.text },
    statLabel: { fontSize: typography.size.xs, color: colors.ui.textSecondary, marginTop: 2 },
    rewardsRow: {
        flexDirection: 'row',
        gap: spacing.lg,
        marginBottom: spacing['2xl'],
    },
    rewardCard: {
        alignItems: 'center',
        backgroundColor: colors.glass.light,
        borderRadius: radii.xl,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing['2xl'],
        borderWidth: 1,
        borderColor: colors.ui.gold + '30',
    },
    rewardIcon: { fontSize: 24, marginBottom: spacing.xs },
    rewardValue: { fontSize: typography.size.xl, fontWeight: typography.weight.extraBold, color: colors.ui.gold },
    rewardLabel: { fontSize: typography.size.xs, color: colors.ui.textSecondary, marginTop: 2 },
    buttonsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.md,
    },
    watchBtn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing['2xl'],
        borderRadius: radii.xl,
        backgroundColor: colors.ui.accent,
        ...shadows.md,
    },
    watchText: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.extraBold,
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    rematchBtn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing['2xl'],
        borderRadius: radii.xl,
        ...shadows.md,
    },
    rematchText: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.extraBold,
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    homeBtn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing['2xl'],
        borderRadius: radii.xl,
        backgroundColor: colors.ui.surface,
        borderWidth: 1,
        borderColor: colors.ui.border,
    },
    homeText: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
        color: colors.ui.textSecondary,
        letterSpacing: 2,
    },
});
