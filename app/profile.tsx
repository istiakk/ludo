/**
 * Ludo: Legends — Profile & Scorecard Screen
 * 
 * Player profile with REAL stats, match history, and cosmetics.
 * All data loaded from StorageService on mount.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import { commonStyles } from '../src/theme/commonStyles';
import { ScreenHeader, CurrencyDisplay, ProgressBar } from '../src/components/ui';
import {
    getProgression,
    getProfile,
    getMatchHistory,
    getOwnedCosmetics,
    getEquippedCosmetics,
    getWallet,
    StoredProfile,
    StoredProgression,
    StoredMatch,
} from '../src/services/StorageService';
import { xpForLevel, COSMETICS_CATALOG } from '../src/services/ProgressionService';

// ─── Tier System ────────────────────────────────────────────────

const TIERS = [
    { name: 'Bronze', minElo: 0, color: '#CD7F32', icon: '🥉' },
    { name: 'Silver', minElo: 1000, color: '#C0C0C0', icon: '🥈' },
    { name: 'Gold', minElo: 1200, color: '#FFD700', icon: '🥇' },
    { name: 'Platinum', minElo: 1400, color: '#E5E4E2', icon: '💠' },
    { name: 'Diamond', minElo: 1600, color: '#B9F2FF', icon: '💎' },
    { name: 'Legend', minElo: 1800, color: '#FF6B6B', icon: '👑' },
];

function getTier(elo: number) {
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (elo >= TIERS[i].minElo) return TIERS[i];
    }
    return TIERS[0];
}

export default function ProfileScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'cosmetics'>('stats');
    const [loading, setLoading] = useState(true);

    // Live data
    const [profile, setProfile] = useState<StoredProfile | null>(null);
    const [progression, setProgression] = useState<StoredProgression | null>(null);
    const [wallet, setWallet] = useState({ coins: 0, gems: 0 });
    const [history, setHistory] = useState<StoredMatch[]>([]);
    const [ownedCosmetics, setOwnedCosmetics] = useState<string[]>([]);
    const [equippedCosmetics, setEquippedCosmetics] = useState<Record<string, string | null>>({});

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [prof, prog, w, hist, owned, equipped] = await Promise.all([
                getProfile(),
                getProgression(),
                getWallet(),
                getMatchHistory(),
                getOwnedCosmetics(),
                getEquippedCosmetics(),
            ]);
            setProfile(prof);
            setProgression(prog);
            setWallet(w);
            setHistory(hist);
            setOwnedCosmetics(owned);
            setEquippedCosmetics(equipped);
        } catch (error) {
            console.warn('[Profile] Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading || !progression) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.ui.accent} />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const elo = profile?.elo ?? 1000;
    const tier = getTier(elo);
    const displayName = profile?.displayName ?? 'Player';
    const winRate = progression.totalGames > 0
        ? Math.round((progression.totalWins / progression.totalGames) * 100)
        : 0;
    const xpNeeded = xpForLevel(progression.level);
    const xpPercent = xpNeeded > 0 ? Math.round((progression.xp / xpNeeded) * 100) : 0;

    // Match stats from history
    const totalCaptures = history.reduce((sum, m) => sum + m.captures, 0);

    return (
        <SafeAreaView style={commonStyles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <ScreenHeader
                    title="Profile"
                    rightElement={<CurrencyDisplay coins={wallet.coins} gems={wallet.gems} />}
                />

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatar}>👤</Text>
                        <View style={[styles.tierRing, { borderColor: tier.color }]} />
                    </View>
                    <Text style={styles.playerName}>{displayName}</Text>
                    <Text style={styles.playerTitle}>
                        {tier.icon} {tier.name} • {elo.toLocaleString()} ELO
                    </Text>

                    {/* XP Bar */}
                    <View style={styles.xpSection}>
                        <View style={styles.xpHeader}>
                            <Text style={styles.levelBadge}>Lv. {progression.level}</Text>
                            <Text style={styles.xpCount}>{progression.xp}/{xpNeeded} XP</Text>
                        </View>
                        <View style={styles.xpBarBg}>
                            <View style={[styles.xpBarFill, { width: `${Math.min(xpPercent, 100)}%` }]} />
                        </View>
                    </View>

                    <View style={styles.quickStats}>
                        <QuickStat label="Wins" value={progression.totalWins.toString()} />
                        <QuickStat label="Win Rate" value={`${winRate}%`} />
                        <QuickStat
                            label="Streak"
                            value={progression.winStreak > 0 ? `${progression.winStreak}🔥` : '0'}
                        />
                        <QuickStat label="Captures" value={totalCaptures.toString()} />
                    </View>
                </View>

                {/* Tab Bar */}
                <View style={styles.tabBar}>
                    {(['stats', 'history', 'cosmetics'] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Total Games"
                            value={progression.totalGames.toString()}
                            subtitle={`${progression.totalWins}W / ${progression.totalGames - progression.totalWins}L`}
                            icon="🎮"
                        />
                        <StatCard
                            title="Best Streak"
                            value={progression.bestStreak.toString()}
                            subtitle="Consecutive wins"
                            icon="🔥"
                        />
                        <StatCard
                            title="Total Captures"
                            value={totalCaptures.toString()}
                            subtitle={progression.totalGames > 0
                                ? `${(totalCaptures / progression.totalGames).toFixed(1)}/game`
                                : 'No games yet'}
                            icon="💥"
                        />
                        <StatCard
                            title="Avg Duration"
                            value={history.length > 0
                                ? `${Math.round(history.reduce((s, m) => s + m.duration, 0) / history.length / 60)}m`
                                : '—'}
                            subtitle="Per match"
                            icon="⏱️"
                        />
                        <StatCard
                            title="Coins Earned"
                            value={wallet.coins.toLocaleString()}
                            subtitle="Lifetime total"
                            icon="🪙"
                        />
                        <StatCard title="Level" value={progression.level.toString()} subtitle={`${xpPercent}% to next`} icon="⭐" />
                    </View>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <View style={styles.historyList}>
                        {history.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🎲</Text>
                                <Text style={styles.emptyTitle}>No matches yet</Text>
                                <Text style={styles.emptyDesc}>Play your first game to see history here!</Text>
                            </View>
                        ) : (
                            history.slice(0, 20).map(match => (
                                <MatchHistoryItem
                                    key={match.id}
                                    result={match.result}
                                    opponent={match.opponentName}
                                    mode={match.mode}
                                    elo={match.eloChange > 0 ? `+${match.eloChange}` : `${match.eloChange}`}
                                    time={`${Math.round(match.duration / 60)}m`}
                                    ago={formatTimeAgo(match.playedAt)}
                                />
                            ))
                        )}
                    </View>
                )}

                {/* Cosmetics Tab */}
                {activeTab === 'cosmetics' && (
                    <View style={styles.cosmeticsSection}>
                        <Text style={styles.sectionLabel}>
                            YOUR COLLECTION ({ownedCosmetics.length}/{COSMETICS_CATALOG.length})
                        </Text>
                        {ownedCosmetics.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🛍️</Text>
                                <Text style={styles.emptyTitle}>No cosmetics yet</Text>
                                <Text style={styles.emptyDesc}>Visit the shop to get your first cosmetic!</Text>
                            </View>
                        ) : (
                            <View style={styles.cosmeticsGrid}>
                                {COSMETICS_CATALOG.filter(c => ownedCosmetics.includes(c.id)).map(item => (
                                    <CosmeticItem
                                        key={item.id}
                                        name={item.name}
                                        icon={item.icon}
                                        equipped={equippedCosmetics[item.category] === item.id}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// ─── Sub-Components ─────────────────────────────────────────────

function QuickStat({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{value}</Text>
            <Text style={styles.quickStatLabel}>{label}</Text>
        </View>
    );
}

function StatCard({
    title, value, subtitle, icon,
}: { title: string; value: string; subtitle: string; icon: string }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={styles.statSubtitle}>{subtitle}</Text>
        </View>
    );
}

function MatchHistoryItem({
    result, opponent, mode, elo, time, ago,
}: { result: 'win' | 'loss'; opponent: string; mode: string; elo: string; time: string; ago: string }) {
    return (
        <View style={styles.historyItem}>
            <View style={[styles.resultDot, {
                backgroundColor: result === 'win' ? colors.ui.success : colors.ui.error,
            }]} />
            <View style={styles.historyInfo}>
                <Text style={styles.historyOpponent}>vs {opponent}</Text>
                <Text style={styles.historyMode}>{mode} • {time} • {ago}</Text>
            </View>
            <Text style={[styles.historyElo, {
                color: result === 'win' ? colors.ui.success : colors.ui.error,
            }]}>
                {elo}
            </Text>
        </View>
    );
}

function CosmeticItem({ name, icon, equipped }: { name: string; icon: string; equipped: boolean }) {
    return (
        <View style={[styles.cosmeticItem, equipped && styles.cosmeticEquipped]}>
            <Text style={styles.cosmeticIcon}>{icon}</Text>
            <Text style={styles.cosmeticName}>{name}</Text>
            {equipped && <Text style={styles.equippedBadge}>EQUIPPED</Text>}
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.ui.background },
    scrollContent: { paddingBottom: spacing['3xl'] },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
    loadingText: { fontSize: typography.size.sm, color: colors.ui.textSecondary },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    },
    backBtn: { paddingVertical: spacing.xs },
    backText: { fontSize: typography.size.base, color: colors.ui.accent, fontWeight: typography.weight.medium },
    walletDisplay: { flexDirection: 'row', gap: spacing.md },
    walletText: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.ui.text },
    profileCard: {
        alignItems: 'center', paddingVertical: spacing.xl,
        marginHorizontal: spacing.base, backgroundColor: colors.ui.surface,
        borderRadius: radii.xl, ...shadows.md,
    },
    avatarContainer: { position: 'relative', marginBottom: spacing.md },
    avatar: { fontSize: 48 },
    tierRing: {
        position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
        borderRadius: radii.full, borderWidth: 3,
    },
    playerName: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.ui.text },
    playerTitle: { fontSize: typography.size.sm, color: colors.ui.textSecondary, marginTop: spacing.xxs },
    xpSection: { width: '80%', marginTop: spacing.lg },
    xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    levelBadge: {
        fontSize: typography.size.xs, fontWeight: typography.weight.bold,
        color: colors.ui.accent, letterSpacing: 1,
    },
    xpCount: { fontSize: typography.size.xs, color: colors.ui.textTertiary },
    xpBarBg: {
        height: 6, borderRadius: 3, backgroundColor: colors.ui.border, overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%', borderRadius: 3, backgroundColor: colors.ui.accent,
    },
    quickStats: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.xl },
    quickStatItem: { alignItems: 'center' },
    quickStatValue: { fontSize: typography.size.lg, fontWeight: typography.weight.extraBold, color: colors.ui.text },
    quickStatLabel: { fontSize: typography.size.xs, color: colors.ui.textTertiary, marginTop: spacing.xxs },
    tabBar: {
        flexDirection: 'row', marginHorizontal: spacing.base, marginTop: spacing.lg,
        backgroundColor: colors.ui.surface, borderRadius: radii.lg, padding: spacing.xxs,
    },
    tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.md },
    tabActive: { backgroundColor: colors.ui.surfaceElevated },
    tabText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.ui.textSecondary },
    tabTextActive: { color: colors.ui.text },
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: spacing.base, marginTop: spacing.lg, gap: spacing.md,
    },
    statCard: { width: '47%', backgroundColor: colors.ui.surface, borderRadius: radii.lg, padding: spacing.md, ...shadows.sm },
    statIcon: { fontSize: 20, marginBottom: spacing.xs },
    statValue: { fontSize: typography.size['2xl'], fontWeight: typography.weight.extraBold, color: colors.ui.text },
    statTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.ui.textSecondary, marginTop: spacing.xxs },
    statSubtitle: { fontSize: typography.size.xs, color: colors.ui.textTertiary },
    historyList: { paddingHorizontal: spacing.base, marginTop: spacing.lg },
    historyItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.ui.border, gap: spacing.md,
    },
    resultDot: { width: 8, height: 8, borderRadius: 4 },
    historyInfo: { flex: 1 },
    historyOpponent: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.ui.text },
    historyMode: { fontSize: typography.size.xs, color: colors.ui.textTertiary },
    historyElo: { fontSize: typography.size.base, fontWeight: typography.weight.bold },
    cosmeticsSection: { paddingHorizontal: spacing.base, marginTop: spacing.lg },
    sectionLabel: {
        fontSize: typography.size.xs, fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary, letterSpacing: 2, marginBottom: spacing.md,
    },
    cosmeticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    cosmeticItem: {
        width: '30%', backgroundColor: colors.ui.surface, borderRadius: radii.lg,
        padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.ui.border,
    },
    cosmeticEquipped: { borderColor: colors.ui.accent + '50', backgroundColor: colors.ui.accent + '08' },
    cosmeticIcon: { fontSize: 28, marginBottom: spacing.xs },
    cosmeticName: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, color: colors.ui.text, textAlign: 'center' },
    equippedBadge: { fontSize: 8, fontWeight: typography.weight.bold, color: colors.ui.accent, marginTop: spacing.xxs, letterSpacing: 1 },
    emptyState: { alignItems: 'center', paddingVertical: spacing['2xl'] },
    emptyIcon: { fontSize: 48, marginBottom: spacing.md },
    emptyTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.ui.text },
    emptyDesc: { fontSize: typography.size.sm, color: colors.ui.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
});
