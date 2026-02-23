/**
 * Ludo: Legends — Share & Creator Screen
 * 
 * Two sections:
 * 1. Challenge Cards — generate and share match result cards
 * 2. Creator Code — enter/manage active creator code
 */

import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
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
    formatCommission,
    getCreatorTier,
    getTierProgress,
    getFanBonus,
    type ActiveCreatorCode,
} from '../src/services/CreatorCodeService';

// ─── Demo Data ──────────────────────────────────────────────────

const DEMO_MATCH: MatchResultInput = {
    won: true,
    playerName: 'You',
    playerRank: 'Gold II',
    playerAvatar: null,
    opponentName: 'RivalPlayer',
    captures: 3,
    tokensFinished: 4,
    durationMs: 195_000,
    winStreak: 3,
    comebackWin: false,
    mode: 'classic',
};

// ─── Screen ─────────────────────────────────────────────────────

export default function ShareScreen() {
    const router = useRouter();
    const [activeCode, setActiveCode] = useState<ActiveCreatorCode | null>(null);
    const [codeInput, setCodeInput] = useState('');
    const [codeLookupError, setCodeLookupError] = useState<string | null>(null);

    // Generate a demo challenge card
    const challengeCard = useMemo(() => generateChallengeCard(DEMO_MATCH), []);

    const handleShare = async (platform: SharePlatform) => {
        const text = generateShareText(challengeCard, platform, activeCode?.code);
        try {
            await Share.share({
                message: text,
                url: challengeCard.challengeLink,
            });
        } catch {
            // User cancelled
        }
    };

    const handleApplyCode = () => {
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

        Alert.alert(
            'Creator Code Applied! 🎉',
            `Supporting ${creator.displayName}! You'll get 5% bonus gems on your next purchase.`,
        );
    };

    const handleRemoveCode = () => {
        setActiveCode(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backBtn}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>SHARE & CREATE</Text>
                    <View style={{ width: 50 }} />
                </View>

                {/* ─── Challenge Card Preview ─────── */}
                <Text style={styles.sectionLabel}>YOUR CHALLENGE CARD</Text>
                <ChallengeCardPreview card={challengeCard} />

                {/* Share Buttons */}
                <View style={styles.shareRow}>
                    <ShareButton icon="𝕏" label="Twitter" color="#1DA1F2" onPress={() => handleShare('twitter')} />
                    <ShareButton icon="📸" label="Instagram" color="#E1306C" onPress={() => handleShare('instagram')} />
                    <ShareButton icon="🎵" label="TikTok" color="#00F2EA" onPress={() => handleShare('tiktok')} />
                    <ShareButton icon="📘" label="Facebook" color="#4267B2" onPress={() => handleShare('facebook')} />
                </View>

                <TouchableOpacity style={styles.copyBtn} onPress={() => handleShare('clipboard')}>
                    <Text style={styles.copyBtnText}>📋 Copy Share Link</Text>
                </TouchableOpacity>

                {/* ─── Creator Code Section ────── */}
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>CREATOR CODE</Text>
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
                        />
                        <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCode}>
                            <Text style={styles.applyBtnText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {codeLookupError && (
                    <Text style={styles.errorText}>{codeLookupError}</Text>
                )}

                {/* Creator Program CTA */}
                <View style={styles.creatorCta}>
                    <Text style={styles.ctaIcon}>🌟</Text>
                    <Text style={styles.ctaTitle}>Become a Creator</Text>
                    <Text style={styles.ctaDesc}>
                        Earn 5-15% commission on sales from your fans. Build your audience, grow your earnings.
                    </Text>
                    <View style={styles.tierRow}>
                        {['5%', '8%', '10%', '15%'].map((rate, i) => (
                            <View key={i} style={styles.tierChip}>
                                <Text style={styles.tierRate}>{rate}</Text>
                                <Text style={styles.tierName}>
                                    {['Starter', 'Partner', 'Ambassador', 'Legend'][i]}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Challenge Card Preview Component ───────────────────────────

function ChallengeCardPreview({ card }: { card: ChallengeCard }) {
    return (
        <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.cardBrand}>LUDO LEGENDS</Text>
                <Text style={styles.cardBadge}>🏅 {card.playerRank}</Text>
            </View>

            {/* Main Content */}
            <Text style={styles.cardHeadline}>{card.headline}</Text>
            <Text style={styles.cardSub}>{card.subheadline}</Text>

            {/* Stats Row */}
            <View style={styles.cardStats}>
                {card.stats.map((stat, i) => (
                    <View key={i} style={styles.statBlock}>
                        <Text style={styles.statIcon}>{stat.icon}</Text>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
                <Text style={styles.cardPlayer}>🎲 {card.playerName}</Text>
                <Text style={styles.cardCta}>Tap to challenge →</Text>
            </View>
        </View>
    );
}

// ─── Active Code Display ────────────────────────────────────────

function ActiveCodeDisplay({
    code,
    onRemove,
}: {
    code: ActiveCreatorCode;
    onRemove: () => void;
}) {
    return (
        <View style={styles.activeCode}>
            <View style={styles.activeCodeInfo}>
                <Text style={styles.activeCodeLabel}>Supporting</Text>
                <Text style={styles.activeCodeName}>{code.creatorName}</Text>
                <Text style={styles.activeCodeMeta}>
                    Code: {code.code} · {formatCodeExpiry(code.expiresAt)}
                </Text>
                <Text style={styles.activeCodeBonus}>+5% bonus gems on purchases 🎁</Text>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
                <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Share Button Component ─────────────────────────────────────

function ShareButton({
    icon,
    label,
    color,
    onPress,
}: {
    icon: string;
    label: string;
    color: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={[styles.shareBtn, { borderColor: color + '60' }]} onPress={onPress}>
            <Text style={styles.shareBtnIcon}>{icon}</Text>
            <Text style={[styles.shareBtnLabel, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ui.background,
    },
    scroll: {
        paddingHorizontal: spacing.base,
        paddingBottom: spacing['5xl'],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    backBtn: {
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
    sectionLabel: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary,
        letterSpacing: 3,
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },
    sectionDesc: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        lineHeight: 18,
        marginBottom: spacing.md,
    },

    // Challenge Card
    card: {
        backgroundColor: colors.ui.surface,
        borderRadius: radii.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.ui.border,
        ...shadows.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    cardBrand: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: colors.ui.accent,
        letterSpacing: 2,
    },
    cardBadge: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semiBold,
        color: colors.ui.gold,
    },
    cardHeadline: {
        fontSize: typography.size['2xl'],
        fontWeight: typography.weight.extraBold,
        color: colors.ui.text,
        marginBottom: spacing.xs,
    },
    cardSub: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        marginBottom: spacing.lg,
    },
    cardStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: colors.glass.light,
        borderRadius: radii.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    statBlock: {
        alignItems: 'center',
    },
    statIcon: {
        fontSize: 18,
        marginBottom: spacing.xxs,
    },
    statValue: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
    },
    statLabel: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
        marginTop: spacing.xxs,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardPlayer: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semiBold,
        color: colors.ui.text,
    },
    cardCta: {
        fontSize: typography.size.xs,
        color: colors.ui.accent,
        fontWeight: typography.weight.medium,
    },

    // Share Buttons
    shareRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.lg,
    },
    shareBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        backgroundColor: colors.ui.surface,
    },
    shareBtnIcon: {
        fontSize: 20,
        marginBottom: spacing.xxs,
    },
    shareBtnLabel: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semiBold,
    },
    copyBtn: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginTop: spacing.sm,
        backgroundColor: colors.glass.light,
        borderRadius: radii.md,
    },
    copyBtnText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
        color: colors.ui.text,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: colors.ui.border,
        marginVertical: spacing.xl,
    },

    // Creator Code Input
    codeInputRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    codeInput: {
        flex: 1,
        backgroundColor: colors.ui.surface,
        borderRadius: radii.md,
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
        borderWidth: 1,
        borderColor: colors.ui.border,
        letterSpacing: 2,
    },
    applyBtn: {
        backgroundColor: colors.ui.accent,
        paddingHorizontal: spacing.xl,
        borderRadius: radii.md,
        justifyContent: 'center',
    },
    applyBtnText: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    errorText: {
        fontSize: typography.size.xs,
        color: colors.ui.error,
        marginTop: spacing.sm,
    },

    // Active Code
    activeCode: {
        flexDirection: 'row',
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.ui.success + '40',
    },
    activeCodeInfo: {
        flex: 1,
    },
    activeCodeLabel: {
        fontSize: typography.size.xs,
        color: colors.ui.success,
        fontWeight: typography.weight.bold,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    activeCodeName: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
        marginTop: spacing.xxs,
    },
    activeCodeMeta: {
        fontSize: typography.size.xs,
        color: colors.ui.textSecondary,
        marginTop: spacing.xxs,
    },
    activeCodeBonus: {
        fontSize: typography.size.xs,
        color: colors.ui.gold,
        fontWeight: typography.weight.medium,
        marginTop: spacing.xs,
    },
    removeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.glass.light,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeBtnText: {
        fontSize: 14,
        color: colors.ui.textSecondary,
    },

    // Creator CTA
    creatorCta: {
        backgroundColor: colors.ui.surface,
        borderRadius: radii.xl,
        padding: spacing.xl,
        marginTop: spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.ui.gold + '30',
    },
    ctaIcon: {
        fontSize: 36,
        marginBottom: spacing.sm,
    },
    ctaTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
    },
    ctaDesc: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        lineHeight: 18,
    },
    tierRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.lg,
    },
    tierChip: {
        backgroundColor: colors.glass.light,
        borderRadius: radii.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    tierRate: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: colors.ui.gold,
    },
    tierName: {
        fontSize: 9,
        color: colors.ui.textTertiary,
        fontWeight: typography.weight.medium,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
