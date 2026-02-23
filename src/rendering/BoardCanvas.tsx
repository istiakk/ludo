/**
 * Ludo: Legends — Skia Board Canvas
 * 
 * GPU-accelerated game board rendered with @shopify/react-native-skia.
 * Draws the 15×15 Ludo grid, home yards, tracks, home columns, and center.
 * Supports runtime-swappable themes via BoardThemeEngine.
 */

import React, { useMemo } from 'react';
import { Canvas, RoundedRect, Circle, Group, LinearGradient, vec, Text as SkiaText, useFont, Rect, Path as SkiaPath } from '@shopify/react-native-skia';
import { colors, layout } from '../theme/design-system';
import { PlayerColor, BOARD } from '../engine/types';
import { getTrackCoords, getHomeColumnCoords, getHomeYardCoords, isSafePosition, CellCoord } from '../engine/Board';
import { type BoardTheme, getTheme } from './BoardThemeEngine';

interface BoardCanvasProps {
    size: number;
    themeId?: string;
}

export default function BoardCanvas({ size, themeId }: BoardCanvasProps) {
    const cellSize = size / 15;
    const theme = useMemo(() => getTheme(themeId ?? 'classic'), [themeId]);

    const trackCoords = useMemo(() => getTrackCoords(), []);

    return (
        <Group>
            {/* Background */}
            <RoundedRect
                x={0}
                y={0}
                width={size}
                height={size}
                r={16}
                color={theme.boardSurface}
            />

            {/* Home Yards (4 quadrants) */}
            <HomeYard color="red" cellSize={cellSize} theme={theme} />
            <HomeYard color="green" cellSize={cellSize} theme={theme} />
            <HomeYard color="yellow" cellSize={cellSize} theme={theme} />
            <HomeYard color="blue" cellSize={cellSize} theme={theme} />

            {/* Track Cells */}
            {trackCoords.map((coord, i) => (
                <TrackCell
                    key={`track-${i}`}
                    coord={coord}
                    cellSize={cellSize}
                    isSafe={isSafePosition(i)}
                    globalIndex={i}
                    theme={theme}
                />
            ))}

            {/* Home Columns */}
            <HomeColumn color="red" cellSize={cellSize} theme={theme} />
            <HomeColumn color="green" cellSize={cellSize} theme={theme} />
            <HomeColumn color="yellow" cellSize={cellSize} theme={theme} />
            <HomeColumn color="blue" cellSize={cellSize} theme={theme} />

            {/* Center Triangle/Star */}
            <CenterPiece cellSize={cellSize} theme={theme} />
        </Group>
    );
}

// ─── Home Yard (large colored quadrant) ─────────────────────────

function HomeYard({ color, cellSize, theme }: { color: PlayerColor; cellSize: number; theme: BoardTheme }) {
    const yardPositions: Record<PlayerColor, { x: number; y: number }> = {
        red: { x: 0, y: 9 },
        green: { x: 0, y: 0 },
        yellow: { x: 9, y: 0 },
        blue: { x: 9, y: 9 },
    };

    const pos = yardPositions[color];
    const yardSize = cellSize * 6;
    const yardColor = theme.homeYard[color];
    const borderColor = theme.homeColumn[color];

    const yardCoords = getHomeYardCoords(color);

    return (
        <Group>
            {/* Yard background */}
            <RoundedRect
                x={pos.x * cellSize}
                y={pos.y * cellSize}
                width={yardSize}
                height={yardSize}
                r={12}
                color={yardColor}
            />
            {/* Yard border */}
            <RoundedRect
                x={pos.x * cellSize}
                y={pos.y * cellSize}
                width={yardSize}
                height={yardSize}
                r={12}
                color={borderColor}
                style="stroke"
                strokeWidth={2}
            />
            {/* Token starting circles */}
            {yardCoords.map((coord, i) => (
                <Group key={`yard-${color}-${i}`}>
                    <Circle
                        cx={coord.col * cellSize + cellSize / 2}
                        cy={coord.row * cellSize + cellSize / 2}
                        r={cellSize * 0.35}
                        color={borderColor}
                        opacity={0.3}
                    />
                    <Circle
                        cx={coord.col * cellSize + cellSize / 2}
                        cy={coord.row * cellSize + cellSize / 2}
                        r={cellSize * 0.35}
                        color={borderColor}
                        style="stroke"
                        strokeWidth={1.5}
                        opacity={0.6}
                    />
                </Group>
            ))}
        </Group>
    );
}

// ─── Track Cell ─────────────────────────────────────────────────

function TrackCell({
    coord,
    cellSize,
    isSafe,
    globalIndex,
    theme,
}: {
    coord: CellCoord;
    cellSize: number;
    isSafe: boolean;
    globalIndex: number;
    theme: BoardTheme;
}) {
    const x = coord.col * cellSize;
    const y = coord.row * cellSize;
    const inset = 0.5;

    // Determine if this is a start position
    const isStart = Object.values(BOARD.START_POSITIONS).includes(globalIndex);

    let cellColor: string = theme.trackCell;
    if (isSafe && isStart) {
        // Start position — use player color from theme
        const startColors: Record<number, string> = {
            [BOARD.START_POSITIONS.red]: theme.homeColumn.red,
            [BOARD.START_POSITIONS.green]: theme.homeColumn.green,
            [BOARD.START_POSITIONS.yellow]: theme.homeColumn.yellow,
            [BOARD.START_POSITIONS.blue]: theme.homeColumn.blue,
        };
        cellColor = startColors[globalIndex] ?? theme.safeZone;
    } else if (isSafe) {
        cellColor = theme.safeZone;
    }

    return (
        <Group>
            <RoundedRect
                x={x + inset}
                y={y + inset}
                width={cellSize - inset * 2}
                height={cellSize - inset * 2}
                r={3}
                color={cellColor}
            />
            <RoundedRect
                x={x + inset}
                y={y + inset}
                width={cellSize - inset * 2}
                height={cellSize - inset * 2}
                r={3}
                color={theme.trackBorder}
                style="stroke"
                strokeWidth={0.5}
            />
            {/* Safe zone star indicator */}
            {isSafe && !isStart && (
                <Circle
                    cx={x + cellSize / 2}
                    cy={y + cellSize / 2}
                    r={cellSize * 0.12}
                    color="#B8860B"
                    opacity={0.6}
                />
            )}
        </Group>
    );
}

// ─── Home Column ────────────────────────────────────────────────

function HomeColumn({ color, cellSize, theme }: { color: PlayerColor; cellSize: number; theme: BoardTheme }) {
    const coords = getHomeColumnCoords(color);
    const columnColor = theme.homeColumn[color];

    return (
        <Group>
            {coords.map((coord, i) => {
                const x = coord.col * cellSize;
                const y = coord.row * cellSize;
                const inset = 0.5;
                const opacity = 0.4 + (i / coords.length) * 0.6; // Gradient intensity

                return (
                    <Group key={`hc-${color}-${i}`}>
                        <RoundedRect
                            x={x + inset}
                            y={y + inset}
                            width={cellSize - inset * 2}
                            height={cellSize - inset * 2}
                            r={3}
                            color={columnColor}
                            opacity={opacity}
                        />
                        <RoundedRect
                            x={x + inset}
                            y={y + inset}
                            width={cellSize - inset * 2}
                            height={cellSize - inset * 2}
                            r={3}
                            color={columnColor}
                            style="stroke"
                            strokeWidth={0.8}
                            opacity={0.7}
                        />
                    </Group>
                );
            })}
        </Group>
    );
}

// ─── Center Piece ───────────────────────────────────────────────

function CenterPiece({ cellSize, theme }: { cellSize: number; theme: BoardTheme }) {
    const centerX = 7 * cellSize + cellSize / 2;
    const centerY = 7 * cellSize + cellSize / 2;

    return (
        <Group>
            {/* Center background */}
            <RoundedRect
                x={6 * cellSize}
                y={6 * cellSize}
                width={3 * cellSize}
                height={3 * cellSize}
                r={4}
                color={theme.center}
            />
            {/* Center diamond/star */}
            <Circle
                cx={centerX}
                cy={centerY}
                r={cellSize * 0.8}
                color={theme.centerAccent}
                opacity={0.15}
            />
            <Circle
                cx={centerX}
                cy={centerY}
                r={cellSize * 0.5}
                color={theme.centerAccent}
                opacity={0.25}
            />
            <Circle
                cx={centerX}
                cy={centerY}
                r={cellSize * 0.2}
                color={theme.centerAccent}
                opacity={0.6}
            />
        </Group>
    );
}
