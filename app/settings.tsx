/**
 * Ludo: Legends — Settings Screen
 * 
 * All toggles persist via StorageService. Loads on mount, saves on change.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radii } from '../src/theme/design-system';
import { commonStyles } from '../src/theme/commonStyles';
import { ScreenHeader } from '../src/components/ui';
import {
    getSettings,
    saveSettings,
    clearAllData,
    StoredSettings,
} from '../src/services/StorageService';

export default function SettingsScreen() {
    const router = useRouter();
    const [settings, setSettings] = useState<StoredSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const s = await getSettings();
            setSettings(s);
        } catch (error) {
            console.warn('[Settings] Failed to load:', error);
        } finally {
            setLoading(false);
        }
    }

    const updateSetting = useCallback(async <K extends keyof StoredSettings>(key: K, value: StoredSettings[K]) => {
        if (!settings) return;
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        await saveSettings(updated);
    }, [settings]);

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete All Data',
            'This will erase your profile, match history, cosmetics, and all progress. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: async () => {
                        await clearAllData();
                        Alert.alert('Done', 'All data has been cleared. The app will reset.', [
                            { text: 'OK', onPress: () => router.replace('/') },
                        ]);
                    },
                },
            ],
        );
    };

    if (loading || !settings) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.ui.accent} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={commonStyles.screen}>
            <ScreenHeader title="Settings" />

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
                        onSelect={v => updateSetting('animationSpeed', v as StoredSettings['animationSpeed'])}
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
                    <TouchableOpacity
                        style={[styles.actionButton, styles.dangerButton]}
                        onPress={handleDeleteAccount}
                    >
                        <Text style={styles.dangerText}>Delete All Data</Text>
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
    container: { flex: 1, backgroundColor: colors.ui.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    },
    backBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
    backText: { fontSize: typography.size.base, color: colors.ui.accent, fontWeight: typography.weight.medium },
    headerTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.ui.textTertiary, letterSpacing: 3 },
    scrollContent: { paddingBottom: spacing['3xl'] },
    section: { paddingHorizontal: spacing.base, marginBottom: spacing.xl },
    sectionTitle: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.ui.textTertiary, letterSpacing: 2, marginBottom: spacing.md },
    sectionContent: { backgroundColor: colors.ui.surface, borderRadius: radii.lg, overflow: 'hidden' },
    toggleRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
        borderBottomWidth: 1, borderBottomColor: colors.ui.border,
    },
    toggleInfo: { flex: 1, marginRight: spacing.md },
    toggleLabel: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.ui.text },
    toggleDesc: { fontSize: typography.size.xs, color: colors.ui.textTertiary, marginTop: spacing.xxs },
    optionRow: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.ui.border },
    optionButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    optionBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radii.full, backgroundColor: colors.ui.surfaceElevated },
    optionBtnActive: { backgroundColor: colors.ui.accent + '30', borderWidth: 1, borderColor: colors.ui.accent },
    optionText: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, color: colors.ui.textSecondary },
    optionTextActive: { color: colors.ui.accent },
    actionButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
        borderBottomWidth: 1, borderBottomColor: colors.ui.border,
    },
    actionText: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.ui.text },
    actionArrow: { fontSize: typography.size.md, color: colors.ui.textTertiary },
    dangerButton: { borderBottomWidth: 0 },
    dangerText: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.ui.error },
    versionInfo: { alignItems: 'center', paddingVertical: spacing.xl },
    versionText: { fontSize: typography.size.sm, color: colors.ui.textTertiary, fontWeight: typography.weight.medium },
    versionSub: { fontSize: typography.size.xs, color: colors.ui.textTertiary, marginTop: spacing.xxs, opacity: 0.6 },
});
