/**
 * Ludo: Legends — Tutorial / Onboarding
 * 
 * 4-step carousel that teaches new players how to play.
 * Shows automatically on first launch, accessible from settings.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    FlatList,
    Dimensions,
    type ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Tutorial Steps ─────────────────────────────────────────────

interface TutorialStep {
    id: string;
    icon: string;
    title: string;
    description: string;
    highlights: string[];
    color: string;
}

const STEPS: TutorialStep[] = [
    {
        id: 'goal',
        icon: '🏠',
        title: 'Race Home',
        description: 'Move all 4 tokens from your yard, around the board, and into your home column. First to finish all 4 wins!',
        highlights: [
            'Roll dice to move tokens',
            'Complete a full loop of the board',
            'Enter your home column to finish',
        ],
        color: colors.player.red,
    },
    {
        id: 'dice',
        icon: '🎲',
        title: 'Rolling & Spawning',
        description: 'Tap the dice to roll. You need a 6 to bring a new token onto the board. Rolling a 6 also gives you an extra turn!',
        highlights: [
            'Roll 6 → spawn a new token',
            'Roll 6 → get another turn',
            '3 sixes in a row → penalty!',
        ],
        color: colors.player.green,
    },
    {
        id: 'capture',
        icon: '⚔️',
        title: 'Capture & Safety',
        description: 'Land on an opponent\'s token to send it back home! But watch out — star spaces (★) are safe zones where you can\'t be captured.',
        highlights: [
            'Capture → send opponent home',
            'Capture → earn an extra turn',
            'Stars ★ = safe from capture',
        ],
        color: colors.player.yellow,
    },
    {
        id: 'strategy',
        icon: '🧠',
        title: 'Play Smart',
        description: 'Choose wisely! Move tokens closest to home first, use safe zones strategically, and keep your tokens spread out to reduce risk.',
        highlights: [
            'Threat overlay shows danger zones',
            'Coaching hints suggest best moves',
            '4 game modes for every skill level',
        ],
        color: colors.player.blue,
    },
];

// ─── Component ──────────────────────────────────────────────────

export default function TutorialScreen() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }, []);

    const goNext = () => {
        if (currentIndex < STEPS.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            router.replace('/');
        }
    };

    const skip = () => {
        router.replace('/');
    };

    const renderStep = ({ item, index }: ListRenderItemInfo<TutorialStep>) => (
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconCircle, { borderColor: item.color + '40' }]}>
                <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={styles.stepTitle}>{item.title}</Text>
            <Text style={styles.stepDesc}>{item.description}</Text>

            <View style={styles.highlightBox}>
                {item.highlights.map((h, i) => (
                    <View key={i} style={styles.highlightRow}>
                        <Text style={[styles.highlightBullet, { color: item.color }]}>●</Text>
                        <Text style={styles.highlightText}>{h}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>HOW TO PLAY</Text>
                <TouchableOpacity onPress={skip}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            {/* Carousel */}
            <FlatList
                ref={flatListRef}
                data={STEPS}
                renderItem={renderStep}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                bounces={false}
            />

            {/* Pagination dots */}
            <View style={styles.pagination}>
                {STEPS.map((step, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            i === currentIndex && { backgroundColor: step.color, width: 24 },
                        ]}
                    />
                ))}
            </View>

            {/* CTA Button */}
            <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: STEPS[currentIndex].color }]}
                onPress={goNext}
                activeOpacity={0.8}
            >
                <Text style={styles.ctaText}>
                    {currentIndex < STEPS.length - 1 ? 'Next' : 'Start Playing!'}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary,
        letterSpacing: 3,
    },
    skipText: {
        fontSize: typography.size.base,
        color: colors.ui.textSecondary,
        fontWeight: typography.weight.medium,
    },
    slide: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['2xl'],
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        backgroundColor: colors.ui.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
        ...shadows.md,
    },
    icon: {
        fontSize: 44,
    },
    stepTitle: {
        fontSize: typography.size['3xl'],
        fontWeight: typography.weight.extraBold,
        color: colors.ui.text,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    stepDesc: {
        fontSize: typography.size.base,
        color: colors.ui.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
        maxWidth: 300,
    },
    highlightBox: {
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        width: '100%',
        gap: spacing.md,
    },
    highlightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    highlightBullet: {
        fontSize: 8,
    },
    highlightText: {
        fontSize: typography.size.sm,
        color: colors.ui.text,
        fontWeight: typography.weight.medium,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
        marginVertical: spacing.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.ui.border,
    },
    ctaBtn: {
        marginHorizontal: spacing['2xl'],
        marginBottom: spacing['2xl'],
        paddingVertical: spacing.md,
        borderRadius: radii.full,
        alignItems: 'center',
    },
    ctaText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
