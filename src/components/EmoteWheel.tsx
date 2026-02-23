/**
 * Ludo: Legends — Emote Wheel
 *
 * Quick-access radial emote selector during gameplay.
 * 8 emotes, animated bubble float, 3s cooldown.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radii, shadows } from '../theme/design-system';

const EMOTES = [
    { id: 'clap', emoji: '👏', label: 'Nice!' },
    { id: 'laugh', emoji: '😂', label: 'LOL' },
    { id: 'angry', emoji: '😡', label: 'Grr!' },
    { id: 'target', emoji: '🎯', label: 'Calculated' },
    { id: 'fire', emoji: '🔥', label: 'On Fire!' },
    { id: 'skull', emoji: '💀', label: 'Rekt' },
    { id: 'cool', emoji: '😎', label: 'Cool' },
    { id: 'shrug', emoji: '🤷', label: 'Meh' },
];

const COOLDOWN_MS = 3000;

interface EmoteWheelProps {
    onEmote: (emoteId: string) => void;
    playerColor: string;
}

export default function EmoteWheel({ onEmote, playerColor }: EmoteWheelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [cooldown, setCooldown] = useState(false);
    const [sentEmote, setSentEmote] = useState<string | null>(null);
    const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Floating bubble animation
    const bubbleScale = useSharedValue(0);
    const bubbleOpacity = useSharedValue(0);
    const bubbleY = useSharedValue(0);

    const handleToggle = useCallback(() => {
        Haptics.selectionAsync();
        setIsOpen(prev => !prev);
    }, []);

    const handleEmote = useCallback((emoteId: string, emoji: string) => {
        if (cooldown) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsOpen(false);
        setCooldown(true);
        setSentEmote(emoji);
        onEmote(emoteId);

        // Float the bubble
        bubbleScale.value = withSequence(
            withTiming(0, { duration: 0 }),
            withSpring(1.2, { damping: 8, stiffness: 200 }),
            withSpring(1.0, { damping: 12 }),
            withDelay(1500, withTiming(0.5, { duration: 300 })),
        );
        bubbleOpacity.value = withSequence(
            withTiming(1, { duration: 100 }),
            withDelay(1500, withTiming(0, { duration: 500 })),
        );
        bubbleY.value = withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(-60, { duration: 2000, easing: Easing.out(Easing.cubic) }),
        );

        // Reset cooldown
        if (cooldownRef.current) clearTimeout(cooldownRef.current);
        cooldownRef.current = setTimeout(() => {
            setCooldown(false);
            setSentEmote(null);
        }, COOLDOWN_MS);
    }, [cooldown, onEmote]);

    const bubbleStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: bubbleScale.value },
            { translateY: bubbleY.value },
        ],
        opacity: bubbleOpacity.value,
    }));

    return (
        <View style={styles.container}>
            {/* Floating Emote Bubble */}
            {sentEmote && (
                <Animated.View style={[styles.bubble, bubbleStyle]}>
                    <Text style={styles.bubbleEmoji}>{sentEmote}</Text>
                </Animated.View>
            )}

            {/* Emote Grid (when open) */}
            {isOpen && (
                <View style={styles.wheel}>
                    {EMOTES.map((emote) => (
                        <TouchableOpacity
                            key={emote.id}
                            style={[styles.emoteBtn, cooldown && styles.emoteBtnDisabled]}
                            onPress={() => handleEmote(emote.id, emote.emoji)}
                            disabled={cooldown}
                            accessibilityLabel={emote.label}
                        >
                            <Text style={styles.emoteEmoji}>{emote.emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Trigger Button */}
            <TouchableOpacity
                style={[
                    styles.trigger,
                    { borderColor: playerColor + '60' },
                    cooldown && styles.triggerCooldown,
                ]}
                onPress={handleToggle}
                disabled={cooldown}
                accessibilityLabel="Open emotes"
            >
                <Text style={styles.triggerText}>
                    {cooldown ? '⏳' : isOpen ? '✕' : '😀'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 140,
        right: spacing.base,
        alignItems: 'center',
        zIndex: 50,
    },
    trigger: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.ui.surfaceElevated,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
    },
    triggerCooldown: {
        opacity: 0.5,
    },
    triggerText: {
        fontSize: 20,
    },
    wheel: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 160,
        backgroundColor: colors.ui.surfaceElevated + 'F5',
        borderRadius: radii.xl,
        padding: spacing.sm,
        marginBottom: spacing.sm,
        gap: spacing.xs,
        ...shadows.lg,
    },
    emoteBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.glass.light,
    },
    emoteBtnDisabled: {
        opacity: 0.3,
    },
    emoteEmoji: {
        fontSize: 18,
    },
    bubble: {
        position: 'absolute',
        bottom: 60,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.ui.surfaceElevated,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.lg,
        borderWidth: 2,
        borderColor: colors.ui.gold + '40',
    },
    bubbleEmoji: {
        fontSize: 28,
    },
});
