/**
 * Ludo: Legends — Badge Component
 * 
 * Tier/rarity/status badge pill with configurable color.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, radii } from '../../theme/design-system';

interface BadgeProps {
    label: string;
    color: string;
    /** 'sm' (9pt) or 'md' (11pt) */
    size?: 'sm' | 'md';
}

export const Badge = React.memo(function Badge({ label, color, size = 'sm' }: BadgeProps) {
    const fontSize = size === 'sm' ? 9 : 11;
    const paddingV = size === 'sm' ? 2 : spacing.xxs;

    return (
        <View style={[styles.badge, { backgroundColor: color + '20', paddingVertical: paddingV }]}>
            <Text style={[styles.text, { color, fontSize }]}>{label}</Text>
        </View>
    );
});

const styles = StyleSheet.create({
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        borderRadius: radii.full,
    },
    text: {
        fontWeight: typography.weight.bold,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
