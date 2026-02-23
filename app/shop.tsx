/**
 * Ludo: Legends — Cosmetics Shop Screen
 * 
 * Premium shop with categories, rarity filters, and unlock progress.
 * 
 * SME Agent: ui-ux-pro-max, mobile-design, game-development/game-design
 */

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import {
    COSMETICS_CATALOG,
    Cosmetic,
    CosmeticCategory,
    CosmeticRarity,
} from '../src/services/ProgressionService';

type FilterCategory = CosmeticCategory | 'all';

const CATEGORY_LABELS: Record<FilterCategory, { label: string; icon: string }> = {
    all: { label: 'All', icon: '🎁' },
    token_skin: { label: 'Tokens', icon: '⭕' },
    dice_style: { label: 'Dice', icon: '🎲' },
    board_theme: { label: 'Boards', icon: '🎯' },
    emote: { label: 'Emotes', icon: '💬' },
    trail_effect: { label: 'Trails', icon: '✨' },
};

const RARITY_COLORS: Record<CosmeticRarity, string> = {
    common: '#8B949E',
    rare: '#58A6FF',
    epic: '#BC8CFF',
    legendary: '#FFA657',
};

export default function ShopScreen() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');

    const filteredItems = useMemo(() => {
        if (activeCategory === 'all') return COSMETICS_CATALOG;
        return COSMETICS_CATALOG.filter(item => item.category === activeCategory);
    }, [activeCategory]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SHOP</Text>
                <View style={styles.currencyDisplay}>
                    <Text style={styles.currencyText}>🪙 1,250</Text>
                    <Text style={styles.currencyText}>💎 15</Text>
                </View>
            </View>

            {/* Category Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabBar}
                contentContainerStyle={styles.tabBarContent}
            >
                {(Object.entries(CATEGORY_LABELS) as [FilterCategory, { label: string; icon: string }][]).map(
                    ([key, { label, icon }]) => (
                        <TouchableOpacity
                            key={key}
                            style={[styles.tab, activeCategory === key && styles.tabActive]}
                            onPress={() => setActiveCategory(key)}
                        >
                            <Text style={styles.tabIcon}>{icon}</Text>
                            <Text style={[styles.tabLabel, activeCategory === key && styles.tabLabelActive]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ),
                )}
            </ScrollView>

            {/* Items Grid */}
            <FlatList
                data={filteredItems}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={styles.gridRow}
                renderItem={({ item }) => <ShopItem item={item} />}
            />
        </SafeAreaView>
    );
}

function ShopItem({ item }: { item: Cosmetic }) {
    const rarityColor = RARITY_COLORS[item.rarity];

    return (
        <TouchableOpacity style={[styles.shopCard, { borderColor: rarityColor + '30' }]} activeOpacity={0.7}>
            {/* Rarity badge */}
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '20' }]}>
                <Text style={[styles.rarityText, { color: rarityColor }]}>
                    {item.rarity.toUpperCase()}
                </Text>
            </View>

            {/* Icon */}
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>

            {/* Price */}
            <View style={styles.priceRow}>
                <Text style={styles.priceText}>
                    {item.price.currency === 'coins' ? '🪙' : '💎'} {item.price.amount}
                </Text>
            </View>

            {/* Unlock requirement */}
            {item.unlockRequirement && (
                <View style={styles.unlockReq}>
                    <Text style={styles.unlockText}>
                        🔒 {formatUnlockRequirement(item.unlockRequirement)}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

function formatUnlockRequirement(req: NonNullable<Cosmetic['unlockRequirement']>): string {
    switch (req.type) {
        case 'level': return `Level ${req.level}`;
        case 'wins': return `${req.count} wins`;
        case 'captures': return `${req.count} captures`;
        case 'streak': return `${req.count} win streak`;
        case 'rank': return `${req.tier} rank`;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ui.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
    },
    backBtn: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    backText: {
        fontSize: typography.size.base,
        color: colors.ui.accent,
        fontWeight: typography.weight.medium,
    },
    headerTitle: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary,
        letterSpacing: 3,
    },
    currencyDisplay: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    currencyText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
    },
    tabBar: {
        maxHeight: 48,
        marginBottom: spacing.md,
    },
    tabBarContent: {
        paddingHorizontal: spacing.base,
        gap: spacing.sm,
    },
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
    tabIcon: {
        fontSize: 14,
    },
    tabLabel: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.medium,
        color: colors.ui.textSecondary,
    },
    tabLabelActive: {
        color: colors.ui.accent,
    },
    gridContent: {
        paddingHorizontal: spacing.base,
        paddingBottom: spacing['3xl'],
    },
    gridRow: {
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    shopCard: {
        flex: 1,
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        borderWidth: 1,
        ...shadows.sm,
    },
    rarityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.full,
        marginBottom: spacing.sm,
    },
    rarityText: {
        fontSize: 9,
        fontWeight: typography.weight.bold,
        letterSpacing: 1,
    },
    itemIcon: {
        fontSize: 32,
        marginBottom: spacing.sm,
    },
    itemName: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
        marginBottom: spacing.xxs,
    },
    itemDesc: {
        fontSize: typography.size.xs,
        color: colors.ui.textSecondary,
        lineHeight: typography.size.xs * 1.4,
        marginBottom: spacing.sm,
    },
    priceRow: {
        marginTop: 'auto' as const,
    },
    priceText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
    },
    unlockReq: {
        marginTop: spacing.xs,
        paddingTop: spacing.xs,
        borderTopWidth: 1,
        borderTopColor: colors.ui.border,
    },
    unlockText: {
        fontSize: 10,
        color: colors.ui.textTertiary,
    },
});
