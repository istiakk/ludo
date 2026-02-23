/**
 * Ludo: Legends — VIP Subscription Screen
 * 
 * Premium subscription showcase with benefits, pricing, and daily gems.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import { commonStyles, ON_ACCENT_COLOR } from '../src/theme/commonStyles';
import { ScreenHeader, Badge, ProgressBar } from '../src/components/ui';
import {
    VIPStatus,
    VIP_BENEFITS,
    VIP_PRICING,
    VIP_DAILY_GEMS,
    STARTER_PACKS,
    getVIPStatus,
    saveVIPStatus,
    activateVIP,
    collectDailyGems,
    isVIPExpired,
} from '../src/services/VIPService';

export default function VIPScreen() {
    const [loading, setLoading] = useState(true);
    const [vipStatus, setVipStatus] = useState<VIPStatus | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setVipStatus(await getVIPStatus());
            } catch {
                // fallback
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const isActive = useMemo(() => {
        return vipStatus?.isActive && !isVIPExpired(vipStatus);
    }, [vipStatus]);

    const handleSubscribe = useCallback(async (plan: 'monthly' | 'yearly') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const status = activateVIP(plan);
        await saveVIPStatus(status);
        setVipStatus(status);
        Alert.alert('Welcome to Legends Pass! 🎉', 'Your VIP benefits are now active.');
    }, []);

    const handleCollectGems = useCallback(async () => {
        if (!vipStatus || vipStatus.gemsCollectedToday) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const updated = collectDailyGems(vipStatus);
        await saveVIPStatus(updated);
        setVipStatus(updated);
        Alert.alert(`+${VIP_DAILY_GEMS} Gems! 💎`, `Streak: ${updated.streakDays} days`);
    }, [vipStatus]);

    if (loading) {
        return (
            <SafeAreaView style={commonStyles.screen}>
                <ScreenHeader title="Legends Pass" />
                <View style={commonStyles.loadingContainer}>
                    <ActivityIndicator color={colors.ui.accent} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={commonStyles.screen}>
            <ScreenHeader
                title="Legends Pass"
                rightElement={isActive ? <Badge label="VIP" color={colors.ui.gold} size="md" /> : undefined}
            />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.heroIcon}>{isActive ? '⭐' : '👑'}</Text>
                    <Text style={styles.heroTitle}>{isActive ? 'You\'re a Legend!' : 'Become a Legend'}</Text>
                    <Text style={styles.heroSub}>
                        {isActive ? 'Your VIP perks are active.' : 'Unlock premium benefits and dominate.'}
                    </Text>
                </View>

                {/* Daily Gems (VIP only) */}
                {isActive && vipStatus && (
                    <TouchableOpacity
                        style={[styles.gemsCard, vipStatus.gemsCollectedToday && styles.gemsCollected]}
                        onPress={handleCollectGems}
                        disabled={vipStatus.gemsCollectedToday}
                    >
                        <Text style={styles.gemsIcon}>💎</Text>
                        <View style={styles.gemsInfo}>
                            <Text style={styles.gemsTitle}>
                                {vipStatus.gemsCollectedToday ? 'Gems Collected' : 'Collect Daily Gems'}
                            </Text>
                            <Text style={styles.gemsSub}>
                                {vipStatus.gemsCollectedToday
                                    ? `Come back tomorrow! (${vipStatus.streakDays}d streak)`
                                    : `Tap to collect ${VIP_DAILY_GEMS} gems`
                                }
                            </Text>
                        </View>
                        <Text style={styles.gemsAmount}>{vipStatus.gemsCollectedToday ? '✓' : `+${VIP_DAILY_GEMS}`}</Text>
                    </TouchableOpacity>
                )}

                {/* Benefits */}
                <Text style={commonStyles.sectionTitle}>VIP BENEFITS</Text>
                <View style={styles.benefitsGrid}>
                    {VIP_BENEFITS.map((benefit, i) => (
                        <View key={i} style={styles.benefitCard}>
                            <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                            <Text style={styles.benefitTitle}>{benefit.title}</Text>
                            <Text style={styles.benefitDesc}>{benefit.description}</Text>
                            <Badge label={benefit.value} color={colors.ui.accent} size="sm" />
                        </View>
                    ))}
                </View>

                {/* Pricing */}
                {!isActive && (
                    <>
                        <Text style={commonStyles.sectionTitle}>CHOOSE YOUR PLAN</Text>
                        <View style={styles.pricingRow}>
                            {VIP_PRICING.map((plan) => (
                                <TouchableOpacity
                                    key={plan.plan}
                                    style={[styles.planCard, plan.popular && styles.planPopular]}
                                    onPress={() => handleSubscribe(plan.plan)}
                                >
                                    {plan.popular && (
                                        <View style={styles.popularBadge}>
                                            <Text style={styles.popularText}>BEST VALUE</Text>
                                        </View>
                                    )}
                                    <Text style={styles.planLabel}>{plan.label}</Text>
                                    <Text style={styles.planPrice}>{plan.price}</Text>
                                    <Text style={styles.planPerMonth}>{plan.pricePerMonth}</Text>
                                    {plan.savings && (
                                        <Text style={styles.planSavings}>{plan.savings}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                {/* Starter Packs */}
                {!isActive && (
                    <>
                        <Text style={commonStyles.sectionTitle}>STARTER PACKS</Text>
                        {STARTER_PACKS.map((pack) => (
                            <View key={pack.id} style={styles.packCard}>
                                <View style={styles.packHeader}>
                                    <Text style={styles.packIcon}>{pack.icon}</Text>
                                    <View style={styles.packInfo}>
                                        <Text style={styles.packName}>{pack.name}</Text>
                                        <View style={styles.packPriceRow}>
                                            <Text style={styles.packOriginal}>{pack.originalPrice}</Text>
                                            <Text style={styles.packDiscount}>{pack.discountedPrice}</Text>
                                            <Badge label={`-${pack.discountPercent}%`} color="#E63946" size="sm" />
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.packContents}>
                                    {pack.contents.map((item, i) => (
                                        <Text key={i} style={styles.packItem}>✓ {item.label}</Text>
                                    ))}
                                </View>
                                <Text style={styles.packExpiry}>⏰ Expires in {pack.expiresIn}</Text>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    content: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
    hero: { alignItems: 'center', paddingVertical: spacing['2xl'], marginBottom: spacing.md },
    heroIcon: { fontSize: 56, marginBottom: spacing.sm },
    heroTitle: { fontSize: typography.size['2xl'], fontWeight: typography.weight.extraBold, color: colors.ui.text },
    heroSub: { fontSize: typography.size.sm, color: colors.ui.textSecondary, marginTop: spacing.xs },
    gemsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.ui.gold + '15', borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.ui.gold + '40' },
    gemsCollected: { opacity: 0.6 },
    gemsIcon: { fontSize: 28, marginRight: spacing.md },
    gemsInfo: { flex: 1 },
    gemsTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.ui.text },
    gemsSub: { fontSize: typography.size.xs, color: colors.ui.textSecondary, marginTop: 2 },
    gemsAmount: { fontSize: typography.size.lg, fontWeight: typography.weight.extraBold, color: colors.ui.gold },
    benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
    benefitCard: { width: '48%', backgroundColor: colors.ui.surface, borderRadius: radii.lg, padding: spacing.md, ...shadows.sm },
    benefitIcon: { fontSize: 22, marginBottom: spacing.xs },
    benefitTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.ui.text, marginBottom: 2 },
    benefitDesc: { fontSize: 10, color: colors.ui.textSecondary, lineHeight: 13, marginBottom: spacing.sm },
    pricingRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    planCard: { flex: 1, backgroundColor: colors.ui.surface, borderRadius: radii.xl, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.ui.border, ...shadows.sm },
    planPopular: { borderColor: colors.ui.gold, borderWidth: 2 },
    popularBadge: { position: 'absolute', top: -10, backgroundColor: colors.ui.gold, paddingHorizontal: spacing.md, paddingVertical: 2, borderRadius: radii.full },
    popularText: { fontSize: 9, fontWeight: typography.weight.extraBold, color: '#000' },
    planLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.ui.textSecondary, marginBottom: spacing.sm },
    planPrice: { fontSize: typography.size['2xl'], fontWeight: typography.weight.extraBold, color: colors.ui.text },
    planPerMonth: { fontSize: typography.size.xs, color: colors.ui.textSecondary, marginTop: 2 },
    planSavings: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.ui.success, marginTop: spacing.xs },
    packCard: { backgroundColor: colors.ui.surface, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.ui.border, ...shadows.sm },
    packHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    packIcon: { fontSize: 32, marginRight: spacing.md },
    packInfo: { flex: 1 },
    packName: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.ui.text },
    packPriceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
    packOriginal: { fontSize: typography.size.sm, color: colors.ui.textTertiary, textDecorationLine: 'line-through' },
    packDiscount: { fontSize: typography.size.lg, fontWeight: typography.weight.extraBold, color: colors.ui.success },
    packContents: { marginBottom: spacing.sm },
    packItem: { fontSize: typography.size.sm, color: colors.ui.text, paddingVertical: 2 },
    packExpiry: { fontSize: typography.size.xs, color: colors.ui.warning, fontWeight: typography.weight.bold },
});
