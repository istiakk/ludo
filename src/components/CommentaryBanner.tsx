/**
 * Ludo: Legends — Commentary Banner
 *
 * Animated banner that slides in from top for play-by-play commentary.
 * Queue system: max 1 banner at a time, next queued.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { type CommentaryLine, COMMENTARY_COLORS } from '../engine/MatchCommentary';
import { colors, typography, spacing, radii, shadows } from '../theme/design-system';

interface CommentaryBannerProps {
    line: CommentaryLine | null;
}

const DISPLAY_DURATION = 2500;
const SLIDE_DURATION = 300;

export default function CommentaryBanner({ line }: CommentaryBannerProps) {
    const translateY = useSharedValue(-80);
    const opacity = useSharedValue(0);
    const [displayedLine, setDisplayedLine] = useState<CommentaryLine | null>(null);

    useEffect(() => {
        if (!line) return;

        setDisplayedLine(line);

        // Slide in
        translateY.value = withSequence(
            withTiming(-80, { duration: 0 }),
            withTiming(0, { duration: SLIDE_DURATION, easing: Easing.out(Easing.cubic) }),
            // Hold
            withDelay(DISPLAY_DURATION,
                // Slide out
                withTiming(-80, { duration: SLIDE_DURATION, easing: Easing.in(Easing.cubic) }),
            ),
        );

        opacity.value = withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(1, { duration: 150 }),
            withDelay(DISPLAY_DURATION,
                withTiming(0, { duration: 250 }),
            ),
        );
    }, [line?.id]);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    if (!displayedLine) return null;

    const accentColor = COMMENTARY_COLORS[displayedLine.type] ?? colors.ui.accent;

    return (
        <Animated.View
            style={[styles.container, animStyle, { borderLeftColor: accentColor }]}
            pointerEvents="none"
        >
            <View style={[styles.glow, { backgroundColor: accentColor + '15' }]} />
            <Text style={styles.text} numberOfLines={2}>{displayedLine.text}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 100,
        left: spacing.base,
        right: spacing.base,
        backgroundColor: colors.ui.surfaceElevated + 'F0',
        borderRadius: radii.lg,
        borderLeftWidth: 4,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        zIndex: 200,
        ...shadows.lg,
        overflow: 'hidden',
    },
    glow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: radii.lg,
    },
    text: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
        lineHeight: typography.size.sm * 1.5,
    },
});
