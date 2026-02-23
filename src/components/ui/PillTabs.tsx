/**
 * Ludo: Legends — Pill Tabs Component
 * 
 * Horizontal scrollable tab bar with pill-shaped active state.
 * Used in: shop, rankings, profile, season-pass.
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../theme/design-system';

interface Tab<T extends string> {
    id: T;
    label: string;
    icon?: string;
}

interface PillTabsProps<T extends string> {
    tabs: Tab<T>[];
    activeTab: T;
    onTabChange: (tab: T) => void;
}

export function PillTabs<T extends string>({ tabs, activeTab, onTabChange }: PillTabsProps<T>) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            {tabs.map(tab => (
                <TouchableOpacity
                    key={tab.id}
                    style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                    onPress={() => onTabChange(tab.id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === tab.id }}
                >
                    {tab.icon && <Text style={styles.tabIcon}>{tab.icon}</Text>}
                    <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { maxHeight: 48, marginBottom: spacing.md },
    content: { paddingHorizontal: spacing.base, gap: spacing.sm },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        backgroundColor: colors.ui.surface,
    },
    tabActive: {
        backgroundColor: colors.ui.accent + '20',
        borderWidth: 1,
        borderColor: colors.ui.accent + '40',
    },
    tabIcon: { fontSize: 14 },
    tabLabel: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.medium,
        color: colors.ui.textSecondary,
    },
    tabLabelActive: { color: colors.ui.accent },
});
