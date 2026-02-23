/**
 * Ludo: Legends — Skia Board Canvas
 * 
 * GPU-accelerated game board rendered with @shopify/react-native-skia.
 * Draws the 15×15 Ludo grid, home yards, tracks, home columns, and center.
 * 
 * SME Agent: game-development, ui-ux-pro-max, frontend-design
 */

import React, { useMemo } from 'react';
import { Canvas, RoundedRect, Circle, Group, LinearGradient, vec, Text as SkiaText, useFont, Rect, Path as SkiaPath } from '@shopify/react-native-skia';
import { colors, layout } from '../theme/design-system';
import { PlayerColor, BOARD } from '../engine/types';
import { getTrackCoords, getHomeColumnCoords, getHomeYardCoords, isSafePosition, CellCoord } from '../engine/Board';

interface BoardCanvasProps {
    size: number;
}

export default function BoardCanvas({ size }: BoardCanvasProps) {
    const cellSize = size / 15;
    const padding = 0;

    const trackCoords = useMemo(() => getTrackCoords(), []);

    return (
        <Canvas style={{ width: size, height: size }}>
            {/* Background */}
            <RoundedRect
                x={0}
                y={0}
                width={size}
                height={size}
                r={16}
                color={colors.board.surface}
            />

            {/* Home Yards (4 quadrants) */}
            <HomeYard color="red" cellSize={cellSize} />
            <HomeYard color="green" cellSize={cellSize} />
            <HomeYard color="yellow" cellSize={cellSize} />
            <HomeYard color="blue" cellSize={cellSize} />

            {/* Track Cells */}
            {trackCoords.map((coord, i) => (
                <TrackCell
                    key={`track-${i}`}
                    coord={coord}
                    cellSize={cellSize}
                    isSafe={isSafePosition(i)}
                    globalIndex={i}
                />
            ))}

            {/* Home Columns */}
            <HomeColumn color="red" cellSize={cellSize} />
            <HomeColumn color="green" cellSize={cellSize} />
            <HomeColumn color="yellow" cellSize={cellSize} />
            <HomeColumn color="blue" cellSize={cellSize} />

            {/* Center Triangle/Star */}
            <CenterPiece cellSize={cellSize} />
        </Canvas>
    );
}

// ─── Home Yard (large colored quadrant) ─────────────────────────

function HomeYard({ color, cellSize }: { color: PlayerColor; cellSize: number }) {
    const yardPositions: Record<PlayerColor, { x: number; y: number }> = {
        red: { x: 0, y: 9 },
        green: { x: 0, y: 0 },
        yellow: { x: 9, y: 0 },
        blue: { x: 9, y: 9 },
    };

    const pos = yardPositions[color];
    const yardSize = cellSize * 6;
    const yardColor = colors.board.homeYard[color];
    const borderColor = colors.board.homeColumn[color];

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
}: {
    coord: CellCoord;
    cellSize: number;
    isSafe: boolean;
    globalIndex: number;
}) {
    const x = coord.col * cellSize;
    const y = coord.row * cellSize;
    const inset = 0.5;

    // Determine if this is a start position
    const isStart = Object.values(BOARD.START_POSITIONS).includes(globalIndex);

    let cellColor: string = colors.board.trackCell;
    if (isSafe && isStart) {
        // Start position — use player color
        const startColors: Record<number, string> = {
            [BOARD.START_POSITIONS.red]: colors.player.red,
            [BOARD.START_POSITIONS.green]: colors.player.green,
            [BOARD.START_POSITIONS.yellow]: colors.player.yellow,
            [BOARD.START_POSITIONS.blue]: colors.player.blue,
        };
        cellColor = startColors[globalIndex] ?? colors.board.safeZone;
    } else if (isSafe) {
        cellColor = colors.board.safeZone;
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
                color={colors.board.trackBorder}
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

function HomeColumn({ color, cellSize }: { color: PlayerColor; cellSize: number }) {
    const coords = getHomeColumnCoords(color);
    const columnColor = colors.board.homeColumn[color];

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

function CenterPiece({ cellSize }: { cellSize: number }) {
    const centerX = 7 * cellSize + cellSize / 2;
    const centerY = 7 * cellSize + cellSize / 2;
    const triangleSize = cellSize * 1.2;

    // Four colored triangles pointing to center
    const triangleColors = [
        colors.player.red,
        colors.player.green,
        colors.player.yellow,
        colors.player.blue,
    ];

    return (
        <Group>
            {/* Center background */}
            <RoundedRect
                x={6 * cellSize}
                y={6 * cellSize}
                width={3 * cellSize}
                height={3 * cellSize}
                r={4}
                color={colors.board.center}
            />
            {/* Center diamond/star */}
            <Circle
                cx={centerX}
                cy={centerY}
                r={cellSize * 0.8}
                color={colors.ui.gold}
                opacity={0.15}
            />
            <Circle
                cx={centerX}
                cy={centerY}
                r={cellSize * 0.5}
                color={colors.ui.gold}
                opacity={0.25}
            />
            <Circle
                cx={centerX}
                cy={centerY}
                r={cellSize * 0.2}
                color={colors.ui.gold}
                opacity={0.6}
            />
        </Group>
    );
}
