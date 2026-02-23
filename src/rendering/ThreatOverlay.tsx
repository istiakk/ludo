/**
 * Ludo: Legends — Threat Overlay
 * 
 * Tactical readability layer: highlights danger zones, safe cells,
 * and previews token paths on selection.
 * 
 * SME Agent: game-development/game-design, ui-ux-pro-max
 */

import React, { useMemo } from 'react';
import { Group, Circle, RoundedRect, Line, vec } from '@shopify/react-native-skia';
import { Token, TokenId, Move, PlayerColor, BOARD } from '../engine/types';
import { findThreats, getTokenCoord, relativeToGlobal, isTokenSafe, CellCoord } from '../engine/Board';
import { colors } from '../theme/design-system';

interface ThreatOverlayProps {
    tokens: Record<TokenId, Token>;
    currentPlayerColor: PlayerColor;
    validMoves: Move[];
    selectedTokenId: TokenId | null;
    cellSize: number;
}

export default function ThreatOverlay({
    tokens,
    currentPlayerColor,
    validMoves,
    selectedTokenId,
    cellSize,
}: ThreatOverlayProps) {
    // Find threats to current player's tokens
    const threats = useMemo(() => {
        const playerTokens = Object.values(tokens).filter(
            t => t.color === currentPlayerColor && t.state === 'active'
        );
        const threatMap = new Map<string, Token[]>();

        for (const token of playerTokens) {
            const tokenThreats = findThreats(token, tokens);
            if (tokenThreats.length > 0) {
                threatMap.set(token.id, tokenThreats);
            }
        }

        return threatMap;
    }, [tokens, currentPlayerColor]);

    // Path preview for selected token
    const pathPreview = useMemo(() => {
        if (!selectedTokenId) return [];

        const movesForToken = validMoves.filter(m => m.tokenId === selectedTokenId);
        return movesForToken.map(move => {
            const token = tokens[move.tokenId];
            if (!token) return null;

            // Create a virtual token at the destination
            const destToken: Token = {
                ...token,
                position: move.to,
                state: move.type === 'finish' ? 'finished' : 'active',
                globalPosition: -1,
            };

            return {
                move,
                destCoord: getTokenCoord(destToken),
            };
        }).filter(Boolean) as Array<{ move: Move; destCoord: CellCoord }>;
    }, [selectedTokenId, validMoves, tokens]);

    return (
        <Group>
            {/* Threat indicators (danger zones around player's tokens) */}
            {Array.from(threats.entries()).map(([tokenId, threatTokens]) => {
                const token = tokens[tokenId as TokenId];
                if (!token) return null;
                const coord = getTokenCoord(token);

                return (
                    <Group key={`threat-${tokenId}`}>
                        {/* Danger ring around threatened token */}
                        <Circle
                            cx={coord.col * cellSize + cellSize / 2}
                            cy={coord.row * cellSize + cellSize / 2}
                            r={cellSize * 0.45}
                            color={colors.ui.error}
                            style="stroke"
                            strokeWidth={2}
                            opacity={0.6}
                        />
                        {/* Pulsing danger background */}
                        <Circle
                            cx={coord.col * cellSize + cellSize / 2}
                            cy={coord.row * cellSize + cellSize / 2}
                            r={cellSize * 0.45}
                            color={colors.ui.error}
                            opacity={0.1}
                        />
                    </Group>
                );
            })}

            {/* Safe zone indicators for current player's tokens */}
            {Object.values(tokens)
                .filter(t => t.color === currentPlayerColor && t.state === 'active')
                .filter(t => isTokenSafe(t.position, t.color))
                .map(token => {
                    const coord = getTokenCoord(token);
                    return (
                        <Circle
                            key={`safe-${token.id}`}
                            cx={coord.col * cellSize + cellSize / 2}
                            cy={coord.row * cellSize + cellSize / 2}
                            r={cellSize * 0.45}
                            color={colors.ui.success}
                            style="stroke"
                            strokeWidth={1.5}
                            opacity={0.4}
                        />
                    );
                })}

            {/* Path preview dots for selected move destinations */}
            {pathPreview.map(({ move, destCoord }, i) => (
                <Group key={`preview-${i}`}>
                    {/* Destination indicator */}
                    <Circle
                        cx={destCoord.col * cellSize + cellSize / 2}
                        cy={destCoord.row * cellSize + cellSize / 2}
                        r={cellSize * 0.25}
                        color={move.type === 'capture' ? colors.ui.error : colors.ui.accent}
                        opacity={0.4}
                    />
                    <Circle
                        cx={destCoord.col * cellSize + cellSize / 2}
                        cy={destCoord.row * cellSize + cellSize / 2}
                        r={cellSize * 0.25}
                        color={move.type === 'capture' ? colors.ui.error : colors.ui.accent}
                        style="stroke"
                        strokeWidth={2}
                        opacity={0.7}
                    />

                    {/* Capture X indicator */}
                    {move.type === 'capture' && (
                        <Group>
                            <Line
                                p1={vec(
                                    destCoord.col * cellSize + cellSize * 0.35,
                                    destCoord.row * cellSize + cellSize * 0.35,
                                )}
                                p2={vec(
                                    destCoord.col * cellSize + cellSize * 0.65,
                                    destCoord.row * cellSize + cellSize * 0.65,
                                )}
                                color={colors.ui.error}
                                strokeWidth={2}
                                opacity={0.8}
                            />
                            <Line
                                p1={vec(
                                    destCoord.col * cellSize + cellSize * 0.65,
                                    destCoord.row * cellSize + cellSize * 0.35,
                                )}
                                p2={vec(
                                    destCoord.col * cellSize + cellSize * 0.35,
                                    destCoord.row * cellSize + cellSize * 0.65,
                                )}
                                color={colors.ui.error}
                                strokeWidth={2}
                                opacity={0.8}
                            />
                        </Group>
                    )}
                </Group>
            ))}
        </Group>
    );
}
