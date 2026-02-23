/**
 * Ludo: Legends — Dynamic Game HUD
 *
 * Animated player chips with turn pulse, capture counters,
 * dice history, momentum gauge, and timer bar.
 * Replaces the static player bar with a premium, information-rich display.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { colors, typography, spacing, radii, shadows } from '../theme/design-system';
import type { MatchStats } from '../rendering/GameEffectsEngine';

// ─── Types ──────────────────────────────────────────────────────

interface GameHUDProps {
    players: Array<{
        name: string;
        color: string;
        colorPrimary: string;
        isAI: boolean;
        isActive: boolean;
        tokensFinished: number;
        totalTokens: number;
    }>;
    stats: MatchStats;
    diceHistory: number[];
    turnNumber: number;
    timeRemaining?: number | null; // Quick mode timer (seconds)
}

// ─── Component ──────────────────────────────────────────────────

export default function GameHUD({ players, stats, diceHistory, turnNumber, timeRemaining }: GameHUDProps) {
    return (
        <View style={styles.container}>
            {/* Player Chips Row */}
            <View style={styles.playersRow}>
                {players.map(player => (
                    <PlayerChip key={player.color} player={player} stats={stats} />
                ))}
            </View>

            {/* Bottom Info Row */}
            <View style={styles.infoRow}>
                {/* Dice History */}
                <View style={styles.diceHistory}>
                    {diceHistory.slice(-5).map((val, i) => (
                        <View
                            key={i}
                            style={[
                                styles.miniDice,
                                i === diceHistory.length - 1 && styles.miniDiceLatest,
                            ]}
                        >
                            <Text style={styles.miniDiceText}>{val}</Text>
                        </View>
                    ))}
                </View>

                {/* Turn Counter */}
                <View style={styles.turnBadge}>
                    <Text style={styles.turnText}>T{turnNumber}</Text>
                </View>

                {/* Timer (Quick mode) */}
                {timeRemaining != null && (
                    <TimerBar seconds={timeRemaining} />
                )}
            </View>

            {/* Momentum Gauge */}
            <MomentumGauge players={players} stats={stats} />
        </View>
    );
}

// ─── Player Chip ────────────────────────────────────────────────

const PlayerChip = React.memo(function PlayerChip({
    player,
    stats,
}: {
    player: GameHUDProps['players'][0];
    stats: MatchStats;
}) {
    const captures = stats.capturesMade[player.color] ?? 0;
    const progress = player.totalTokens > 0 ? player.tokensFinished / player.totalTokens : 0;

    return (
        <View style={[
            styles.chip,
            player.isActive && styles.chipActive,
            player.isActive && { borderColor: player.colorPrimary },
        ]}>
            {/* Avatar / Color dot */}
            {player.isAI ? (
                <AIAvatar player={player} stats={stats} />
            ) : (
                <View style={[styles.chipDot, { backgroundColor: player.colorPrimary }]}>
                    {player.isActive && <View style={[styles.chipDotPulse, { backgroundColor: player.colorPrimary }]} />}
                </View>
            )}

            {/* Name + Progress */}
            <View style={styles.chipInfo}>
                <Text style={[
                    styles.chipName,
                    player.isActive && { color: colors.ui.text },
                ]} numberOfLines={1}>
                    {player.name.length > 6 ? player.name.slice(0, 6) : player.name}
                </Text>

                {/* Progress bar */}
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: `${progress * 100}%` as unknown as number,
                                backgroundColor: player.colorPrimary,
                            },
                        ]}
                    />
                </View>
            </View>

            {/* Capture count */}
            {captures > 0 && (
                <View style={styles.capturesBadge}>
                    <Text style={styles.capturesText}>💀{captures}</Text>
                </View>
            )}
        </View>
    );
});

// ─── AI Avatar (Reactive Emotions) ──────────────────────────────

function AIAvatar({
    player,
    stats,
}: {
    player: GameHUDProps['players'][0];
    stats: MatchStats;
}) {
    const [emotion, setEmotion] = React.useState<'neutral' | 'happy' | 'angry' | 'nervous'>('neutral');

    const capturesMade = stats.capturesMade[player.color] ?? 0;
    const capturesReceived = stats.capturesReceived[player.color] ?? 0;
    const sixesCount = stats.sixesRolled[player.color] ?? 0;

    const prevStats = React.useRef({ capturesMade, capturesReceived, sixesCount });
    const scale = useSharedValue(1);

    React.useEffect(() => {
        let newEmotion = emotion;

        if (capturesReceived > prevStats.current.capturesReceived) {
            newEmotion = 'angry';
            scale.value = withSequence(withTiming(1.3, { duration: 100 }), withTiming(1, { duration: 200 }));
        } else if (capturesMade > prevStats.current.capturesMade || sixesCount > prevStats.current.sixesCount) {
            newEmotion = 'happy';
            scale.value = withSequence(withTiming(1.3, { duration: 100 }), withTiming(1, { duration: 200 }));
        }

        if (newEmotion !== 'neutral') {
            setEmotion(newEmotion);
            const timeout = setTimeout(() => setEmotion('neutral'), 3000);
            prevStats.current = { capturesMade, capturesReceived, sixesCount };
            return () => clearTimeout(timeout);
        }

        prevStats.current = { capturesMade, capturesReceived, sixesCount };
    }, [capturesMade, capturesReceived, sixesCount]);

    const Emojis = {
        neutral: '🤖',
        happy: '🤩',
        angry: '🤬',
        nervous: '😰',
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.aiAvatar, { borderColor: player.colorPrimary }, animatedStyle]}>
            <Text style={styles.aiAvatarText}>{Emojis[emotion]}</Text>
        </Animated.View>
    );
}

// ─── Timer Bar ──────────────────────────────────────────────────

const TimerBar = React.memo(function TimerBar({ seconds }: { seconds: number }) {
    const maxSeconds = 300; // 5 minutes
    const progress = Math.max(0, Math.min(1, seconds / maxSeconds));
    const isUrgent = seconds < 60;

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return (
        <View style={styles.timerContainer}>
            <Text style={[
                styles.timerText,
                isUrgent && { color: colors.ui.error },
            ]}>
                {isUrgent ? '⏰' : '⏱️'} {minutes}:{secs.toString().padStart(2, '0')}
            </Text>
            <View style={styles.timerBar}>
                <View style={[
                    styles.timerFill,
                    {
                        width: `${progress * 100}%` as unknown as number,
                        backgroundColor: isUrgent ? colors.ui.error : colors.ui.accent,
                    },
                ]} />
            </View>
        </View>
    );
});

// ─── Momentum Gauge ─────────────────────────────────────────────

const MomentumGauge = React.memo(function MomentumGauge({
    players,
    stats,
}: {
    players: GameHUDProps['players'];
    stats: MatchStats;
}) {
    const segments = useMemo(() => {
        return players.map(p => {
            const finishes = stats.tokensFinished[p.color] ?? 0;
            const captures = stats.capturesMade[p.color] ?? 0;
            return {
                color: p.colorPrimary,
                score: finishes * 3 + captures * 2,
            };
        });
    }, [players, stats]);

    const totalScore = segments.reduce((sum, s) => sum + s.score, 0);
    if (totalScore === 0) return null;

    return (
        <View style={styles.momentumContainer}>
            <View style={styles.momentumBar}>
                {segments.map((seg, i) => {
                    const width = `${(seg.score / totalScore) * 100}%` as unknown as number;
                    return (
                        <View
                            key={i}
                            style={[styles.momentumSegment, { width, backgroundColor: seg.color }]}
                        />
                    );
                })}
            </View>
        </View>
    );
});

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.sm,
        gap: spacing.xs,
    },
    playersRow: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    chip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: colors.ui.surface,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: colors.ui.surfaceElevated,
    },
    chipDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.xs,
    },
    chipDotPulse: {
        width: 10,
        height: 10,
        borderRadius: 5,
        opacity: 0.4,
        position: 'absolute',
    },
    chipInfo: {
        flex: 1,
    },
    chipName: {
        fontSize: 10,
        fontWeight: typography.weight.bold,
        color: colors.ui.textSecondary,
    },
    progressBar: {
        height: 3,
        backgroundColor: colors.glass.light,
        borderRadius: 2,
        marginTop: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    capturesBadge: {
        marginLeft: spacing.xxs,
    },
    capturesText: {
        fontSize: 9,
        fontWeight: typography.weight.bold,
        color: colors.ui.textSecondary,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    diceHistory: {
        flexDirection: 'row',
        gap: 3,
        flex: 1,
    },
    miniDice: {
        width: 18,
        height: 18,
        borderRadius: 4,
        backgroundColor: colors.ui.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniDiceLatest: {
        backgroundColor: colors.ui.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.ui.accent + '40',
    },
    miniDiceText: {
        fontSize: 9,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
    },
    turnBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        backgroundColor: colors.ui.surface,
        borderRadius: radii.full,
    },
    turnText: {
        fontSize: 9,
        fontWeight: typography.weight.bold,
        color: colors.ui.textSecondary,
    },
    timerContainer: {
        alignItems: 'flex-end',
    },
    timerText: {
        fontSize: 10,
        fontWeight: typography.weight.bold,
        color: colors.ui.accent,
    },
    timerBar: {
        width: 60,
        height: 3,
        backgroundColor: colors.glass.light,
        borderRadius: 2,
        marginTop: 2,
        overflow: 'hidden',
    },
    timerFill: {
        height: '100%',
        borderRadius: 2,
    },
    momentumContainer: {
        paddingVertical: 2,
    },
    momentumBar: {
        flexDirection: 'row',
        height: 3,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: colors.glass.light,
    },
    momentumSegment: {
        height: '100%',
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.ui.surfaceElevated,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiAvatarText: {
        fontSize: 18,
    },
});
