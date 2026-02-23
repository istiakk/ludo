/**
 * Ludo: Legends — Screen Header Component
 * 
 * Standardized header across all screens: back button + title + optional right element.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../theme/design-system';

interface ScreenHeaderProps {
    title: string;
    onBack?: () => void;
    rightElement?: React.ReactNode;
    showBack?: boolean;
}

export const ScreenHeader = React.memo(function ScreenHeader({
    title,
    onBack,
    rightElement,
    showBack = true,
}: ScreenHeaderProps) {
    const router = useRouter();

    const handleBack = onBack ?? (() => router.back());

    return (
        <View style={styles.header}>
            {showBack ? (
                <TouchableOpacity onPress={handleBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.spacer} />
            )}
            <Text style={styles.title} accessibilityRole="header">{title}</Text>
            {rightElement ?? <View style={styles.spacer} />}
        </View>
    );
});

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        minHeight: 52,
    },
    backBtn: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        minWidth: 60,
    },
    backText: {
        fontSize: typography.size.base,
        color: colors.ui.accent,
        fontWeight: typography.weight.medium,
    },
    title: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary,
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    spacer: { minWidth: 60 },
});
