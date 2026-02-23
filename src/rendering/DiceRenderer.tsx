/**
 * Ludo: Legends — Dice Renderer
 * 
 * Beautiful animated dice with dot patterns, roll physics feel,
 * and premium styling. Purely visual — logic is in Dice.ts.
 * 
 * SME Agent: game-development, ui-ux-pro-max, mobile-design
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withSpring,
    withDelay,
    Easing,
    runOnJS,
    interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DiceRoll } from '../engine/types';
import { colors, radii, shadows, animation, spacing } from '../theme/design-system';

interface DiceRendererProps {
    currentRoll: DiceRoll | null;
    isRolling: boolean;
    playerColor: string;
    onRoll: () => void;
    disabled: boolean;
}

export default function DiceRenderer({
    currentRoll,
    isRolling,
    playerColor,
    onRoll,
    disabled,
}: DiceRendererProps) {
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const playBounceHaptic = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    useEffect(() => {
        if (currentRoll) {
            // Realistic throw trajectory (Y-axis bounce)
            translateY.value = withSequence(
                withTiming(-120, { duration: 150, easing: Easing.out(Easing.quad) }), // Throw up
                withTiming(0, { duration: 150, easing: Easing.in(Easing.quad) }, (finished) => { if (finished) runOnJS(playBounceHaptic)(); }), // Hit 1
                withTiming(-60, { duration: 120, easing: Easing.out(Easing.quad) }), // Bounce up
                withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) }, (finished) => { if (finished) runOnJS(playBounceHaptic)(); }), // Hit 2
                withTiming(-20, { duration: 80, easing: Easing.out(Easing.quad) }),  // Micro bounce
                withTiming(0, { duration: 80, easing: Easing.in(Easing.quad) }, (finished) => { if (finished) runOnJS(playBounceHaptic)(); })   // Hit 3
            );

            // Scale (parallax to match height)
            scale.value = withSequence(
                withTiming(1.4, { duration: 150 }),
                withTiming(1.0, { duration: 150 }),
                withTiming(1.15, { duration: 120 }),
                withTiming(1.0, { duration: 120 }),
                withTiming(1.05, { duration: 80 }),
                withTiming(1.0, { duration: 80 })
            );

            // X-axis random wandering to make rolls feel chaotic
            const randomX = (Math.random() - 0.5) * 80;
            translateX.value = withSequence(
                withTiming(randomX, { duration: 300, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 340, easing: Easing.inOut(Easing.quad) })
            );

            // Rotation (tumble)
            rotation.value = withSequence(
                withTiming(360 * 3 + (Math.random() * 90), { duration: 640, easing: Easing.out(Easing.cubic) }),
                withTiming(0, { duration: 0 })
            );

            opacity.value = withSequence(
                withTiming(0.8, { duration: 100 }),
                withTiming(1, { duration: 300 }),
            );
        }
    }, [currentRoll]);

    const diceAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
            { rotateZ: `${rotation.value}deg` },
        ],
        opacity: opacity.value,
    }));

    const handlePress = async () => {
        if (disabled) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onRoll();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={handlePress}
                disabled={disabled}
                activeOpacity={0.8}
            >
                <Animated.View
                    style={[
                        styles.dice,
                        { borderColor: playerColor + '60' },
                        diceAnimatedStyle,
                    ]}
                >
                    {currentRoll ? (
                        <DiceFace value={currentRoll.value} color={playerColor} />
                    ) : (
                        <DiceFace value={null} color={playerColor} />
                    )}
                </Animated.View>
            </TouchableOpacity>

            {!disabled && !currentRoll && (
                <Animated.Text style={[styles.tapHint, { color: playerColor }]}>
                    TAP TO ROLL
                </Animated.Text>
            )}
        </View>
    );
}

// ─── Dice Face with Dot Patterns ────────────────────────────────

function DiceFace({ value, color }: { value: number | null; color: string }) {
    const dotColor = '#FFFFFF';
    const dotSize = 6;

    // Dot positions for each dice value (relative to center, normalized -1 to 1)
    const dotPatterns: Record<number, Array<{ x: number; y: number }>> = {
        1: [{ x: 0, y: 0 }],
        2: [{ x: -0.5, y: -0.5 }, { x: 0.5, y: 0.5 }],
        3: [{ x: -0.5, y: -0.5 }, { x: 0, y: 0 }, { x: 0.5, y: 0.5 }],
        4: [{ x: -0.5, y: -0.5 }, { x: 0.5, y: -0.5 }, { x: -0.5, y: 0.5 }, { x: 0.5, y: 0.5 }],
        5: [
            { x: -0.5, y: -0.5 }, { x: 0.5, y: -0.5 },
            { x: 0, y: 0 },
            { x: -0.5, y: 0.5 }, { x: 0.5, y: 0.5 },
        ],
        6: [
            { x: -0.5, y: -0.6 }, { x: 0.5, y: -0.6 },
            { x: -0.5, y: 0 }, { x: 0.5, y: 0 },
            { x: -0.5, y: 0.6 }, { x: 0.5, y: 0.6 },
        ],
    };

    if (!value) {
        return (
            <View style={styles.faceContainer}>
                <View style={[styles.questionMark]}>
                    <Animated.Text style={[styles.questionMarkText, { color }]}>?</Animated.Text>
                </View>
            </View>
        );
    }

    const dots = dotPatterns[value] || [];
    const faceSize = 48;

    return (
        <View style={styles.faceContainer}>
            {dots.map((dot, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            width: dotSize,
                            height: dotSize,
                            borderRadius: dotSize / 2,
                            backgroundColor: dotColor,
                            left: faceSize / 2 + dot.x * (faceSize * 0.35) - dotSize / 2,
                            top: faceSize / 2 + dot.y * (faceSize * 0.35) - dotSize / 2,
                        },
                    ]}
                />
            ))}
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: spacing.sm,
    },
    dice: {
        width: 72,
        height: 72,
        borderRadius: radii.lg,
        backgroundColor: colors.ui.surfaceElevated,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.lg,
    },
    faceContainer: {
        width: 48,
        height: 48,
        position: 'relative',
    },
    dot: {
        position: 'absolute',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
    },
    questionMark: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    questionMarkText: {
        fontSize: 28,
        fontWeight: '700',
        opacity: 0.4,
    },
    tapHint: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 3,
        opacity: 0.6,
    },
});
