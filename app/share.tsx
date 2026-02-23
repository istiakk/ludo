/**
 * Ludo: Legends — Share & Creator Screen (Live Data)
 * 
 * Uses last match from StorageService instead of DEMO_MATCH.
 * Creator code persists via StorageService.
 * Uses shared: ScreenHeader, EmptyState.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TextInput,
    Alert,
    Share,
    ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import { commonStyles, ON_ACCENT_COLOR } from '../src/theme/commonStyles';
import { ScreenHeader, EmptyState } from '../src/components/ui';
import {
    generateChallengeCard,
    generateShareText,
    type ChallengeCard,
    type SharePlatform,
    type MatchResultInput,
} from '../src/services/ChallengeCardService';
import {
    isValidCreatorCode,
    lookupCreatorCode,
    applyCreatorCode,
    formatCodeExpiry,
    type ActiveCreatorCode,
} from '../src/services/CreatorCodeService';
import {
    getMatchHistory,
    getActiveCreatorCode,
    saveActiveCreatorCode,
    StoredCreatorCode,
} from '../src/services/StorageService';

// ─── Screen ─────────────────────────────────────────────────────

export default function ShareScreen() {
    const [loading, setLoading] = useState(true);
    const [lastMatch, setLastMatch] = useState<MatchResultInput | null>(null);
    const [activeCode, setActiveCode] = useState<ActiveCreatorCode | null>(null);
    const [codeInput, setCodeInput] = useState('');
    const [codeLookupError, setCodeLookupError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [history, storedCode] = await Promise.all([
                getMatchHistory(),
                getActiveCreatorCode(),
            ]);

            // Convert last match to MatchResultInput
            if (history.length > 0) {
                const last = history[0];
                setLastMatch({
                    won: last.result === 'win',
                    playerName: 'You',
                    playerRank: 'Ranked',
                    playerAvatar: null,
                    opponentName: last.opponentName,
                    captures: last.captures,
                    tokensFinished: last.tokensFinished,
                    durationMs: last.duration * 1000,
                    winStreak: 0,
                    comebackWin: false,
                    mode: last.mode,
                });
            }

            // Restore persisted creator code
            if (storedCode && storedCode.expiresAt > Date.now()) {
                setActiveCode({
                    code: storedCode.code,
                    creatorName: storedCode.creatorName,
                    appliedAt: storedCode.appliedAt,
                    expiresAt: storedCode.expiresAt,
                });
            }
        } catch (err) {
            console.warn('[Share] Load error:', err);
        } finally {
            setLoading(false);
        }
    }

    const challengeCard = useMemo(() => {
        if (!lastMatch) return null;
        return generateChallengeCard(lastMatch);
    }, [lastMatch]);

    const handleShare = useCallback(async (platform: SharePlatform) => {
        if (!challengeCard) return;
        const text = generateShareText(challengeCard, platform, activeCode?.code);
        try {
            await Share.share({
                message: text,
                url: challengeCard.challengeLink,
            });
        } catch {
            // User cancelled
        }
    }, [challengeCard, activeCode]);

    const handleApplyCode = useCallback(async () => {
        const code = codeInput.trim().toUpperCase();
        setCodeLookupError(null);

        if (!isValidCreatorCode(code)) {
            setCodeLookupError('Invalid code format. Use 3-16 letters/numbers.');
            return;
        }

        const creator = lookupCreatorCode(code);
        if (!creator) {
            setCodeLookupError('Creator code not found. Check the spelling.');
            return;
        }

        const applied = applyCreatorCode(code, creator.displayName);
        setActiveCode(applied);
        setCodeInput('');

        // Persist the code
        await saveActiveCreatorCode({
            code: applied.code,
            creatorName: applied.creatorName,
            appliedAt: applied.appliedAt,
            expiresAt: applied.expiresAt,
        });

        Alert.alert(
            'Creator Code Applied! 🎉',
            `Supporting ${creator.displayName}! You'll get 5% bonus gems on your next purchase.`,
        );
    }, [codeInput]);

    const handleRemoveCode = useCallback(async () => {
        setActiveCode(null);
        await saveActiveCreatorCode(null);
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={commonStyles.screen}>
                <ScreenHeader title="Share & Create" />
                <View style={commonStyles.loadingContainer}>
                    <ActivityIndicator color={colors.ui.accent} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={commonStyles.screen}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <ScreenHeader title="Share & Create" />

                {/* Challenge Card */}
                <Text style={commonStyles.sectionTitle}>YOUR CHALLENGE CARD</Text>
                {challengeCard ? (
                    <>
                        <ChallengeCardPreview card={challengeCard} />
                        <View style={styles.shareRow}>
                            <ShareButton icon="𝕏" label="Twitter" color="#1DA1F2" onPress={() => handleShare('twitter')} />
                            <ShareButton icon="📸" label="Instagram" color="#E1306C" onPress={() => handleShare('instagram')} />
                            <ShareButton icon="🎵" label="TikTok" color="#00F2EA" onPress={() => handleShare('tiktok')} />
                            <ShareButton icon="📘" label="Facebook" color="#4267B2" onPress={() => handleShare('facebook')} />
                        </View>
                        <TouchableOpacity style={styles.copyBtn} onPress={() => handleShare('clipboard')}>
                            <Text style={styles.copyBtnText}>📋 Copy Share Link</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <EmptyState
                        icon="🎲"
                        title="No Matches Yet"
                        description="Play a game to generate your first challenge card!"
                    />
                )}

                {/* Creator Code */}
                <View style={commonStyles.divider} />
                <Text style={commonStyles.sectionTitle}>CREATOR CODE</Text>
                <Text style={styles.sectionDesc}>
                    Support your favorite creator! Enter their code and get 5% bonus gems on every purchase.
                </Text>

                {activeCode ? (
                    <ActiveCodeDisplay code={activeCode} onRemove={handleRemoveCode} />
                ) : (
                    <View style={styles.codeInputRow}>
                        <TextInput
                            style={styles.codeInput}
                            value={codeInput}
                            onChangeText={setCodeInput}
                            placeholder="Enter creator code"
                            placeholderTextColor={colors.ui.textTertiary}
                            autoCapitalize="characters"
                            maxLength={16}
                            accessibilityLabel="Creator code input"
                        />
                        <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCode} accessibilityRole="button">
                            <Text style={styles.applyBtnText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {codeLookupError && <Text style={styles.errorText}>{codeLookupError}</Text>}

                {/* Creator CTA */}
                <View style={styles.creatorCta}>
                    <Text style={styles.ctaIcon}>🌟</Text>
                    <Text style={styles.ctaTitle}>Become a Creator</Text>
                    <Text style={styles.ctaDesc}>
                        Earn 5-15% commission on sales from your fans. Build your audience, grow your earnings.
                    </Text>
                    <View style={styles.tierRow}>
                        {(['Starter', 'Partner', 'Ambassador', 'Legend'] as const).map((tier, i) => (
                            <View key={tier} style={styles.tierChip}>
                                <Text style={styles.tierRate}>{['5%', '8%', '10%', '15%'][i]}</Text>
                                <Text style={styles.tierName}>{tier}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Sub-Components (Memoized) ──────────────────────────────────

const ChallengeCardPreview = React.memo(function ChallengeCardPreview({ card }: { card: ChallengeCard }) {
    return (
        <View style={styles.card}>
            <View style={commonStyles.row}>
                <Text style={styles.cardBrand}>LUDO LEGENDS</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.cardBadge}>🏅 {card.playerRank}</Text>
            </View>
            <Text style={styles.cardHeadline}>{card.headline}</Text>
            <Text style={styles.cardSub}>{card.subheadline}</Text>
            <View style={styles.cardStats}>
                {card.stats.map((stat, i) => (
                    <View key={i} style={styles.statBlock}>
                        <Text style={styles.statIcon}>{stat.icon}</Text>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>
            <View style={commonStyles.row}>
                <Text style={styles.cardPlayer}>🎲 {card.playerName}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.cardCta}>Tap to challenge →</Text>
            </View>
        </View>
    );
});

const ActiveCodeDisplay = React.memo(function ActiveCodeDisplay({
    code, onRemove,
}: { code: ActiveCreatorCode; onRemove: () => void }) {
    return (
        <View style={styles.activeCode}>
            <View style={{ flex: 1 }}>
                <Text style={styles.activeCodeLabel}>Supporting</Text>
                <Text style={styles.activeCodeName}>{code.creatorName}</Text>
                <Text style={styles.activeCodeMeta}>Code: {code.code} · {formatCodeExpiry(code.expiresAt)}</Text>
                <Text style={styles.activeCodeBonus}>+5% bonus gems on purchases 🎁</Text>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={onRemove} accessibilityLabel="Remove creator code">
                <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
        </View>
    );
});

const ShareButton = React.memo(function ShareButton({
    icon, label, color, onPress,
}: { icon: string; label: string; color: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={[styles.shareBtn, { borderColor: color + '60' }]} onPress={onPress} accessibilityLabel={`Share on ${label}`}>
            <Text style={styles.shareBtnIcon}>{icon}</Text>
            <Text style={[styles.shareBtnLabel, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
});

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    scroll: { paddingHorizontal: spacing.base, paddingBottom: spacing['5xl'] },
    sectionDesc: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        lineHeight: 18,
        marginBottom: spacing.md,
    },
    card: {
        backgroundColor: colors.ui.surface,
        borderRadius: radii.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.ui.border,
        ...shadows.lg,
    },
    cardBrand: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.ui.accent, letterSpacing: 2 },
    cardBadge: { fontSize: typography.size.xs, fontWeight: typography.weight.semiBold, color: colors.ui.gold },
    cardHeadline: { fontSize: typography.size['2xl'], fontWeight: typography.weight.extraBold, color: colors.ui.text, marginBottom: spacing.xs, marginTop: spacing.md },
    cardSub: { fontSize: typography.size.sm, color: colors.ui.textSecondary, marginBottom: spacing.lg },
    cardStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.glass.light, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.lg },
    statBlock: { alignItems: 'center' },
    statIcon: { fontSize: 18, marginBottom: spacing.xxs },
    statValue: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.ui.text },
    statLabel: { fontSize: typography.size.xs, color: colors.ui.textTertiary, marginTop: spacing.xxs },
    cardPlayer: { fontSize: typography.size.sm, fontWeight: typography.weight.semiBold, color: colors.ui.text },
    cardCta: { fontSize: typography.size.xs, color: colors.ui.accent, fontWeight: typography.weight.medium },
    shareRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    shareBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.md, borderWidth: 1, backgroundColor: colors.ui.surface },
    shareBtnIcon: { fontSize: 20, marginBottom: spacing.xxs },
    shareBtnLabel: { fontSize: typography.size.xs, fontWeight: typography.weight.semiBold },
    copyBtn: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm, backgroundColor: colors.glass.light, borderRadius: radii.md },
    copyBtnText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.ui.text },
    codeInputRow: { flexDirection: 'row', gap: spacing.sm },
    codeInput: {
        flex: 1, backgroundColor: colors.ui.surface, borderRadius: radii.md,
        paddingHorizontal: spacing.base, paddingVertical: spacing.md,
        fontSize: typography.size.base, fontWeight: typography.weight.bold,
        color: colors.ui.text, borderWidth: 1, borderColor: colors.ui.border, letterSpacing: 2,
    },
    applyBtn: { backgroundColor: colors.ui.accent, paddingHorizontal: spacing.xl, borderRadius: radii.md, justifyContent: 'center' },
    applyBtnText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: ON_ACCENT_COLOR },
    errorText: { fontSize: typography.size.xs, color: colors.ui.error, marginTop: spacing.sm },
    activeCode: {
        flexDirection: 'row', backgroundColor: colors.ui.surface, borderRadius: radii.lg,
        padding: spacing.lg, borderWidth: 1, borderColor: colors.ui.success + '40',
    },
    activeCodeLabel: { fontSize: typography.size.xs, color: colors.ui.success, fontWeight: typography.weight.bold, letterSpacing: 1, textTransform: 'uppercase' },
    activeCodeName: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.ui.text, marginTop: spacing.xxs },
    activeCodeMeta: { fontSize: typography.size.xs, color: colors.ui.textSecondary, marginTop: spacing.xxs },
    activeCodeBonus: { fontSize: typography.size.xs, color: colors.ui.gold, fontWeight: typography.weight.medium, marginTop: spacing.xs },
    removeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.glass.light, justifyContent: 'center', alignItems: 'center' },
    removeBtnText: { fontSize: 14, color: colors.ui.textSecondary },
    creatorCta: {
        backgroundColor: colors.ui.surface, borderRadius: radii.xl, padding: spacing.xl,
        marginTop: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.ui.gold + '30',
    },
    ctaIcon: { fontSize: 36, marginBottom: spacing.sm },
    ctaTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.ui.text },
    ctaDesc: { fontSize: typography.size.sm, color: colors.ui.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 18 },
    tierRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    tierChip: { backgroundColor: colors.glass.light, borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: 'center' },
    tierRate: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.ui.gold },
    tierName: { fontSize: 9, color: colors.ui.textTertiary, fontWeight: typography.weight.medium, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
});
