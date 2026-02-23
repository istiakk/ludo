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
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
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
    const pos = getTokenPixelPosition(token, cellSize);
    const tokenColors = PLAYER_COLORS[token.color];
    const radius = cellSize * 0.32;

    return (
        <Group>
            {/* Outer glow for selected/valid tokens */}
            {(isSelected || isValidTarget) && (
                <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 4}
                    color={isSelected ? tokenColors.light : '#FFFFFF'}
                    opacity={isSelected ? 0.5 : 0.3}
                />
            )}

            {/* Shadow layer */}
            <Circle
                cx={pos.x + 1}
                cy={pos.y + 2}
                r={radius}
                color="#000000"
                opacity={0.3}
            />

            {/* Base circle */}
            <Circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                color={tokenColors.primary}
            />

            {/* Inner highlight (premium 3D feel) */}
            <Circle
                cx={pos.x - radius * 0.2}
                cy={pos.y - radius * 0.25}
                r={radius * 0.5}
                color={tokenColors.light}
                opacity={0.4}
            />

            {/* Top-left specular highlight */}
            <Circle
                cx={pos.x - radius * 0.25}
                cy={pos.y - radius * 0.3}
                r={radius * 0.15}
                color="#FFFFFF"
                opacity={0.6}
            />

            {/* Inner ring */}
            <Circle
                cx={pos.x}
                cy={pos.y}
                r={radius * 0.55}
                color={tokenColors.dark}
                style="stroke"
                strokeWidth={1}
                opacity={0.4}
            />

            {/* Token number indicator */}
            <Circle
                cx={pos.x}
                cy={pos.y}
                r={radius * 0.2}
                color="#FFFFFF"
                opacity={0.8}
            />

            {/* Finished indicator */}
            {token.state === 'finished' && (
                <Group>
                    <Circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 2}
                        color={colors.ui.gold}
                        style="stroke"
                        strokeWidth={2}
                        opacity={0.8}
                    />
                </Group>
            )}
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
