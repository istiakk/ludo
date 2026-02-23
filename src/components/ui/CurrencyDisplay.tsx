/**
 * Ludo: Legends — Currency Display Component
 * 
 * Compact wallet display showing coins and gems.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme/design-system';

interface CurrencyDisplayProps {
    coins: number;
    gems: number;
}

export const CurrencyDisplay = React.memo(function CurrencyDisplay({ coins, gems }: CurrencyDisplayProps) {
    return (
        <View style={styles.container} accessibilityLabel={`${coins} coins, ${gems} gems`}>
            <Text style={styles.text}>🪙 {coins.toLocaleString()}</Text>
            <Text style={styles.text}>💎 {gems}</Text>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    text: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
    },
});
