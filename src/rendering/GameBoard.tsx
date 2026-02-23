/**
 * Ludo: Legends — Game Board Composition
 * 
 * Combines BoardCanvas + TokenLayer + ThreatOverlay into
 * a single interactive board component with touch handling.
 * 
 * SME Agent: game-development, react-native-architecture
 */

import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedSensor, SensorType, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Canvas, Group } from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import BoardCanvas from './BoardCanvas';
import { TokenSpriteStatic } from './TokenSprite';
import ThreatOverlay from './ThreatOverlay';
import ParticleSystem from './ParticleSystem';
import { GameState, Move, TokenId, Token } from '../engine/types';
import { getCurrentPlayer } from '../engine/GameState';
import { getTokenCoord } from '../engine/Board';
import { colors, spacing, radii, shadows, layout } from '../theme/design-system';

interface GameBoardProps {
    gameState: GameState;
    onTokenPress: (tokenId: string) => void;
    onMoveSelect: (move: Move) => void;
    selectedTokenId: string | null;
}

export default function GameBoard({
    gameState,
    onTokenPress,
    onMoveSelect,
    selectedTokenId,
}: GameBoardProps) {
    const boardSize = layout.boardSize;
    const cellSize = boardSize / 15;

    const currentPlayer = getCurrentPlayer(gameState);

    const validMoveTokenIds = useMemo(() => {
        return new Set(gameState.validMoves.map((m: Move) => m.tokenId));
    }, [gameState.validMoves]);

    const tokenList: Token[] = useMemo(() => {
        return Object.values(gameState.tokens) as Token[];
    }, [gameState.tokens]);

    // Gyro Sensor for Parallax Tabletop
    const rotationSensor = useAnimatedSensor(SensorType.ROTATION);

    const animatedBoardStyle = useAnimatedStyle(() => {
        // Base tabletop tilt
        const baseRotateX = 40;

        if (rotationSensor.sensor.value) {
            const { pitch, roll } = rotationSensor.sensor.value;
            // Note: pitch/roll values vary by device orientation, but we use them as localized offsets
            // pitch is around X-axis, roll is around Y-axis
            const pitchDeg = (pitch * 180) / Math.PI;
            const rollDeg = (roll * 180) / Math.PI;

            // Clamp the gyro effect to prevent wild flipping if device is held oddly
            const gyroPitch = interpolate(pitchDeg, [-45, 45], [-15, 15], Extrapolation.CLAMP);
            const gyroRoll = interpolate(rollDeg, [-45, 45], [-15, 15], Extrapolation.CLAMP);

            return {
                transform: [
                    { perspective: 800 },
                    { rotateX: `${baseRotateX + gyroPitch}deg` },
                    { rotateY: `${gyroRoll}deg` }
                ]
            };
        }

        return {
            transform: [
                { perspective: 800 },
                { rotateX: `${baseRotateX}deg` }
            ]
        };
    });

    // Handle tap on the board canvas to detect token selection
    const handleBoardTap = useCallback((x: number, y: number) => {
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        // Find token at tap position
        for (const token of tokenList) {
            const coord = getTokenCoord(token);
            if (coord.col === col && coord.row === row) {
                // Only allow tapping current player's tokens that have valid moves
                if (
                    token.color === currentPlayer.color &&
                    validMoveTokenIds.has(token.id) &&
                    gameState.phase === 'moving'
                ) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                    // If this token is already selected, execute the move
                    if (selectedTokenId === token.id) {
                        const move = gameState.validMoves.find((m: Move) => m.tokenId === token.id);
                        if (move) onMoveSelect(move);
                    } else {
                        onTokenPress(token.id);
                    }
                    return;
                }
            }
        }
    }, [gameState, currentPlayer, validMoveTokenIds, selectedTokenId, cellSize, onTokenPress, onMoveSelect, tokenList]);

    const tapGesture = Gesture.Tap()
        .onEnd((event) => {
            handleBoardTap(event.x, event.y);
        });

    return (
        <View style={styles.container}>
            <GestureDetector gesture={tapGesture}>
                <Animated.View style={[styles.boardWrapper, { width: boardSize, height: boardSize }, animatedBoardStyle]}>
                    <Canvas style={{ width: boardSize, height: boardSize }}>
                        {/* Layer 1: Static board grid */}
                        <BoardCanvasLayer size={boardSize} cellSize={cellSize} />

                        {/* Layer 2: Tactical overlay */}
                        <ThreatOverlay
                            tokens={gameState.tokens}
                            currentPlayerColor={currentPlayer.color}
                            validMoves={gameState.validMoves}
                            selectedTokenId={selectedTokenId as TokenId | null}
                            cellSize={cellSize}
                        />

                        {/* Layer 3: Token sprites */}
                        {tokenList.map((token: Token) => (
                            <TokenSpriteStatic
                                key={token.id}
                                token={token}
                                cellSize={cellSize}
                                isSelected={token.id === selectedTokenId}
                                isValidTarget={validMoveTokenIds.has(token.id)}
                            />
                        ))}

                        {/* Layer 4: Particle Engine (Shatters & Trails) */}
                        <ParticleSystem tokens={gameState.tokens} cellSize={cellSize} />
                    </Canvas>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

/**
 * Board canvas as a Skia group (for composition inside a single Canvas).
 */
function BoardCanvasLayer({ size, cellSize }: { size: number; cellSize: number }) {
    // We re-implement the board drawing here as Skia Group elements
    // since we need everything in a single Canvas for layering
    return <BoardCanvas size={size} />;
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    boardWrapper: {
        borderRadius: radii.xl,
        overflow: 'hidden',
        ...shadows.lg,
    },
});
