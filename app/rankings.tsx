/**
 * Ludo: Legends — Rankings Screen (Live Data)
 * 
 * Shows player's own rank from StorageService + leaderboard.
 * Uses shared components: ScreenHeader, PillTabs, Badge.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import { commonStyles, ON_ACCENT_COLOR } from '../src/theme/commonStyles';
import { ScreenHeader, PillTabs, Badge } from '../src/components/ui';
import { useAppData } from '../src/hooks/useAppData';
import { RankTier } from '../src/engine/types';

// ─── Types ──────────────────────────────────────────────────────

type LeaderboardLayer = 'friends' | 'local' | 'country' | 'global' | 'seasonal';

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
    platinum: colors.ui.platinum,
    diamond: colors.ui.diamond,
    legend: '#FF6B6B',
};

function getPlayerTier(elo: number): RankTier {
    if (elo >= 2000) return 'legend';
    if (elo >= 1800) return 'diamond';
    if (elo >= 1600) return 'platinum';
    if (elo >= 1400) return 'gold';
    if (elo >= 1200) return 'silver';
    return 'bronze';
}

function estimateRank(elo: number): number {
    // Rough rank estimate based on ELO
    return Math.max(1, Math.round(2500 / Math.max(elo, 100)));
}

// ─── Leaderboard entries (will come from server in online mode) ──

function generateLeaderboard(playerElo: number): Array<{
    rank: number; name: string; elo: number; tier: RankTier; wins: number; flag: string;
}> {
    const entries = [
        { rank: 1, name: 'LudoKing99', elo: 2150, wins: 342, flag: '🇧🇩' },
        { rank: 2, name: 'BoardMaster', elo: 1980, wins: 289, flag: '🇮🇳' },
        { rank: 3, name: 'DiceQueen', elo: 1850, wins: 256, flag: '🇵🇰' },
        { rank: 4, name: 'TokenRush', elo: 1720, wins: 210, flag: '🇳🇬' },
        { rank: 5, name: 'SafeZoner', elo: 1650, wins: 195, flag: '🇬🇧' },
        { rank: 6, name: 'CaptureKing', elo: 1580, wins: 170, flag: '🇺🇸' },
        { rank: 7, name: 'SixRoller', elo: 1500, wins: 155, flag: '🇦🇪' },
        { rank: 8, name: 'HomeRunner', elo: 1420, wins: 130, flag: '🇰🇪' },
    ];
    return entries.map(e => ({ ...e, tier: getPlayerTier(e.elo) }));
}

// ─── Screen ─────────────────────────────────────────────────────

export default function RankingsScreen() {
    const { progression, loading } = useAppData();
    const [activeLayer, setActiveLayer] = useState<LeaderboardLayer>('global');

    const playerElo = useMemo(() => {
        // Calculate ELO from progression (base 1000 + wins*10)
        if (!progression) return 1000;
        return 1000 + (progression.totalWins * 10);
    }, [progression]);

    const playerTier = useMemo(() => getPlayerTier(playerElo), [playerElo]);
    const playerRank = useMemo(() => estimateRank(playerElo), [playerElo]);
    const leaderboard = useMemo(() => generateLeaderboard(playerElo), [playerElo]);

    const handleTabChange = useCallback((tab: LeaderboardLayer) => {
        setActiveLayer(tab);
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={commonStyles.screen}>
                <ScreenHeader title="Rankings" />
                <View style={commonStyles.loadingContainer}>
                    <ActivityIndicator color={colors.ui.accent} size="large" />
                    <Text style={commonStyles.loadingText}>Loading rankings...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={commonStyles.screen}>
            <ScreenHeader title="Rankings" />

            <PillTabs tabs={LAYERS} activeTab={activeLayer} onTabChange={handleTabChange} />

            {/* My Rank Card — LIVE DATA */}
            <View style={styles.myRankCard}>
                <View style={styles.myRankLeft}>
                    <Text style={styles.myRankPosition}>#{playerRank}</Text>
                    <View>
                        <Text style={styles.myRankName}>You</Text>
                        <Text style={styles.myRankElo}>{playerElo.toLocaleString()} ELO</Text>
                    </View>
                </View>
                <Badge label={playerTier.toUpperCase()} color={TIER_COLORS[playerTier]} size="md" />
            </View>

            {/* Leaderboard */}
            <FlatList
                data={leaderboard}
                keyExtractor={item => String(item.rank)}
                contentContainerStyle={commonStyles.scrollContent}
                renderItem={({ item, index }) => (
                    <PlayerRow item={item} index={index} />
                )}
            />
        </SafeAreaView>
    );
}

// ─── Sub-Components (Memoized) ──────────────────────────────────

const PlayerRow = React.memo(function PlayerRow({ item, index }: {
    item: { rank: number; name: string; elo: number; tier: RankTier; wins: number; flag: string };
    index: number;
}) {
    return (
        <View style={[styles.playerRow, index < 3 && styles.topThreeRow]}>
            <View style={styles.rankCol}>
                <Text style={[
                    styles.rankNumber,
                    index === 0 && { color: TIER_COLORS.gold },
                    index === 1 && { color: TIER_COLORS.silver },
                    index === 2 && { color: TIER_COLORS.bronze },
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
                <Badge label={item.tier.toUpperCase()} color={TIER_COLORS[item.tier]} />
                <Text style={styles.winsCount}>{item.wins}W</Text>
            </View>
        </View>
    );
});

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: colors.ui.border,
    },
    topThreeRow: {
        backgroundColor: colors.ui.surface,
        borderRadius: radii.md,
        marginHorizontal: spacing.base,
        marginBottom: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 0,
    },
    rankCol: { width: 40, alignItems: 'center' },
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
    playerFlag: { fontSize: 18 },
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
    winsCount: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
        fontWeight: typography.weight.medium,
    },
});
