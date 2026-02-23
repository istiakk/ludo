/**
 * Ludo: Legends — Home Screen
 * 
 * Premium landing with LIVE player data: XP bar, wallet, streak,
 * daily login reward popup, and game mode selection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Modal,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import {
    getProgression,
    getWallet,
    getLoginStreak,
    saveLoginStreak,
    saveWallet,
    StoredProgression,
    StoredWallet,
    StoredLoginStreak,
} from '../src/services/StorageService';
import { xpForLevel } from '../src/services/ProgressionService';
import {
    canClaimDailyReward,
    claimDailyReward,
    DAILY_LOGIN_REWARDS,
    DailyLoginReward,
} from '../src/services/EconomyEngine';
import { soundManager } from '../src/services/SoundManager';

export default function HomeScreen() {
    const router = useRouter();

    // Live data
    const [progression, setProgression] = useState<StoredProgression | null>(null);
    const [wallet, setWallet] = useState<StoredWallet>({ coins: 0, gems: 0 });
    const [showDailyReward, setShowDailyReward] = useState(false);
    const [dailyReward, setDailyReward] = useState<DailyLoginReward | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        loadData();
        soundManager.initialize();
    }, []);

    async function loadData() {
        try {
            const [prog, w, loginStreak] = await Promise.all([
                getProgression(),
                getWallet(),
                getLoginStreak(),
            ]);
            setProgression(prog);
            setWallet(w);

            // Check daily login reward
            if (canClaimDailyReward(loginStreak)) {
                const result = claimDailyReward(loginStreak);
                setDailyReward(result.reward);
                setShowDailyReward(true);

                // Save the new streak state
                await saveLoginStreak(result.state);

                // Credit the reward
                const newWallet = { ...w };
                if (result.reward.reward.currency === 'coins') {
                    newWallet.coins += result.reward.reward.amount;
                } else {
                    newWallet.gems += result.reward.reward.amount;
                }
                await saveWallet(newWallet);
                setWallet(newWallet);
            }
        } catch (error) {
            console.warn('[Home] Failed to load:', error);
        } finally {
            setLoaded(true);
        }
    }

    const startGame = useCallback((mode: string, matchType: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        soundManager.play('button_tap');
        if (matchType === 'browse') {
            router.push('/mode-select');
        } else {
            router.push({
                pathname: '/game',
                params: { mode, matchType },
            });
        }
    }, [router]);

    const xpNeeded = progression ? xpForLevel(progression.level) : 100;
    const xpPercent = progression && xpNeeded > 0 ? Math.min(100, Math.round((progression.xp / xpNeeded) * 100)) : 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Wallet Bar */}
            <View style={styles.walletBar}>
                <View style={styles.levelPill}>
                    <Text style={styles.levelText}>Lv. {progression?.level ?? 1}</Text>
                </View>
                <View style={styles.walletDisplay}>
                    <Text style={styles.walletText}>🪙 {wallet.coins.toLocaleString()}</Text>
                    <Text style={styles.walletText}>💎 {wallet.gems}</Text>
                </View>
            </View>

            {/* Hero */}
            <View style={styles.hero}>
                <Text style={styles.logo}>♛</Text>
                <Text style={styles.title}>LUDO</Text>
                <Text style={styles.subtitle}>LEGENDS</Text>
                <Text style={styles.tagline}>Classic game. Legendary moves.</Text>
            </View>

            {/* XP Bar */}
            {progression && (
                <View style={styles.xpSection}>
                    <View style={styles.xpBarBg}>
                        <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
                    </View>
                    <Text style={styles.xpLabel}>{progression.xp}/{xpNeeded} XP</Text>
                </View>
            )}

            {/* Streak Badge */}
            {progression && progression.winStreak > 0 && (
                <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>🔥 {progression.winStreak} Win Streak</Text>
                </View>
            )}

            {/* Quick Play */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>QUICK PLAY</Text>
                <View style={styles.buttonRow}>
                    <ModeButton
                        label="1v1 Duel"
                        icon="⚔️"
                        description="Competitive"
                        color={colors.player.red}
                        onPress={() => startGame('classic', '1v1')}
                    />
                    <ModeButton
                        label="2v2 Team"
                        icon="🤝"
                        description="Team Battle"
                        color={colors.player.green}
                        onPress={() => startGame('classic', '2v2')}
                    />
                </View>
                <View style={styles.buttonRow}>
                    <ModeButton
                        label="vs Computer"
                        icon="🤖"
                        description="Solo Mastery"
                        color={colors.player.blue}
                        onPress={() => startGame('classic', 'vs_ai')}
                    />
                    <ModeButton
                        label="All Modes"
                        icon="⚡"
                        description="Browse"
                        color={colors.player.yellow}
                        onPress={() => startGame('classic', 'browse')}
                    />
                </View>
            </View>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <NavItem icon="🏆" label="Rankings" onPress={() => router.push('/rankings')} />
                <NavItem icon="🛍️" label="Shop" onPress={() => router.push('/shop')} />
                <NavItem icon="⭐" label="Season" onPress={() => router.push('/season-pass')} />
                <NavItem icon="👤" label="Profile" onPress={() => router.push('/profile')} />
                <NavItem icon="⚙️" label="Settings" onPress={() => router.push('/settings')} />
            </View>

            {/* Daily Reward Modal */}
            <Modal
                visible={showDailyReward}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDailyReward(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.rewardCard}>
                        <Text style={styles.rewardTitle}>Daily Reward!</Text>
                        {dailyReward && (
                            <>
                                <Text style={styles.rewardIcon}>{dailyReward.icon}</Text>
                                <Text style={styles.rewardAmount}>
                                    {dailyReward.reward.currency === 'coins' ? '🪙' : '💎'}{' '}
                                    +{dailyReward.reward.amount} {dailyReward.reward.currency}
                                </Text>
                                <Text style={styles.rewardDay}>Day {dailyReward.day} of 7</Text>

                                {/* Calendar preview */}
                                <View style={styles.calendarRow}>
                                    {DAILY_LOGIN_REWARDS.map((r, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.calendarDot,
                                                i + 1 <= dailyReward.day && styles.calendarDotClaimed,
                                                i + 1 === dailyReward.day && styles.calendarDotToday,
                                            ]}
                                        >
                                            <Text style={styles.calendarDayText}>{r.icon}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                        <TouchableOpacity
                            style={styles.claimButton}
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                setShowDailyReward(false);
                            }}
                        >
                            <Text style={styles.claimText}>CLAIM</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Sub-Components ─────────────────────────────────────────────

function ModeButton({ label, icon, description, color, onPress }: {
    label: string; icon: string; description: string; color: string; onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.modeButton, { borderColor: color + '40' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={styles.modeIcon}>{icon}</Text>
            <Text style={styles.modeLabel}>{label}</Text>
            <Text style={[styles.modeDesc, { color }]}>{description}</Text>
        </TouchableOpacity>
    );
}

function NavItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.navItem} onPress={onPress}>
            <Text style={styles.navIcon}>{icon}</Text>
            <Text style={styles.navLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.ui.background, paddingHorizontal: spacing.base },

    // Wallet bar
    walletBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    levelPill: {
        backgroundColor: colors.ui.accent + '20', paddingHorizontal: spacing.md,
        paddingVertical: spacing.xxs, borderRadius: radii.full,
    },
    levelText: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.ui.accent, letterSpacing: 1 },
    walletDisplay: { flexDirection: 'row', gap: spacing.md },
    walletText: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.ui.text },

    // Hero
    hero: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.md },
    logo: { fontSize: 56, marginBottom: spacing.sm },
    title: {
        fontSize: typography.size['5xl'], fontWeight: typography.weight.extraBold,
        color: colors.ui.text, letterSpacing: 12,
    },
    subtitle: {
        fontSize: typography.size.xl, fontWeight: typography.weight.medium,
        color: colors.ui.accent, letterSpacing: 8, marginTop: -4,
    },
    tagline: { fontSize: typography.size.base, color: colors.ui.textSecondary, marginTop: spacing.md, fontStyle: 'italic' },

    // XP bar
    xpSection: { alignItems: 'center', marginBottom: spacing.sm },
    xpBarBg: {
        width: '60%', height: 5, borderRadius: 3, backgroundColor: colors.ui.border, overflow: 'hidden',
    },
    xpBarFill: { height: '100%', borderRadius: 3, backgroundColor: colors.ui.accent },
    xpLabel: { fontSize: typography.size.xs, color: colors.ui.textTertiary, marginTop: spacing.xxs },

    // Streak
    streakBadge: {
        alignSelf: 'center', backgroundColor: colors.ui.accentWarm + '20',
        paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.full,
        marginBottom: spacing.md,
    },
    streakText: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.ui.accentWarm },

    // Quick play
    section: { marginTop: spacing.md },
    sectionTitle: {
        fontSize: typography.size.sm, fontWeight: typography.weight.semiBold,
        color: colors.ui.textTertiary, letterSpacing: 3, marginBottom: spacing.md, paddingLeft: spacing.xs,
    },
    buttonRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    modeButton: {
        flex: 1, backgroundColor: colors.ui.surface, borderRadius: radii.lg,
        padding: spacing.lg, borderWidth: 1, alignItems: 'center', ...shadows.md,
    },
    modeIcon: { fontSize: 28, marginBottom: spacing.sm },
    modeLabel: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.ui.text },
    modeDesc: {
        fontSize: typography.size.xs, fontWeight: typography.weight.medium,
        marginTop: spacing.xxs, letterSpacing: 1, textTransform: 'uppercase',
    },

    // Nav
    bottomNav: {
        position: 'absolute', bottom: spacing['2xl'], left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'center', gap: spacing['2xl'],
    },
    navItem: { alignItems: 'center', gap: spacing.xxs },
    navIcon: { fontSize: 22 },
    navLabel: { fontSize: typography.size.xs, color: colors.ui.textTertiary, fontWeight: typography.weight.medium },

    // Daily Reward Modal
    modalOverlay: {
        flex: 1, backgroundColor: '#000000B3', justifyContent: 'center', alignItems: 'center',
    },
    rewardCard: {
        width: '80%', backgroundColor: colors.ui.surface, borderRadius: radii.xl,
        padding: spacing.xl, alignItems: 'center', ...shadows.lg,
    },
    rewardTitle: {
        fontSize: typography.size['2xl'], fontWeight: typography.weight.extraBold,
        color: colors.ui.gold, marginBottom: spacing.md, letterSpacing: 2,
    },
    rewardIcon: { fontSize: 64, marginBottom: spacing.md },
    rewardAmount: {
        fontSize: typography.size.xl, fontWeight: typography.weight.bold,
        color: colors.ui.text, marginBottom: spacing.xs,
    },
    rewardDay: { fontSize: typography.size.sm, color: colors.ui.textSecondary, marginBottom: spacing.lg },
    calendarRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
    calendarDot: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: colors.ui.surfaceElevated,
        alignItems: 'center', justifyContent: 'center',
    },
    calendarDotClaimed: { backgroundColor: colors.ui.accent + '30' },
    calendarDotToday: { borderWidth: 2, borderColor: colors.ui.accent },
    calendarDayText: { fontSize: 14 },
    claimButton: {
        backgroundColor: colors.ui.accent, paddingVertical: spacing.md,
        paddingHorizontal: spacing['2xl'], borderRadius: radii.full,
    },
    claimText: {
        fontSize: typography.size.base, fontWeight: typography.weight.bold,
        color: '#FFFFFF', letterSpacing: 2,
    },
});
