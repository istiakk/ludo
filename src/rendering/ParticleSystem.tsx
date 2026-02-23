import React, { useEffect, useRef, useState } from 'react';
import { Group, Circle } from '@shopify/react-native-skia';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    useDerivedValue,
    withSequence,
    interpolate,
} from 'react-native-reanimated';
import { Token, PlayerColor } from '../engine/types';
import { getTokenCoord } from '../engine/Board';

interface ParticleSystemProps {
    tokens: Record<string, Token>;
    cellSize: number;
}

const PLAYER_COLORS: Record<PlayerColor, string> = {
    red: '#E63946',
    green: '#2A9D8F',
    yellow: '#E9C46A',
    blue: '#457B9D',
};

// ─── Individual Shard ───────────────────────────────────────────

function Shard({ x, y, color, angle, distance }: { x: number, y: number, color: string, angle: number, distance: number }) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withSequence(
            withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }),
            withTiming(2, { duration: 0 }) // Flag completion
        );
    }, []);

    const transform = useDerivedValue(() => {
        const d = interpolate(progress.value, [0, 1], [0, distance]);
        return [
            { translateX: x + Math.cos(angle) * d },
            { translateY: y + Math.sin(angle) * d },
            { scale: interpolate(progress.value, [0, 1], [1, 0]) }
        ];
    });

    const opacity = useDerivedValue(() => interpolate(progress.value, [0, 0.8, 1], [1, 1, 0]));

    return (
        <Group transform={transform} opacity={opacity}>
            <Circle cx={0} cy={0} r={5} color={color} />
        </Group>
    );
}

// ─── Particle System Manager ────────────────────────────────────

export default function ParticleSystem({ tokens, cellSize }: ParticleSystemProps) {
    const prevTokensRef = useRef<Record<string, { x: number; y: number; state: string }>>({});
    const [shards, setShards] = useState<{ id: string; x: number; y: number; color: string; angle: number; distance: number }[]>([]);

    useEffect(() => {
        const newShards: typeof shards = [];

        for (const token of Object.values(tokens)) {
            const coord = getTokenCoord(token);
            const x = coord.col * cellSize + cellSize / 2;
            const y = coord.row * cellSize + cellSize / 2;

            const prev = prevTokensRef.current[token.id];

            // Detect Capture (state changed from active to home, or position jumped massively)
            if (prev && prev.state === 'active' && token.state === 'home') {
                // Spawn 12 shards at the previous position
                for (let i = 0; i < 12; i++) {
                    newShards.push({
                        id: `${token.id}-shard-${Date.now()}-${i}`,
                        x: prev.x,
                        y: prev.y,
                        color: PLAYER_COLORS[token.color],
                        angle: (Math.PI * 2 / 12) * i + Math.random(),
                        distance: 40 + Math.random() * 40,
                    });
                }
            }

            prevTokensRef.current[token.id] = { x, y, state: token.state };
        }

        if (newShards.length > 0) {
            setShards(s => [...s, ...newShards]);
            // Cleanup shards after animation
            setTimeout(() => {
                setShards(s => s.filter(shard => !newShards.find(n => n.id === shard.id)));
            }, 600);
        }
    }, [tokens, cellSize]);

    return (
        <Group>
            {shards.map(s => (
                <Shard key={s.id} {...s} />
            ))}
        </Group>
    );
}
