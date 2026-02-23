/**
 * Ludo: Legends — Token Sprite
 * 
 * Animated token piece rendered with Skia + Reanimated.
 * Smooth path-following movement, capture glow, and finish celebration.
 * 
 * SME Agent: game-development, mobile-design, ui-ux-pro-max
 */

import React, { useEffect } from 'react';
import { Circle, Group, Shadow, Paint } from '@shopify/react-native-skia';
import Animated, {
    useSharedValue,
    useDerivedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { Token, PlayerColor } from '../engine/types';
import { getTokenCoord, CellCoord } from '../engine/Board';
import { colors, animation } from '../theme/design-system';

interface TokenSpriteProps {
    token: Token;
    cellSize: number;
    isSelected: boolean;
    isValidTarget: boolean;
    onPress?: () => void;
}

/**
 * Returns the pixel center position for a token on the board.
 */
function getTokenPixelPosition(token: Token, cellSize: number): { x: number; y: number } {
    const coord = getTokenCoord(token);
    return {
        x: coord.col * cellSize + cellSize / 2,
        y: coord.row * cellSize + cellSize / 2,
    };
}

const PLAYER_COLORS: Record<PlayerColor, { primary: string; dark: string; light: string }> = {
    red: { primary: colors.player.red, dark: colors.player.redDark, light: colors.player.redLight },
    green: { primary: colors.player.green, dark: colors.player.greenDark, light: colors.player.greenLight },
    yellow: { primary: colors.player.yellow, dark: colors.player.yellowDark, light: colors.player.yellowLight },
    blue: { primary: colors.player.blue, dark: colors.player.blueDark, light: colors.player.blueLight },
};

/**
 * Renders a single token as a premium, layered circle with shadow and highlights.
 * Animates position changes smoothly using Reanimated shared values.
 */
export function TokenSpriteStatic({
    token,
    cellSize,
    isSelected,
    isValidTarget,
}: TokenSpriteProps) {
    const targetPos = getTokenPixelPosition(token, cellSize);
    const tokenColors = PLAYER_COLORS[token.color];
    const radius = cellSize * 0.32;

    const x = useSharedValue(targetPos.x);
    const y = useSharedValue(targetPos.y);
    const trailX = useSharedValue(targetPos.x);
    const trailY = useSharedValue(targetPos.y);

    useEffect(() => {
        // Smooth physics-based grid movement
        x.value = withSpring(targetPos.x, { damping: 14, stiffness: 120 });
        y.value = withSpring(targetPos.y, { damping: 14, stiffness: 120 });

        // Trailing echo effect
        trailX.value = withDelay(50, withSpring(targetPos.x, { damping: 14, stiffness: 120 }));
        trailY.value = withDelay(50, withSpring(targetPos.y, { damping: 14, stiffness: 120 }));
    }, [targetPos.x, targetPos.y]);

    const transform = useDerivedValue(() => [
        { translateX: x.value },
        { translateY: y.value }
    ]);

    const trailTransform = useDerivedValue(() => [
        { translateX: trailX.value },
        { translateY: trailY.value }
    ]);

    return (
        <Group>
            {/* Trail Echo */}
            {token.state === 'active' && (
                <Group transform={trailTransform} opacity={0.3}>
                    <Circle cx={0} cy={0} r={radius * 0.8} color={tokenColors.primary} />
                </Group>
            )}

            <Group transform={transform}>
                {/* Outer glow for selected/valid tokens */}
                {(isSelected || isValidTarget) && (
                    <Circle
                        cx={0}
                        cy={0}
                        r={radius + 4}
                        color={isSelected ? tokenColors.light : '#FFFFFF'}
                        opacity={isSelected ? 0.5 : 0.3}
                    />
                )}

                {/* 3D Extrusion Body + Cast Shadow */}
                <Circle
                    cx={0}
                    cy={4}
                    r={radius}
                    color={tokenColors.dark}
                >
                    <Shadow dx={0} dy={6} blur={5} color="#00000080" />
                </Circle>

                {/* Base circle (Top face of the puck) */}
                <Circle
                    cx={0}
                    cy={0}
                    r={radius}
                    color={tokenColors.primary}
                />

                {/* Inner highlight (premium 3D feel) */}
                <Circle
                    cx={-radius * 0.2}
                    cy={-radius * 0.25}
                    r={radius * 0.5}
                    color={tokenColors.light}
                    opacity={0.4}
                />

                {/* Top-left specular highlight */}
                <Circle
                    cx={-radius * 0.25}
                    cy={-radius * 0.3}
                    r={radius * 0.15}
                    color="#FFFFFF"
                    opacity={0.6}
                />

                {/* Inner ring */}
                <Circle
                    cx={0}
                    cy={0}
                    r={radius * 0.55}
                    color={tokenColors.dark}
                    style="stroke"
                    strokeWidth={1}
                    opacity={0.4}
                />

                {/* Token number indicator */}
                <Circle
                    cx={0}
                    cy={0}
                    r={radius * 0.2}
                    color="#FFFFFF"
                    opacity={0.8}
                />

                {/* Finished indicator */}
                {token.state === 'finished' && (
                    <Group>
                        <Circle
                            cx={0}
                            cy={0}
                            r={radius + 2}
                            color={colors.ui.gold}
                            style="stroke"
                            strokeWidth={2}
                            opacity={0.8}
                        />
                    </Group>
                )}
            </Group>
        </Group>
    );
}

/**
 * Renders all tokens for all players on the board.
 */
export function TokenLayer({
    tokens,
    cellSize,
    selectedTokenId,
    validMoveTokenIds,
    onTokenPress,
}: {
    tokens: Record<string, Token>;
    cellSize: number;
    selectedTokenId: string | null;
    validMoveTokenIds: Set<string>;
    onTokenPress?: (tokenId: string) => void;
}) {
    return (
        <Group>
            {Object.values(tokens).map(token => (
                <TokenSpriteStatic
                    key={token.id}
                    token={token}
                    cellSize={cellSize}
                    isSelected={token.id === selectedTokenId}
                    isValidTarget={validMoveTokenIds.has(token.id)}
                    onPress={() => onTokenPress?.(token.id)}
                />
            ))}
        </Group>
    );
}
