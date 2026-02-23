/**
 * Ludo: Legends — Cosmetics Shop Screen
 * 
 * Live wallet, real buy flow with EconomyEngine, owned/equipped tracking.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    FlatList,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import { commonStyles, ON_ACCENT_COLOR } from '../src/theme/commonStyles';
import { ScreenHeader, CurrencyDisplay } from '../src/components/ui';
import {
    COSMETICS_CATALOG,
    Cosmetic,
    CosmeticCategory,
    CosmeticRarity,
} from '../src/services/ProgressionService';
import {
    getWallet,
    saveWallet,
    getOwnedCosmetics,
    saveOwnedCosmetics,
    getEquippedCosmetics,
    saveEquippedCosmetics,
    getProgression,
    StoredWallet,
    StoredProgression,
} from '../src/services/StorageService';
import { canAfford, processTransaction } from '../src/services/EconomyEngine';

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
    const [loading, setLoading] = useState(true);

    // Live data
    const [wallet, setWallet] = useState<StoredWallet>({ coins: 0, gems: 0 });
    const [owned, setOwned] = useState<string[]>([]);
    const [equipped, setEquipped] = useState<Record<string, string | null>>({});
    const [progression, setProgression] = useState<StoredProgression | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [w, o, e, p] = await Promise.all([
                getWallet(),
                getOwnedCosmetics(),
                getEquippedCosmetics(),
                getProgression(),
            ]);
            setWallet(w);
            setOwned(o);
            setEquipped(e);
            setProgression(p);
        } catch (error) {
            console.warn('[Shop] Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredItems = useMemo(() => {
        if (activeCategory === 'all') return COSMETICS_CATALOG;
        return COSMETICS_CATALOG.filter(item => item.category === activeCategory);
    }, [activeCategory]);

    const handlePurchase = useCallback(async (item: Cosmetic) => {
        if (owned.includes(item.id)) {
            // Already owned → toggle equip
            const newEquipped = { ...equipped };
            if (equipped[item.category] === item.id) {
                newEquipped[item.category] = null; // Unequip
            } else {
                newEquipped[item.category] = item.id; // Equip
            }
            setEquipped(newEquipped);
            await saveEquippedCosmetics(newEquipped);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            return;
        }

        // Check affordability
        if (!canAfford(wallet, item.price.currency, item.price.amount)) {
            Alert.alert(
                'Not enough ' + (item.price.currency === 'coins' ? 'coins' : 'gems'),
                `You need ${item.price.amount} ${item.price.currency} but have ${wallet[item.price.currency]}.`,
            );
            return;
        }

        // Process purchase
        Alert.alert(
            'Buy ' + item.name + '?',
            `${item.price.currency === 'coins' ? '🪙' : '💎'} ${item.price.amount} ${item.price.currency}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy',
                    onPress: async () => {
                        const result = processTransaction(
                            wallet,
                            'purchase_cosmetic',
                            item.price.currency,
                            -item.price.amount,
                            `Purchased ${item.name}`,
                        );

                        if ('error' in result) {
                            Alert.alert('Error', result.error);
                            return;
                        }

                        // Save updated wallet
                        setWallet(result.wallet);
                        await saveWallet(result.wallet);

                        // Save owned cosmetics
                        const newOwned = [...owned, item.id];
                        setOwned(newOwned);
                        await saveOwnedCosmetics(newOwned);

                        // Auto-equip if nothing equipped in that category
                        if (!equipped[item.category]) {
                            const newEquipped = { ...equipped, [item.category]: item.id };
                            setEquipped(newEquipped);
                            await saveEquippedCosmetics(newEquipped);
                        }

                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    },
                },
            ],
        );
    }, [wallet, owned, equipped]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.ui.accent} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={commonStyles.screen}>
            {/* Header */}
            <ScreenHeader
                title="Shop"
                rightElement={<CurrencyDisplay coins={wallet.coins} gems={wallet.gems} />}
            />

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
                renderItem={({ item }) => (
                    <ShopItem
                        item={item}
                        isOwned={owned.includes(item.id)}
                        isEquipped={equipped[item.category] === item.id}
                        canBuy={canAfford(wallet, item.price.currency, item.price.amount)}
                        onPress={() => handlePurchase(item)}
                    />
                )}
            />
        </SafeAreaView>
    );
}

function ShopItem({ item, isOwned, isEquipped, canBuy, onPress }: {
    item: Cosmetic; isOwned: boolean; isEquipped: boolean; canBuy: boolean; onPress: () => void;
}) {
    const rarityColor = RARITY_COLORS[item.rarity];

    return (
        <TouchableOpacity
            style={[
                styles.shopCard,
                { borderColor: isOwned ? colors.ui.accent + '40' : rarityColor + '30' },
                isEquipped && { backgroundColor: colors.ui.accent + '08' },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Status badge */}
            {isEquipped ? (
                <View style={[styles.rarityBadge, { backgroundColor: colors.ui.accent + '20' }]}>
                    <Text style={[styles.rarityText, { color: colors.ui.accent }]}>EQUIPPED</Text>
                </View>
            ) : isOwned ? (
                <View style={[styles.rarityBadge, { backgroundColor: colors.ui.success + '20' }]}>
                    <Text style={[styles.rarityText, { color: colors.ui.success }]}>OWNED</Text>
                </View>
            ) : (
                <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '20' }]}>
                    <Text style={[styles.rarityText, { color: rarityColor }]}>
                        {item.rarity.toUpperCase()}
                    </Text>
                </View>
            )}

            {/* Icon */}
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>

            {/* Price / Action */}
            <View style={styles.priceRow}>
                {isOwned ? (
                    <Text style={[styles.priceText, { color: colors.ui.accent }]}>
                        {isEquipped ? '✓ Active' : 'Tap to equip'}
                    </Text>
                ) : (
                    <Text style={[styles.priceText, !canBuy && { opacity: 0.4 }]}>
                        {item.price.currency === 'coins' ? '🪙' : '💎'} {item.price.amount}
                    </Text>
                )}
            </View>

            {/* Unlock requirement */}
            {!isOwned && item.unlockRequirement && (
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
    container: { flex: 1, backgroundColor: colors.ui.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    },
    backBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
    backText: { fontSize: typography.size.base, color: colors.ui.accent, fontWeight: typography.weight.medium },
    headerTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.ui.textTertiary, letterSpacing: 3 },
    currencyDisplay: { flexDirection: 'row', gap: spacing.md },
    currencyText: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.ui.text },
    tabBar: { maxHeight: 48, marginBottom: spacing.md },
    tabBarContent: { paddingHorizontal: spacing.base, gap: spacing.sm },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        borderRadius: radii.full, backgroundColor: colors.ui.surface,
    },
    tabActive: { backgroundColor: colors.ui.accent + '20', borderWidth: 1, borderColor: colors.ui.accent + '40' },
    tabIcon: { fontSize: 14 },
    tabLabel: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, color: colors.ui.textSecondary },
    tabLabelActive: { color: colors.ui.accent },
    gridContent: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
    gridRow: { gap: spacing.md, marginBottom: spacing.md },
    shopCard: {
        flex: 1, backgroundColor: colors.ui.surface, borderRadius: radii.lg,
        padding: spacing.md, borderWidth: 1, ...shadows.sm,
    },
    rarityBadge: {
        alignSelf: 'flex-start', paddingHorizontal: spacing.sm,
        paddingVertical: 2, borderRadius: radii.full, marginBottom: spacing.sm,
    },
    rarityText: { fontSize: 9, fontWeight: typography.weight.bold, letterSpacing: 1 },
    itemIcon: { fontSize: 32, marginBottom: spacing.sm },
    itemName: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.ui.text, marginBottom: spacing.xxs },
    itemDesc: { fontSize: typography.size.xs, color: colors.ui.textSecondary, lineHeight: typography.size.xs * 1.4, marginBottom: spacing.sm },
    priceRow: { marginTop: 'auto' as const },
    priceText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.ui.text },
    unlockReq: { marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.ui.border },
    unlockText: { fontSize: 10, color: colors.ui.textTertiary },
});
