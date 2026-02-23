/**
 * Ludo: Legends — Home Screen
 * 
 * Premium landing screen with game mode selection.
 * "Quiet luxury meets playful competition."
 * 
 * SME Agent: ui-ux-pro-max, mobile-design, frontend-design
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';

export default function HomeScreen() {
    const router = useRouter();

    const startGame = (mode: 'classic' | 'speed' | 'pro', matchType: '1v1' | '2v2' | 'vs_ai') => {
        router.push({
            pathname: '/game',
            params: { mode, matchType },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Hero */}
            <View style={styles.hero}>
                <Text style={styles.logo}>♛</Text>
                <Text style={styles.title}>LUDO</Text>
                <Text style={styles.subtitle}>LEGENDS</Text>
                <Text style={styles.tagline}>Classic game. Legendary moves.</Text>
            </View>

            {/* Quick Play */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>QUICK PLAY</Text>
                <View style={styles.buttonRow}>
                    <ModeButton
                        label="1v1 Duel"
                        icon="⚔️"
                        description="Competitive"
                        color={colors.player.red}
                        onPress={() => startGame('classic', '1v1')}
                    />
                    <ModeButton
                        label="2v2 Team"
                        icon="🤝"
                        description="Team Battle"
                        color={colors.player.green}
                        onPress={() => startGame('classic', '2v2')}
                    />
                </View>
                <View style={styles.buttonRow}>
                    <ModeButton
                        label="vs Computer"
                        icon="🤖"
                        description="Solo Mastery"
                        color={colors.player.blue}
                        onPress={() => startGame('classic', 'vs_ai')}
                    />
                    <ModeButton
                        label="All Modes"
                        icon="⚡"
                        description="Browse"
                        color={colors.player.yellow}
                        onPress={() => router.push('/mode-select')}
                    />
                </View>
            </View>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/rankings')}>
                    <Text style={styles.navIcon}>🏆</Text>
                    <Text style={styles.navLabel}>Rankings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/shop')}>
                    <Text style={styles.navIcon}>🛍️</Text>
                    <Text style={styles.navLabel}>Shop</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/season-pass')}>
                    <Text style={styles.navIcon}>⭐</Text>
                    <Text style={styles.navLabel}>Season</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
                    <Text style={styles.navIcon}>👤</Text>
                    <Text style={styles.navLabel}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')}>
                    <Text style={styles.navIcon}>⚙️</Text>
                    <Text style={styles.navLabel}>Settings</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Mode Button Component ──────────────────────────────────────

interface ModeButtonProps {
    label: string;
    icon: string;
    description: string;
    color: string;
    onPress: () => void;
}

function ModeButton({ label, icon, description, color, onPress }: ModeButtonProps) {
    return (
        <TouchableOpacity
            style={[styles.modeButton, { borderColor: color + '40' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={styles.modeIcon}>{icon}</Text>
            <Text style={styles.modeLabel}>{label}</Text>
            <Text style={[styles.modeDesc, { color: color }]}>{description}</Text>
        </TouchableOpacity>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ui.background,
        paddingHorizontal: spacing.base,
    },
    hero: {
        alignItems: 'center',
        paddingTop: spacing['3xl'],
        paddingBottom: spacing.xl,
    },
    logo: {
        fontSize: 56,
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: typography.size['5xl'],
        fontWeight: typography.weight.extraBold,
        color: colors.ui.text,
        letterSpacing: 12,
    },
    subtitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.medium,
        color: colors.ui.accent,
        letterSpacing: 8,
        marginTop: -4,
    },
    tagline: {
        fontSize: typography.size.base,
        color: colors.ui.textSecondary,
        marginTop: spacing.md,
        fontStyle: 'italic',
    },
    section: {
        marginTop: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semiBold,
        color: colors.ui.textTertiary,
        letterSpacing: 3,
        marginBottom: spacing.md,
        paddingLeft: spacing.xs,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    modeButton: {
        flex: 1,
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        alignItems: 'center',
        ...shadows.md,
    },
    modeIcon: {
        fontSize: 28,
        marginBottom: spacing.sm,
    },
    modeLabel: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
    },
    modeDesc: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.medium,
        marginTop: spacing.xxs,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    bottomNav: {
        position: 'absolute',
        bottom: spacing['2xl'],
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing['2xl'],
    },
    navItem: {
        alignItems: 'center',
        gap: spacing.xxs,
    },
    navIcon: {
        fontSize: 22,
    },
    navLabel: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
        fontWeight: typography.weight.medium,
    },
});
