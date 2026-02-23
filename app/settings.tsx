/**
 * Ludo: Legends — Settings Screen
 * 
 * Audio, haptics, accessibility, and account settings.
 * Premium design with toggle switches and sliders.
 * 
 * SME Agent: ui-ux-pro-max, mobile-design
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';

interface SettingsState {
    soundEnabled: boolean;
    musicEnabled: boolean;
    hapticsEnabled: boolean;
    notifications: boolean;
    showThreatOverlay: boolean;
    showCoachingHints: boolean;
    autoRollDice: boolean;
    animationSpeed: 'normal' | 'fast' | 'instant';
    boardTheme: string;
}

export default function SettingsScreen() {
    const router = useRouter();
    const [settings, setSettings] = useState<SettingsState>({
        soundEnabled: true,
        musicEnabled: true,
        hapticsEnabled: true,
        notifications: true,
        showThreatOverlay: true,
        showCoachingHints: false,
        autoRollDice: false,
        animationSpeed: 'normal',
        boardTheme: 'classic',
    });

    const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SETTINGS</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Audio */}
                <SettingsSection title="AUDIO">
                    <SettingsToggle
                        label="Sound Effects"
                        description="Dice, captures, and UI sounds"
                        value={settings.soundEnabled}
                        onToggle={v => updateSetting('soundEnabled', v)}
                    />
                    <SettingsToggle
                        label="Background Music"
                        description="Ambient soundtrack during matches"
                        value={settings.musicEnabled}
                        onToggle={v => updateSetting('musicEnabled', v)}
                    />
                    <SettingsToggle
                        label="Haptic Feedback"
                        description="Vibrations on dice rolls and captures"
                        value={settings.hapticsEnabled}
                        onToggle={v => updateSetting('hapticsEnabled', v)}
                    />
                </SettingsSection>

                {/* Gameplay */}
                <SettingsSection title="GAMEPLAY">
                    <SettingsToggle
                        label="Threat Overlay"
                        description="Show danger zones and safe indicators"
                        value={settings.showThreatOverlay}
                        onToggle={v => updateSetting('showThreatOverlay', v)}
                    />
                    <SettingsToggle
                        label="Coaching Hints"
                        description="AI explains optimal moves"
                        value={settings.showCoachingHints}
                        onToggle={v => updateSetting('showCoachingHints', v)}
                    />
                    <SettingsToggle
                        label="Auto-roll Dice"
                        description="Automatically roll when it's your turn"
                        value={settings.autoRollDice}
                        onToggle={v => updateSetting('autoRollDice', v)}
                    />
                    <SettingsOption
                        label="Animation Speed"
                        options={['normal', 'fast', 'instant']}
                        selected={settings.animationSpeed}
                        onSelect={v => updateSetting('animationSpeed', v as SettingsState['animationSpeed'])}
                    />
                </SettingsSection>

                {/* Notifications */}
                <SettingsSection title="NOTIFICATIONS">
                    <SettingsToggle
                        label="Push Notifications"
                        description="Match invites and friend requests"
                        value={settings.notifications}
                        onToggle={v => updateSetting('notifications', v)}
                    />
                </SettingsSection>

                {/* Account */}
                <SettingsSection title="ACCOUNT">
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionText}>Link Social Account</Text>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionText}>Privacy Policy</Text>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionText}>Terms of Service</Text>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.dangerButton]}>
                        <Text style={styles.dangerText}>Delete Account</Text>
                    </TouchableOpacity>
                </SettingsSection>

                {/* Version */}
                <View style={styles.versionInfo}>
                    <Text style={styles.versionText}>Ludo: Legends v1.0.0</Text>
                    <Text style={styles.versionSub}>Made with ♛ and TypeScript</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Sub-Components ─────────────────────────────────────────────

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>{children}</View>
        </View>
    );
}

function SettingsToggle({
    label, description, value, onToggle,
}: {
    label: string; description: string; value: boolean; onToggle: (v: boolean) => void;
}) {
    return (
        <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{label}</Text>
                <Text style={styles.toggleDesc}>{description}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: colors.ui.border, true: colors.ui.accent + '60' }}
                thumbColor={value ? colors.ui.accent : colors.ui.textTertiary}
            />
        </View>
    );
}

function SettingsOption({
    label, options, selected, onSelect,
}: {
    label: string; options: string[]; selected: string; onSelect: (v: string) => void;
}) {
    return (
        <View style={styles.optionRow}>
            <Text style={styles.toggleLabel}>{label}</Text>
            <View style={styles.optionButtons}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.optionBtn, selected === opt && styles.optionBtnActive]}
                        onPress={() => onSelect(opt)}
                    >
                        <Text style={[styles.optionText, selected === opt && styles.optionTextActive]}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ui.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
    },
    backBtn: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    backText: {
        fontSize: typography.size.base,
        color: colors.ui.accent,
        fontWeight: typography.weight.medium,
    },
    headerTitle: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary,
        letterSpacing: 3,
    },
    scrollContent: {
        paddingBottom: spacing['3xl'],
    },
    section: {
        paddingHorizontal: spacing.base,
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary,
        letterSpacing: 2,
        marginBottom: spacing.md,
    },
    sectionContent: {
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        overflow: 'hidden',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.ui.border,
    },
    toggleInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    toggleLabel: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.medium,
        color: colors.ui.text,
    },
    toggleDesc: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
        marginTop: spacing.xxs,
    },
    optionRow: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.ui.border,
    },
    optionButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    optionBtn: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radii.full,
        backgroundColor: colors.ui.surfaceElevated,
    },
    optionBtnActive: {
        backgroundColor: colors.ui.accent + '30',
        borderWidth: 1,
        borderColor: colors.ui.accent,
    },
    optionText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.medium,
        color: colors.ui.textSecondary,
    },
    optionTextActive: {
        color: colors.ui.accent,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.ui.border,
    },
    actionText: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.medium,
        color: colors.ui.text,
    },
    actionArrow: {
        fontSize: typography.size.md,
        color: colors.ui.textTertiary,
    },
    dangerButton: {
        borderBottomWidth: 0,
    },
    dangerText: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.medium,
        color: colors.ui.error,
    },
    versionInfo: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    versionText: {
        fontSize: typography.size.sm,
        color: colors.ui.textTertiary,
        fontWeight: typography.weight.medium,
    },
    versionSub: {
        fontSize: typography.size.xs,
        color: colors.ui.textTertiary,
        marginTop: spacing.xxs,
        opacity: 0.6,
    },
});
