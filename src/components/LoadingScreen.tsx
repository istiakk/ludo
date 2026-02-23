/**
 * Ludo: Legends — Loading Screen
 * 
 * Premium animated loading indicator used during
 * game initialization, matchmaking, and screen transitions.
 */

import React from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { colors, typography, spacing } from '../theme/design-system';

interface LoadingScreenProps {
    message?: string;
    submessage?: string;
    showDice?: boolean;
}

export function LoadingScreen({
    message = 'Loading...',
    submessage,
    showDice = true,
}: LoadingScreenProps) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {showDice && <Text style={styles.dice}>🎲</Text>}
                <ActivityIndicator
                    size="large"
                    color={colors.ui.accent}
                    style={styles.spinner}
                />
                <Text style={styles.message}>{message}</Text>
                {submessage && (
                    <Text style={styles.submessage}>{submessage}</Text>
                )}
            </View>

            {/* Animated dots */}
            <View style={styles.dotsContainer}>
                {[0, 1, 2].map(i => (
                    <View
                        key={i}
                        style={[styles.dot, { opacity: 0.3 + (i * 0.3) }]}
                    />
                ))}
            </View>
        </SafeAreaView>
    );
}

/**
 * Matchmaking-specific loading screen.
 */
export function MatchmakingScreen({
    queuePosition,
    searchTime,
    mode,
}: {
    queuePosition?: number;
    searchTime?: number;
    mode?: string;
}) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.matchIcon}>⚔️</Text>
                <Text style={styles.matchTitle}>FINDING MATCH</Text>
                <Text style={styles.matchMode}>{mode?.toUpperCase() ?? 'CLASSIC'}</Text>

                <ActivityIndicator
                    size="large"
                    color={colors.ui.accent}
                    style={styles.spinner}
                />

                {queuePosition != null && (
                    <Text style={styles.queueInfo}>
                        Queue position: #{queuePosition}
                    </Text>
                )}
                {searchTime != null && (
                    <Text style={styles.searchTime}>
                        Searching: {Math.floor(searchTime / 1000)}s
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ui.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    dice: {
        fontSize: 48,
        marginBottom: spacing.lg,
    },
    spinner: {
        marginVertical: spacing.lg,
    },
    message: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.medium,
        color: colors.ui.text,
    },
    submessage: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        marginTop: spacing.sm,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing['3xl'],
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.ui.accent,
    },
    matchIcon: {
        fontSize: 56,
        marginBottom: spacing.md,
    },
    matchTitle: {
        fontSize: typography.size['2xl'],
        fontWeight: typography.weight.extraBold,
        color: colors.ui.text,
        letterSpacing: 4,
    },
    matchMode: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
        color: colors.ui.accent,
        letterSpacing: 3,
        marginTop: spacing.xs,
    },
    queueInfo: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        marginTop: spacing.sm,
    },
    searchTime: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
        marginTop: spacing.xs,
    },
});
