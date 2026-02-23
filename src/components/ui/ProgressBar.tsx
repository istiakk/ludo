/**
 * Ludo: Legends — Progress Bar Component
 * 
 * Reusable progress bar with labels. Used in: profile XP, season pass, missions.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../theme/design-system';

interface ProgressBarProps {
    current: number;
    total: number;
    color?: string;
    height?: number;
    showLabel?: boolean;
    labelLeft?: string;
    labelRight?: string;
}

export const ProgressBar = React.memo(function ProgressBar({
    current,
    total,
    color = colors.ui.accent,
    height = 6,
    showLabel = false,
    labelLeft,
    labelRight,
}: ProgressBarProps) {
    const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

    return (
        <View style={styles.container}>
            {showLabel && (
                <View style={styles.labelRow}>
                    {labelLeft && <Text style={styles.label}>{labelLeft}</Text>}
                    {labelRight && <Text style={styles.label}>{labelRight}</Text>}
                </View>
            )}
            <View style={[styles.track, { height }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: current }}>
                <View style={[styles.fill, { width: `${Math.max(percent, 2)}%`, backgroundColor: color, height }]} />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: { width: '100%' },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    label: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
        fontWeight: typography.weight.medium,
    },
    track: {
        borderRadius: radii.full,
        backgroundColor: colors.ui.border,
        overflow: 'hidden',
    },
    fill: {
        borderRadius: radii.full,
    },
});
