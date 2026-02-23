/**
 * Ludo: Legends — Profile & Scorecard Screen
 * 
 * Player profile with stats, cosmetics, and match history.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';

export default function ProfileScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'cosmetics'>('stats');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatar}>👤</Text>
                        <View style={[styles.tierRing, { borderColor: '#C0C0C0' }]} />
                    </View>
                    <Text style={styles.playerName}>Player</Text>
                    <Text style={styles.playerTitle}>Silver • 1,350 ELO</Text>
                    <View style={styles.quickStats}>
                        <QuickStat label="Wins" value="47" />
                        <QuickStat label="Win Rate" value="58%" />
                        <QuickStat label="Streak" value="3🔥" />
                        <QuickStat label="Captures" value="124" />
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
                        <StatCard title="Clutch Index" value="23%" subtitle="Wins when trailing" icon="🎯" />
                        <StatCard title="Captures/Match" value="2.6" subtitle="Above average" icon="💥" />
                        <StatCard title="Avg Game Time" value="12m" subtitle="Classic mode" icon="⏱️" />
                        <StatCard title="Sixes Rolled" value="89" subtitle="14% frequency" icon="🎲" />
                        <StatCard title="Tokens Finished" value="188" subtitle="47 per match avg" icon="🏠" />
                        <StatCard title="Comebacks" value="11" subtitle="Trail → Win" icon="🔄" />
                    </View>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <View style={styles.historyList}>
                        <MatchHistoryItem result="win" opponent="BoardMaster" mode="Classic" elo="+18" time="8m" />
                        <MatchHistoryItem result="loss" opponent="DiceQueen" mode="Speed" elo="-12" time="4m" />
                        <MatchHistoryItem result="win" opponent="AI Expert" mode="Classic" elo="+0" time="15m" />
                        <MatchHistoryItem result="win" opponent="TokenRush" mode="Pro" elo="+22" time="11m" />
                        <MatchHistoryItem result="loss" opponent="LudoKing99" mode="Classic" elo="-15" time="10m" />
                    </View>
                )}

                {/* Cosmetics Tab */}
                {activeTab === 'cosmetics' && (
                    <View style={styles.cosmeticsSection}>
                        <Text style={styles.sectionLabel}>YOUR COLLECTION</Text>
                        <View style={styles.cosmeticsGrid}>
                            <CosmeticItem name="Classic Token" icon="⭕" equipped />
                            <CosmeticItem name="Golden Dice" icon="🎲" equipped={false} />
                            <CosmeticItem name="Premium Board" icon="🎯" equipped={false} />
                            <CosmeticItem name="Victory Crown" icon="👑" equipped />
                            <CosmeticItem name="Fire Trail" icon="🔥" equipped={false} />
                            <CosmeticItem name="Ice Theme" icon="❄️" equipped={false} />
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
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
    result, opponent, mode, elo, time,
}: { result: 'win' | 'loss'; opponent: string; mode: string; elo: string; time: string }) {
    return (
        <View style={styles.historyItem}>
            <View style={[styles.resultDot, {
                backgroundColor: result === 'win' ? colors.ui.success : colors.ui.error,
            }]} />
            <View style={styles.historyInfo}>
                <Text style={styles.historyOpponent}>vs {opponent}</Text>
                <Text style={styles.historyMode}>{mode} • {time}</Text>
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
    container: {
        flex: 1,
        backgroundColor: colors.ui.background,
    },
    scrollContent: {
        paddingBottom: spacing['3xl'],
    },
    header: {
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
    },
    backBtn: {
        paddingVertical: spacing.xs,
    },
    backText: {
        fontSize: typography.size.base,
        color: colors.ui.accent,
        fontWeight: typography.weight.medium,
    },
    profileCard: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        marginHorizontal: spacing.base,
        backgroundColor: colors.ui.surface,
        borderRadius: radii.xl,
        ...shadows.md,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: spacing.md,
    },
    avatar: {
        fontSize: 48,
    },
    tierRing: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: radii.full,
        borderWidth: 3,
    },
    playerName: {
        fontSize: typography.size['2xl'],
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
    },
    playerTitle: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        marginTop: spacing.xxs,
    },
    quickStats: {
        flexDirection: 'row',
        marginTop: spacing.lg,
        gap: spacing.xl,
    },
    quickStatItem: {
        alignItems: 'center',
    },
    quickStatValue: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.extraBold,
        color: colors.ui.text,
    },
    quickStatLabel: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
        marginTop: spacing.xxs,
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: spacing.base,
        marginTop: spacing.lg,
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        padding: spacing.xxs,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: radii.md,
    },
    tabActive: {
        backgroundColor: colors.ui.surfaceElevated,
    },
    tabText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
        color: colors.ui.textSecondary,
    },
    tabTextActive: {
        color: colors.ui.text,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.base,
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    statCard: {
        width: '47%',
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        ...shadows.sm,
    },
    statIcon: {
        fontSize: 20,
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: typography.size['2xl'],
        fontWeight: typography.weight.extraBold,
        color: colors.ui.text,
    },
    statTitle: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
        color: colors.ui.textSecondary,
        marginTop: spacing.xxs,
    },
    statSubtitle: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
    },
    historyList: {
        paddingHorizontal: spacing.base,
        marginTop: spacing.lg,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.ui.border,
        gap: spacing.md,
    },
    resultDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    historyInfo: {
        flex: 1,
    },
    historyOpponent: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.medium,
        color: colors.ui.text,
    },
    historyMode: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
    },
    historyElo: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
    },
    cosmeticsSection: {
        paddingHorizontal: spacing.base,
        marginTop: spacing.lg,
    },
    sectionLabel: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary,
        letterSpacing: 2,
        marginBottom: spacing.md,
    },
    cosmeticsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    cosmeticItem: {
        width: '30%',
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.ui.border,
    },
    cosmeticEquipped: {
        borderColor: colors.ui.accent + '50',
        backgroundColor: colors.ui.accent + '08',
    },
    cosmeticIcon: {
        fontSize: 28,
        marginBottom: spacing.xs,
    },
    cosmeticName: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.medium,
        color: colors.ui.text,
        textAlign: 'center',
    },
    equippedBadge: {
        fontSize: 8,
        fontWeight: typography.weight.bold,
        color: colors.ui.accent,
        marginTop: spacing.xxs,
        letterSpacing: 1,
    },
});
