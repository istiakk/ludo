/**
 * Ludo: Legends — Empty State Component
 * 
 * Standardized empty state with icon, title, description, optional CTA.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../theme/design-system';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    ctaLabel?: string;
    onCta?: () => void;
}

export const EmptyState = React.memo(function EmptyState({
    icon,
    title,
    description,
    ctaLabel,
    onCta,
}: EmptyStateProps) {
    return (
        <View style={styles.container} accessibilityLabel={`${title}. ${description}`}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            {ctaLabel && onCta && (
                <TouchableOpacity style={styles.cta} onPress={onCta} accessibilityRole="button">
                    <Text style={styles.ctaText}>{ctaLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
        paddingHorizontal: spacing.xl,
    },
    icon: { fontSize: 48, marginBottom: spacing.md },
    title: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
        textAlign: 'center',
    },
    description: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        marginTop: spacing.xs,
        textAlign: 'center',
        lineHeight: typography.size.sm * 1.5,
    },
    cta: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        backgroundColor: colors.ui.accent + '20',
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: colors.ui.accent + '40',
    },
    ctaText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: colors.ui.accent,
    },
});
