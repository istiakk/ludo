/**
 * Ludo: Legends — Screen Effects
 *
 * Full-screen visual effects layer rendered above the game board.
 * Handles screen shake, flash overlays, combo text, and radial pulses.
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withSpring,
    withDelay,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { GameEffect, ScreenShakeIntensity } from './GameEffectsEngine';
import { colors, typography, spacing } from '../theme/design-system';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ScreenEffectsProps {
    effects: GameEffect[];
    onEffectsConsumed: () => void;
}

const SHAKE_MAGNITUDES: Record<ScreenShakeIntensity, number> = {
    light: 3,
    medium: 6,
    heavy: 10,
    earthquake: 16,
};

export default function ScreenEffects({ effects, onEffectsConsumed }: ScreenEffectsProps) {
    // ─── Shake ──────────────────────────
    const shakeX = useSharedValue(0);
    const shakeY = useSharedValue(0);

    // ─── Flash ──────────────────────────
    const flashOpacity = useSharedValue(0);
    const flashColor = useSharedValue('gold');

    // ─── Combo Text ─────────────────────
    const comboScale = useSharedValue(0);
    const comboOpacity = useSharedValue(0);
    const comboText = useSharedValue('');
    const [displayCombo, setDisplayCombo] = React.useState('');

    // ─── Process Effects ────────────────
    useEffect(() => {
        if (effects.length === 0) return;

        for (const effect of effects) {
            switch (effect.type) {
                case 'screen_shake': {
                    const mag = SHAKE_MAGNITUDES[effect.intensity];
                    shakeX.value = withSequence(
                        withTiming(-mag, { duration: 40 }),
                        withTiming(mag, { duration: 40 }),
                        withTiming(-mag * 0.6, { duration: 35 }),
                        withTiming(mag * 0.4, { duration: 30 }),
                        withTiming(0, { duration: 50 }),
                    );
                    shakeY.value = withSequence(
                        withTiming(-mag * 0.5, { duration: 40 }),
                        withTiming(mag * 0.5, { duration: 40 }),
                        withTiming(0, { duration: 50 }),
                    );

                    // Haptic scales with intensity
                    if (effect.intensity === 'earthquake') {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    } else if (effect.intensity === 'heavy') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    } else {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    break;
                }

                case 'flash': {
                    flashOpacity.value = withSequence(
                        withTiming(0.25, { duration: 80 }),
                        withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
                    );
                    break;
                }

                case 'combo': {
                    setDisplayCombo(effect.label);
                    comboScale.value = withSequence(
                        withTiming(0, { duration: 0 }),
                        withSpring(1.2, { damping: 6, stiffness: 300 }),
                        withSpring(1.0, { damping: 10 }),
                        withDelay(1500, withTiming(0.8, { duration: 200 })),
                    );
                    comboOpacity.value = withSequence(
                        withTiming(1, { duration: 100 }),
                        withDelay(1500, withTiming(0, { duration: 300 })),
                    );
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                }
            }
        }

        // Notify parent that effects have been consumed
        const timeout = setTimeout(() => onEffectsConsumed(), 50);
        return () => clearTimeout(timeout);
    }, [effects]);

    // ─── Animated Styles ────────────────
    const shakeStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: shakeX.value },
            { translateY: shakeY.value },
        ],
    }));

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
    }));

    const comboStyle = useAnimatedStyle(() => ({
        transform: [{ scale: comboScale.value }],
        opacity: comboOpacity.value,
    }));

    return (
        <>
            {/* Shake wrapper - wraps the entire game content */}
            <Animated.View style={[StyleSheet.absoluteFill, shakeStyle]} pointerEvents="none" />

            {/* Flash overlay */}
            <Animated.View
                style={[styles.flashOverlay, flashStyle]}
                pointerEvents="none"
            />

            {/* Combo text */}
            <Animated.View style={[styles.comboContainer, comboStyle]} pointerEvents="none">
                <Text style={styles.comboText}>{displayCombo}</Text>
            </Animated.View>
        </>
    );
}

const styles = StyleSheet.create({
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.ui.gold,
        zIndex: 100,
    },
    comboContainer: {
        position: 'absolute',
        top: SCREEN_H * 0.35,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 101,
    },
    comboText: {
        fontSize: typography.size['4xl'],
        fontWeight: typography.weight.extraBold,
        color: colors.ui.gold,
        textShadowColor: '#000000CC',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
        letterSpacing: 2,
    },
});
