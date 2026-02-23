/**
 * Ludo: Legends — Mode Selection Screen
 * 
 * Premium game mode selector with rule variant options.
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
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import { commonStyles, ON_ACCENT_COLOR } from '../src/theme/commonStyles';
import { ScreenHeader } from '../src/components/ui';
import { GameMode, MatchType, AIDifficulty } from '../src/engine/types';
import { saveLastUsedMode } from '../src/services/StorageService';

type SelectionStep = 'matchType' | 'mode' | 'difficulty';

export default function ModeSelectScreen() {
    const router = useRouter();
    const [step, setStep] = useState<SelectionStep>('matchType');
    const [selectedMatch, setSelectedMatch] = useState<MatchType | null>(null);
    const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
    const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('intermediate');

    const handleMatchType = (matchType: MatchType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedMatch(matchType);
        if (matchType === 'vs_ai') {
            setStep('difficulty');
        } else {
            setStep('mode');
        }
    };

    const handleDifficulty = (difficulty: AIDifficulty) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedDifficulty(difficulty);
        setStep('mode');
    };

    const handleMode = (mode: GameMode) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedMode(mode);

        // Save last used mode for quick resume
        saveLastUsedMode({
            mode,
            matchType: selectedMatch ?? 'vs_ai',
            difficulty: selectedDifficulty,
        }).catch(() => { });

        router.push({
            pathname: '/game',
            params: {
                mode,
                matchType: selectedMatch,
                difficulty: selectedDifficulty,
            },
        });
    };

    const handleBack = () => {
        if (step === 'mode') {
            setStep(selectedMatch === 'vs_ai' ? 'difficulty' : 'matchType');
        } else if (step === 'difficulty') {
            setStep('matchType');
        } else {
            router.back();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {step === 'matchType' ? 'CHOOSE BATTLE' : step === 'difficulty' ? 'AI DIFFICULTY' : 'GAME MODE'}
                </Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
                {/* Step 1: Match Type */}
                {step === 'matchType' && (
                    <View style={styles.optionGrid}>
                        <OptionCard
                            icon="⚔️"
                            title="1v1 Duel"
                            description="Head-to-head competitive match. Prove your skill in ranked play."
                            accent={colors.player.red}
                            tags={['Ranked', 'Competitive']}
                            onPress={() => handleMatchType('1v1')}
                        />
                        <OptionCard
                            icon="🤝"
                            title="2v2 Team Battle"
                            description="Team up with a friend. Coordinate moves, share victories."
                            accent={colors.player.green}
                            tags={['Team Play', 'Strategy']}
                            onPress={() => handleMatchType('2v2')}
                        />
                        <OptionCard
                            icon="🤖"
                            title="vs Computer"
                            description="Challenge the AI. Four difficulty levels from casual to grandmaster."
                            accent={colors.player.blue}
                            tags={['Solo', 'Practice', 'Coaching']}
                            onPress={() => handleMatchType('vs_ai')}
                        />
                    </View>
                )}

                {/* Step 2: AI Difficulty */}
                {step === 'difficulty' && (
                    <View style={styles.optionGrid}>
                        <OptionCard
                            icon="😊"
                            title="Casual"
                            description="Relaxed gameplay. Makes occasional mistakes. Great for learning."
                            accent="#6BCB77"
                            tags={['Easy']}
                            onPress={() => handleDifficulty('casual')}
                        />
                        <OptionCard
                            icon="🧠"
                            title="Intermediate"
                            description="Smart and calculated. A fair challenge for regular players."
                            accent={colors.ui.accent}
                            tags={['Medium']}
                            onPress={() => handleDifficulty('intermediate')}
                        />
                        <OptionCard
                            icon="👑"
                            title="Expert"
                            description="Looks one move ahead. Blocks aggressively, captures ruthlessly."
                            accent={colors.ui.warning}
                            tags={['Hard']}
                            onPress={() => handleDifficulty('expert')}
                        />
                        <OptionCard
                            icon="🏆"
                            title="Grandmaster"
                            description="Probability-weighted future analysis. Good luck."
                            accent={colors.ui.error}
                            tags={['Extreme']}
                            onPress={() => handleDifficulty('grandmaster')}
                        />
                    </View>
                )}

                {/* Step 3: Rule Variant */}
                {step === 'mode' && (
                    <View style={styles.optionGrid}>
                        <OptionCard
                            icon="♟️"
                            title="Classic Ludo"
                            description="Traditional rules. Roll a 6 to spawn, capture to send home, first to finish all 4 tokens wins."
                            accent={colors.ui.text}
                            tags={['Standard', 'All Ages']}
                            onPress={() => handleMode('classic')}
                        />
                        <OptionCard
                            icon="⚡"
                            title="Speed Ludo"
                            description="Faster pace: 2 tokens each, shorter paths. Games finish in under 5 minutes."
                            accent={colors.player.yellow}
                            tags={['Fast', '5 min']}
                            onPress={() => handleMode('speed')}
                        />
                        <OptionCard
                            icon="🔥"
                            title="Pro Ludo"
                            description="Competitive variant: no triple-six penalty, strategic blocking rules, capture chains."
                            accent={colors.ui.accentWarm}
                            tags={['Ranked', 'Competitive']}
                            onPress={() => handleMode('pro')}
                        />
                        <OptionCard
                            icon="🌿"
                            title="Casual Ludo"
                            description="Relaxed rules: easier spawning, no penalties. Perfect for family game night."
                            accent={colors.ui.success}
                            tags={['Relaxed', 'Family']}
                            onPress={() => handleMode('casual')}
                        />
                        <OptionCard
                            icon="⏱️"
                            title="Quick Ludo"
                            description="Lightning-fast: 2 tokens, shortened board, 5-minute time limit. Perfect for a quick match!"
                            accent="#FF6B6B"
                            tags={['NEW', '5 min', '2 Tokens']}
                            onPress={() => handleMode('quick')}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Option Card Component ──────────────────────────────────────

interface OptionCardProps {
    icon: string;
    title: string;
    description: string;
    accent: string;
    tags: string[];
    onPress: () => void;
}

function OptionCard({ icon, title, description, accent, tags, onPress }: OptionCardProps) {
    return (
        <TouchableOpacity
            style={[styles.optionCard, { borderColor: accent + '30' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{icon}</Text>
                <View style={styles.cardTags}>
                    {tags.map(tag => (
                        <View key={tag} style={[styles.tag, { backgroundColor: accent + '20' }]}>
                            <Text style={[styles.tagText, { color: accent }]}>{tag}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
        </TouchableOpacity>
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
    content: {
        flex: 1,
    },
    contentInner: {
        paddingHorizontal: spacing.base,
        paddingTop: spacing.lg,
        paddingBottom: spacing['3xl'],
    },
    optionGrid: {
        gap: spacing.md,
    },
    optionCard: {
        backgroundColor: colors.ui.surface,
        borderRadius: radii.xl,
        padding: spacing.lg,
        borderWidth: 1,
        ...shadows.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    cardIcon: {
        fontSize: 32,
    },
    cardTags: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    tag: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radii.full,
    },
    tagText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semiBold,
        letterSpacing: 0.5,
    },
    cardTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
        marginBottom: spacing.xs,
    },
    cardDescription: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        lineHeight: typography.size.sm * typography.lineHeight.relaxed,
    },
});
