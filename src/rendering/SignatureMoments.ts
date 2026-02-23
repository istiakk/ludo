/**
 * Ludo: Legends — Signature Moments
 * 
 * Cinematic micro-animations for key game events.
 * Creates "wow" moments that make the game feel premium.
 * 
 * SME Agent: game-development/game-design, ui-ux-pro-max, mobile-design
 */

import Animated, {
    withTiming,
    withSpring,
    withSequence,
    withDelay,
    withRepeat,
    Easing,
    SharedValue,
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ─── Animation Presets ──────────────────────────────────────────

export const SignatureAnimations = {
    /**
     * Capture animation: the capturing token zooms in, shakes, then settles.
     * The captured token fades out with a shrink.
     */
    capture: {
        attacker: {
            scale: () => withSequence(
                withTiming(1.4, { duration: 150, easing: Easing.out(Easing.cubic) }),
                withSpring(1.0, { damping: 6, stiffness: 200 }),
            ),
            rotation: () => withSequence(
                withTiming(-5, { duration: 50 }),
                withTiming(5, { duration: 50 }),
                withTiming(-3, { duration: 50 }),
                withTiming(0, { duration: 100 }),
            ),
        },
        victim: {
            opacity: () => withSequence(
                withTiming(0.5, { duration: 100 }),
                withTiming(0, { duration: 300 }),
            ),
            scale: () => withSequence(
                withTiming(1.2, { duration: 100 }),
                withTiming(0, { duration: 300 }),
            ),
        },
        haptic: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    },

    /**
     * Token finish: golden pulse effect + celebration.
     */
    tokenFinish: {
        scale: () => withSequence(
            withTiming(1.5, { duration: 200, easing: Easing.out(Easing.cubic) }),
            withSpring(1.0, { damping: 8, stiffness: 150 }),
        ),
        opacity: () => withSequence(
            withTiming(0.6, { duration: 100 }),
            withTiming(1.0, { duration: 200 }),
        ),
        glowRadius: () => withSequence(
            withTiming(20, { duration: 300 }),
            withTiming(0, { duration: 500 }),
        ),
        haptic: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    },

    /**
     * Dice roll anticipation: subtle build-up before result reveals.
     */
    diceAnticipation: {
        scale: () => withSequence(
            withTiming(0.85, { duration: 200 }),
            withTiming(1.15, { duration: 100 }),
            withSpring(1.0, { damping: 10 }),
        ),
        rotation: () => withRepeat(
            withSequence(
                withTiming(360, { duration: 200, easing: Easing.linear }),
            ),
            3, // 3 full rotations
            false,
        ),
    },

    /**
     * Rolling a 6: extra celebration pulse.
     */
    luckyRoll: {
        scale: () => withSequence(
            withSpring(1.3, { damping: 4, stiffness: 300 }),
            withSpring(1.0, { damping: 8 }),
        ),
        haptic: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    },

    /**
     * Game win: screen-wide victory animation.
     */
    victory: {
        trophyScale: () => withSequence(
            withTiming(0, { duration: 0 }),
            withDelay(200, withSpring(1.2, { damping: 6, stiffness: 150 })),
            withSpring(1.0, { damping: 10 }),
        ),
        textOpacity: () => withSequence(
            withTiming(0, { duration: 0 }),
            withDelay(600, withTiming(1, { duration: 400 })),
        ),
        confettiDelay: 400, // ms before confetti starts
        haptic: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await new Promise(resolve => setTimeout(resolve, 200));
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await new Promise(resolve => setTimeout(resolve, 200));
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        },
    },

    /**
     * Turn change: subtle indicator slide.
     */
    turnChange: {
        translateX: () => withSequence(
            withTiming(-20, { duration: 150 }),
            withSpring(0, { damping: 12 }),
        ),
        opacity: () => withSequence(
            withTiming(0.5, { duration: 100 }),
            withTiming(1.0, { duration: 200 }),
        ),
    },

    /**
     * Token spawn: pop-in from home yard.
     */
    spawn: {
        scale: () => withSequence(
            withTiming(0, { duration: 0 }),
            withSpring(1.2, { damping: 6, stiffness: 250 }),
            withSpring(1.0, { damping: 10 }),
        ),
        haptic: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    },

    /**
     * Near-miss: opponent token barely avoids capture.
     */
    nearMiss: {
        shake: () => withSequence(
            withTiming(-3, { duration: 50 }),
            withTiming(3, { duration: 50 }),
            withTiming(-2, { duration: 40 }),
            withTiming(0, { duration: 60 }),
        ),
    },
} as const;

// ─── Particle System (Confetti) ─────────────────────────────────

export interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    lifetime: number;
}

/**
 * Generate confetti particles for victory celebration.
 */
export function generateConfetti(
    centerX: number,
    centerY: number,
    count: number = 40,
): Particle[] {
    const confettiColors = [
        '#FFD700', '#FF6B6B', '#58A6FF', '#6BCB77',
        '#BC8CFF', '#FFA657', '#FF4D6D', '#48BFE3',
    ];

    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: centerX,
        y: centerY,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 15 - 5,
        color: confettiColors[i % confettiColors.length],
        size: Math.random() * 6 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        opacity: 1,
        lifetime: Math.random() * 1500 + 1000,
    }));
}

/**
 * Update particle positions for one frame (called at 60fps).
 */
export function updateParticles(
    particles: Particle[],
    deltaMs: number,
    gravity: number = 0.5,
): Particle[] {
    return particles
        .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + gravity,
            rotation: p.rotation + p.rotationSpeed,
            opacity: Math.max(0, p.opacity - deltaMs / p.lifetime),
            lifetime: p.lifetime - deltaMs,
        }))
        .filter(p => p.lifetime > 0 && p.opacity > 0);
}
