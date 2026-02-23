/**
 * Ludo: Legends — Season Pass Screen
 * 
 * Dual-track progression display with missions and tier rewards.
 * 
 * SME Agent: ui-ux-pro-max, mobile-design, game-development/game-design
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import { commonStyles, ON_ACCENT_COLOR } from '../src/theme/commonStyles';
import { ScreenHeader, ProgressBar } from '../src/components/ui';
import {
    createCurrentSeason,
    createInitialSeasonState,
    SEASON_REWARDS,
    DAILY_MISSION_POOL,
    WEEKLY_MISSION_POOL,
    SEASON_MISSIONS,
    getSeasonTimeRemaining,
    TierReward,
    Mission,
    SeasonPassState,
} from '../src/services/SeasonPassService';
import { getSeasonPassState, saveSeasonPassState } from '../src/services/StorageService';

export default function SeasonPassScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const season = useMemo(() => createCurrentSeason(), []);
    const [passState, setPassState] = useState<SeasonPassState>(() => createInitialSeasonState(season.id));
    const timeRemaining = useMemo(() => getSeasonTimeRemaining(season), [season]);

    useEffect(() => {
        async function load() {
            try {
                const saved = await getSeasonPassState();
                if (saved) {
                    setPassState(saved as SeasonPassState);
                }
            } catch (err) {
                console.warn('[SeasonPass] Load error:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const tierProgress = passState.currentTier / season.totalTiers;
    const xpProgress = passState.currentXP / season.xpPerTier;

    const activeDailyMissions = useMemo(() =>
        DAILY_MISSION_POOL.filter(m => passState.activeDailyMissions.includes(m.id)),
        [passState.activeDailyMissions]
    );
    const activeWeeklyMissions = useMemo(() =>
        WEEKLY_MISSION_POOL.filter(m => passState.activeWeeklyMissions.includes(m.id)),
        [passState.activeWeeklyMissions]
    );

    if (loading) {
        return (
            <SafeAreaView style={commonStyles.screen}>
                <ScreenHeader title="Season Pass" />
                <View style={commonStyles.loadingContainer}>
                    <ActivityIndicator color={colors.ui.accent} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={commonStyles.screen}>
            {/* Header */}
            <ScreenHeader
                title="Season 1"
                rightElement={
                    <View style={styles.timerBox}>
                        <Text style={styles.timerText}>{timeRemaining.days}d {timeRemaining.hours}h</Text>
                    </View>
                }
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Tier Progress */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>TIER {passState.currentTier} / {season.totalTiers}</Text>
                        <Text style={styles.xpLabel}>{passState.currentXP} / {season.xpPerTier} XP</Text>
                    </View>
                    <ProgressBar current={passState.currentXP} total={season.xpPerTier} height={8} />
                    {!passState.isPremium && (
                        <TouchableOpacity style={styles.upgradeBtn} accessibilityRole="button">
                            <Text style={styles.upgradeBtnText}>⭐ Unlock Premium Track — 500 💎</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Reward Track */}
                <Text style={commonStyles.sectionTitle}>REWARD TRACK</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.trackScroll}
                    contentContainerStyle={styles.trackContent}
                >
                    {SEASON_REWARDS.map(tier => (
                        <TierCard
                            key={tier.tier}
                            tier={tier}
                            isReached={passState.currentTier >= tier.tier}
                            isCurrent={passState.currentTier === tier.tier}
                            isPremium={passState.isPremium}
                            isFreeClaimed={passState.claimedFreeTiers.includes(tier.tier)}
                            isPaidClaimed={passState.claimedPaidTiers.includes(tier.tier)}
                        />
                    ))}
                </ScrollView>

                {/* Daily Missions */}
                <Text style={commonStyles.sectionTitle}>DAILY MISSIONS</Text>
                {activeDailyMissions.map(mission => (
                    <MissionRow
                        key={mission.id}
                        mission={mission}
                        progress={passState.missionProgress[mission.id]}
                    />
                ))}

                {/* Weekly Missions */}
                <Text style={commonStyles.sectionTitle}>WEEKLY MISSIONS</Text>
                {activeWeeklyMissions.map(mission => (
                    <MissionRow
                        key={mission.id}
                        mission={mission}
                        progress={passState.missionProgress[mission.id]}
                    />
                ))}

                {/* Season Missions */}
                <Text style={commonStyles.sectionTitle}>SEASON CHALLENGES</Text>
                {SEASON_MISSIONS.map(mission => (
                    <MissionRow
                        key={mission.id}
                        mission={mission}
                        progress={passState.missionProgress[mission.id]}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Sub-Components ─────────────────────────────────────────────

function TierCard({
    tier, isReached, isCurrent, isPremium, isFreeClaimed, isPaidClaimed,
}: {
    tier: TierReward;
    isReached: boolean;
    isCurrent: boolean;
    isPremium: boolean;
    isFreeClaimed: boolean;
    isPaidClaimed: boolean;
}) {
    const formatReward = (reward: TierReward['free']): string => {
        if (reward.type === 'currency') return `${reward.currency === 'coins' ? '🪙' : '💎'} ${reward.amount}`;
        if (reward.type === 'cosmetic') return `🎁 ${reward.rarity.toUpperCase()}`;
        return `🏅 ${reward.name}`;
    };

    return (
        <View style={[
            styles.tierCard,
            isCurrent && styles.tierCardCurrent,
            !isReached && styles.tierCardLocked,
        ]}>
            <Text style={styles.tierNumber}>{tier.tier}</Text>

            {/* Free track */}
            <View style={[styles.rewardBox, isFreeClaimed && styles.rewardClaimed]}>
                <Text style={styles.rewardTrackLabel}>FREE</Text>
                <Text style={styles.rewardText}>{formatReward(tier.free)}</Text>
            </View>

            {/* Paid track */}
            <View style={[
                styles.rewardBox,
                styles.rewardBoxPaid,
                isPaidClaimed && styles.rewardClaimed,
                !isPremium && styles.rewardLocked,
            ]}>
                <Text style={styles.rewardTrackLabel}>⭐</Text>
                <Text style={styles.rewardText}>{formatReward(tier.paid)}</Text>
                {!isPremium && <Text style={styles.lockIcon}>🔒</Text>}
            </View>
        </View>
    );
}

function MissionRow({
    mission, progress,
}: {
    mission: Mission;
    progress?: { current: number; completed: boolean };
}) {
    const current = progress?.current ?? 0;
    const completed = progress?.completed ?? false;
    const progressPercent = Math.min(current / mission.target, 1);

    return (
        <View style={[styles.missionRow, completed && styles.missionCompleted]}>
            <Text style={styles.missionIcon}>{mission.icon}</Text>
            <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionDesc}>{mission.description}</Text>
                <View style={styles.missionProgressBar}>
                    <View style={[styles.missionProgressFill, { width: `${progressPercent * 100}%` }]} />
                </View>
            </View>
            <View style={styles.missionReward}>
                <Text style={styles.missionXP}>+{mission.xpReward}</Text>
                <Text style={styles.missionXPLabel}>XP</Text>
            </View>
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

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
    },
    backText: {
        fontSize: typography.size.base,
        color: colors.ui.accent,
        fontWeight: typography.weight.medium,
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
        letterSpacing: 2,
    },
    headerSub: {
        fontSize: typography.size.xs,
        color: colors.ui.accent,
        fontWeight: typography.weight.medium,
    },
    timerBox: {
        backgroundColor: colors.ui.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radii.full,
    },
    timerText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: colors.ui.warning,
    },
    scrollContent: {
        paddingBottom: spacing['3xl'],
    },
    progressCard: {
        marginHorizontal: spacing.base,
        marginBottom: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.ui.surface,
        borderRadius: radii.xl,
        ...shadows.md,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    progressLabel: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
    },
    xpLabel: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        fontWeight: typography.weight.medium,
    },
    progressBarOuter: {
        height: 8,
        backgroundColor: colors.ui.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarInner: {
        height: '100%',
        backgroundColor: colors.ui.accent,
        borderRadius: 4,
    },
    upgradeBtn: {
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.ui.accent + '20',
        borderRadius: radii.full,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.ui.accent + '40',
    },
    upgradeBtnText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: colors.ui.accent,
    },
    sectionTitle: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary,
        letterSpacing: 2,
        marginBottom: spacing.md,
        marginTop: spacing.lg,
        paddingHorizontal: spacing.base,
    },
    trackScroll: {
        maxHeight: 160,
    },
    trackContent: {
        paddingHorizontal: spacing.base,
        gap: spacing.sm,
    },
    tierCard: {
        width: 90,
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        padding: spacing.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.ui.border,
    },
    tierCardCurrent: {
        borderColor: colors.ui.accent,
        borderWidth: 2,
    },
    tierCardLocked: {
        opacity: 0.5,
    },
    tierNumber: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
        marginBottom: spacing.xs,
    },
    rewardBox: {
        width: '100%',
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.xs,
        backgroundColor: colors.ui.surfaceElevated,
        borderRadius: radii.sm,
        marginBottom: spacing.xxs,
        alignItems: 'center',
    },
    rewardBoxPaid: {
        backgroundColor: colors.ui.accent + '10',
    },
    rewardClaimed: {
        opacity: 0.4,
    },
    rewardLocked: {
        opacity: 0.3,
    },
    rewardTrackLabel: {
        fontSize: 8,
        fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary,
        letterSpacing: 1,
    },
    rewardText: {
        fontSize: 10,
        color: colors.ui.text,
        fontWeight: typography.weight.medium,
    },
    lockIcon: {
        fontSize: 10,
        marginTop: 2,
    },
    missionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.base,
        marginBottom: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        gap: spacing.md,
    },
    missionCompleted: {
        opacity: 0.5,
    },
    missionIcon: {
        fontSize: 24,
    },
    missionInfo: {
        flex: 1,
    },
    missionTitle: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.semiBold,
        color: colors.ui.text,
    },
    missionDesc: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
        marginTop: spacing.xxs,
        marginBottom: spacing.xs,
    },
    missionProgressBar: {
        height: 4,
        backgroundColor: colors.ui.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    missionProgressFill: {
        height: '100%',
        backgroundColor: colors.ui.accent,
        borderRadius: 2,
    },
    missionReward: {
        alignItems: 'center',
    },
    missionXP: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
        color: colors.ui.accent,
    },
    missionXPLabel: {
        fontSize: 9,
        color: colors.ui.textTertiary,
        fontWeight: typography.weight.medium,
    },
});
