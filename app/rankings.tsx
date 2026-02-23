/**
 * Ludo: Legends — Rankings Screen
 * 
 * Multi-layer leaderboard: Friends → Local → Country → Global → Seasonal
 * 
 * SME Agent: ui-ux-pro-max, mobile-design
 */

import React, { useState } from 'react';
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
import { RankTier } from '../src/engine/types';

type LeaderboardLayer = 'friends' | 'local' | 'country' | 'global' | 'seasonal';

// Mock leaderboard data
const MOCK_PLAYERS = [
    { rank: 1, name: 'LudoKing99', elo: 2150, tier: 'legend' as RankTier, wins: 342, flag: '🇧🇩' },
    { rank: 2, name: 'BoardMaster', elo: 1980, tier: 'diamond' as RankTier, wins: 289, flag: '🇮🇳' },
    { rank: 3, name: 'DiceQueen', elo: 1850, tier: 'platinum' as RankTier, wins: 256, flag: '🇵🇰' },
    { rank: 4, name: 'TokenRush', elo: 1720, tier: 'gold' as RankTier, wins: 210, flag: '🇳🇬' },
    { rank: 5, name: 'SafeZoner', elo: 1650, tier: 'gold' as RankTier, wins: 195, flag: '🇬🇧' },
    { rank: 6, name: 'CaptureKing', elo: 1580, tier: 'silver' as RankTier, wins: 170, flag: '🇺🇸' },
    { rank: 7, name: 'SixRoller', elo: 1500, tier: 'silver' as RankTier, wins: 155, flag: '🇦🇪' },
    { rank: 8, name: 'HomeRunner', elo: 1420, tier: 'bronze' as RankTier, wins: 130, flag: '🇰🇪' },
];

const LAYERS: { id: LeaderboardLayer; label: string; icon: string }[] = [
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'local', label: 'Local', icon: '📍' },
    { id: 'country', label: 'Country', icon: '🌍' },
    { id: 'global', label: 'Global', icon: '🏆' },
    { id: 'seasonal', label: 'Season', icon: '⭐' },
];

const TIER_COLORS: Record<RankTier, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF',
    legend: '#FF6B6B',
};

export default function RankingsScreen() {
    const router = useRouter();
    const [activeLayer, setActiveLayer] = useState<LeaderboardLayer>('global');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>RANKINGS</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Layer Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabBar}
                contentContainerStyle={styles.tabBarContent}
            >
                {LAYERS.map(layer => (
                    <TouchableOpacity
                        key={layer.id}
                        style={[
                            styles.tab,
                            activeLayer === layer.id && styles.tabActive,
                        ]}
                        onPress={() => setActiveLayer(layer.id)}
                    >
                        <Text style={styles.tabIcon}>{layer.icon}</Text>
                        <Text style={[
                            styles.tabLabel,
                            activeLayer === layer.id && styles.tabLabelActive,
                        ]}>
                            {layer.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* My Rank Card */}
            <View style={styles.myRankCard}>
                <View style={styles.myRankLeft}>
                    <Text style={styles.myRankPosition}>#42</Text>
                    <View>
                        <Text style={styles.myRankName}>You</Text>
                        <Text style={styles.myRankElo}>1,350 ELO</Text>
                    </View>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS.silver + '30' }]}>
                    <Text style={[styles.tierText, { color: TIER_COLORS.silver }]}>SILVER</Text>
                </View>
            </View>

            {/* Leaderboard */}
            <FlatList
                data={MOCK_PLAYERS}
                keyExtractor={item => String(item.rank)}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <View style={[
                        styles.playerRow,
                        index < 3 && styles.topThreeRow,
                    ]}>
                        <View style={styles.rankCol}>
                            <Text style={[
                                styles.rankNumber,
                                index === 0 && { color: '#FFD700' },
                                index === 1 && { color: '#C0C0C0' },
                                index === 2 && { color: '#CD7F32' },
                            ]}>
                                {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${item.rank}`}
                            </Text>
                        </View>
                        <View style={styles.playerInfo}>
                            <Text style={styles.playerFlag}>{item.flag}</Text>
                            <View>
                                <Text style={styles.playerName}>{item.name}</Text>
                                <Text style={styles.playerElo}>{item.elo.toLocaleString()} ELO</Text>
                            </View>
                        </View>
                        <View style={styles.playerStats}>
                            <View style={[styles.tierBadgeSmall, { backgroundColor: TIER_COLORS[item.tier] + '25' }]}>
                                <Text style={[styles.tierTextSmall, { color: TIER_COLORS[item.tier] }]}>
                                    {item.tier.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.winsCount}>{item.wins}W</Text>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
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
    myRankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: spacing.base,
        marginBottom: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.ui.surfaceElevated,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.ui.accent + '30',
        ...shadows.sm,
    },
    myRankLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    myRankPosition: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.extraBold,
        color: colors.ui.accent,
    },
    myRankName: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
    },
    myRankElo: {
        fontSize: typography.size.xs,
        color: colors.ui.textSecondary,
    },
    tierBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radii.full,
    },
    tierText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        letterSpacing: 2,
    },
    listContent: {
        paddingHorizontal: spacing.base,
        paddingBottom: spacing['3xl'],
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.ui.border,
    },
    topThreeRow: {
        backgroundColor: colors.ui.surface,
        borderRadius: radii.md,
        marginBottom: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 0,
    },
    rankCol: {
        width: 40,
        alignItems: 'center',
    },
    rankNumber: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
        color: colors.ui.textSecondary,
    },
    playerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    playerFlag: {
        fontSize: 18,
    },
    playerName: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.semiBold,
        color: colors.ui.text,
    },
    playerElo: {
        fontSize: typography.size.xs,
        color: colors.ui.textSecondary,
    },
    playerStats: {
        alignItems: 'flex-end',
        gap: spacing.xxs,
    },
    tierBadgeSmall: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.full,
    },
    tierTextSmall: {
        fontSize: 9,
        fontWeight: typography.weight.bold,
        letterSpacing: 1,
    },
    winsCount: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
        fontWeight: typography.weight.medium,
    },
});
