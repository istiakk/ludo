/**
 * Ludo: Legends — Event Banner Component
 * 
 * Displays active LiveOps events on the home screen.
 * Supports flash challenges, themed weekends, festivals, and milestones.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, radii, shadows } from '../theme/design-system';
import type { LiveEvent, EventCondition } from '../services/LiveOpsService';

interface EventBannerProps {
    events: LiveEvent[];
    onEventPress?: (event: LiveEvent) => void;
}

export const EventBanner = React.memo(function EventBanner({ events, onEventPress }: EventBannerProps) {
    if (events.length === 0) return null;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            {events.map(event => (
                <EventCard key={event.id} event={event} onPress={onEventPress} />
            ))}
        </ScrollView>
    );
});

const EventCard = React.memo(function EventCard({
    event,
    onPress,
}: {
    event: LiveEvent;
    onPress?: (event: LiveEvent) => void;
}) {
    const timeLeft = useMemo(() => {
        const remaining = event.endTime - Date.now();
        if (remaining <= 0) return 'Ended';
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 24) return `${Math.floor(hours / 24)}d left`;
        if (hours > 0) return `${hours}h ${minutes}m left`;
        return `${minutes}m left`;
    }, [event.endTime]);

    const totalProgress = useMemo(() => {
        if (event.conditions.length === 0) return 0;
        const sum = event.conditions.reduce((acc: number, c: EventCondition) => acc + Math.min(c.current / c.target, 1), 0);
        return sum / event.conditions.length;
    }, [event.conditions]);

    return (
        <TouchableOpacity
            style={[styles.card, { borderColor: event.color + '40' }]}
            onPress={() => onPress?.(event)}
            activeOpacity={0.8}
            accessibilityLabel={`${event.title}: ${event.description}`}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{event.icon}</Text>
                <View style={[styles.timeBadge, { backgroundColor: event.color + '20' }]}>
                    <Text style={[styles.timeText, { color: event.color }]}>{timeLeft}</Text>
                </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{event.description}</Text>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(totalProgress * 100, 2)}%`, backgroundColor: event.color }]} />
            </View>

            {/* Rewards preview */}
            <View style={styles.rewardsRow}>
                {event.rewards.slice(0, 2).map((r: { label: string }, i: number) => (
                    <Text key={i} style={styles.rewardText}>{r.label}</Text>
                ))}
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: { maxHeight: 180, marginBottom: spacing.md },
    content: { paddingHorizontal: spacing.base, gap: spacing.sm },
    card: {
        width: 200,
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        borderWidth: 1,
        ...shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    cardIcon: { fontSize: 22 },
    timeBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.full,
    },
    timeText: {
        fontSize: 9,
        fontWeight: typography.weight.bold,
    },
    cardTitle: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
        marginBottom: spacing.xxs,
    },
    cardDesc: {
        fontSize: typography.size.xs,
        color: colors.ui.textSecondary,
        lineHeight: 14,
        marginBottom: spacing.sm,
    },
    progressTrack: {
        height: 3,
        backgroundColor: colors.ui.border,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    rewardsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    rewardText: {
        fontSize: 9,
        color: colors.ui.textTertiary,
        fontWeight: typography.weight.medium,
    },
});
