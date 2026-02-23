/**
 * Ludo: Legends — Stat Card Component
 * 
 * Compact stat display card with icon, value, title, subtitle.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii, shadows } from '../../theme/design-system';

interface StatCardProps {
    icon: string;
    value: string;
    title: string;
    subtitle?: string;
}

export const StatCard = React.memo(function StatCard({ icon, value, title, subtitle }: StatCardProps) {
    return (
        <View style={styles.card} accessibilityLabel={`${title}: ${value}`}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        width: '47%',
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        ...shadows.sm,
    },
    icon: { fontSize: 20, marginBottom: spacing.xs },
    value: {
        fontSize: typography.size['2xl'],
        fontWeight: typography.weight.extraBold,
        color: colors.ui.text,
    },
    title: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
        color: colors.ui.textSecondary,
        marginTop: spacing.xxs,
    },
    subtitle: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
    },
});
