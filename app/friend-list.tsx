/**
 * Ludo: Legends — Friend List Screen
 * 
 * Friend management: list, add by code, activity feed, challenge.
 * Uses shared components: ScreenHeader, PillTabs, EmptyState, Badge.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TextInput,
    ActivityIndicator,
    Alert,
    Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import { commonStyles, ON_ACCENT_COLOR } from '../src/theme/commonStyles';
import { ScreenHeader, PillTabs, EmptyState, Badge } from '../src/components/ui';
import {
    Friend,
    FriendActivity,
    getFriends,
    getFriendActivity,
    getMyFriendCode,
    generateDemoFriends,
    generateDemoActivity,
    REFERRAL_REWARDS,
} from '../src/services/FriendService';

type FriendTab = 'friends' | 'activity' | 'add';

const TABS: { id: FriendTab; label: string; icon: string }[] = [
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'activity', label: 'Activity', icon: '📰' },
    { id: 'add', label: 'Add Friend', icon: '➕' },
];

export default function FriendListScreen() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FriendTab>('friends');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [activity, setActivity] = useState<FriendActivity[]>([]);
    const [myCode, setMyCode] = useState('');
    const [searchCode, setSearchCode] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [code, savedFriends, savedActivity] = await Promise.all([
                getMyFriendCode(),
                getFriends(),
                getFriendActivity(),
            ]);
            setMyCode(code);
            setFriends(savedFriends.length > 0 ? savedFriends : generateDemoFriends());
            setActivity(savedActivity.length > 0 ? savedActivity : generateDemoActivity());
        } catch (e) {
            console.warn('[Friends] Load error:', e);
        } finally {
            setLoading(false);
        }
    }

    const onlineFriends = useMemo(() => friends.filter(f => f.isOnline), [friends]);

    const handleShareCode = useCallback(async () => {
        try {
            await Share.share({
                message: `Add me on Ludo: Legends! My friend code is: ${myCode} 🎲`,
            });
        } catch { /* cancelled */ }
    }, [myCode]);

    const handleChallenge = useCallback((friend: Friend) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Challenge Sent! ⚔️',
            `Waiting for ${friend.displayName} to accept your 1v1 challenge.`,
        );
    }, []);

    const handleTabChange = useCallback((tab: FriendTab) => {
        setActiveTab(tab);
        Haptics.selectionAsync();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={commonStyles.screen}>
                <ScreenHeader title="Friends" />
                <View style={commonStyles.loadingContainer}>
                    <ActivityIndicator color={colors.ui.accent} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={commonStyles.screen}>
            <ScreenHeader
                title="Friends"
                rightElement={
                    <Text style={styles.onlineCount}>{onlineFriends.length} online</Text>
                }
            />

            <PillTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

            {activeTab === 'friends' && (
                friends.length === 0 ? (
                    <EmptyState
                        icon="👥"
                        title="No Friends Yet"
                        description="Share your friend code or add someone by theirs!"
                        ctaLabel="Add Friend"
                        onCta={() => setActiveTab('add')}
                    />
                ) : (
                    <FlatList
                        data={friends}
                        keyExtractor={f => f.playerId}
                        contentContainerStyle={styles.listPad}
                        renderItem={({ item }) => (
                            <FriendRow
                                friend={item}
                                onChallenge={() => handleChallenge(item)}
                            />
                        )}
                    />
                )
            )}

            {activeTab === 'activity' && (
                activity.length === 0 ? (
                    <EmptyState icon="📰" title="No Activity" description="Your friends' recent activity will appear here." />
                ) : (
                    <FlatList
                        data={activity}
                        keyExtractor={a => a.id}
                        contentContainerStyle={styles.listPad}
                        renderItem={({ item }) => <ActivityRow activity={item} />}
                    />
                )
            )}

            {activeTab === 'add' && (
                <View style={styles.addContainer}>
                    {/* My Code */}
                    <View style={styles.codeCard}>
                        <Text style={styles.codeLabel}>YOUR FRIEND CODE</Text>
                        <Text style={styles.codeValue}>{myCode}</Text>
                        <TouchableOpacity style={styles.shareCodeBtn} onPress={handleShareCode}>
                            <Text style={styles.shareCodeText}>📤 Share Code</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <Text style={commonStyles.sectionTitle}>ADD BY CODE</Text>
                    <View style={styles.searchRow}>
                        <TextInput
                            style={styles.searchInput}
                            value={searchCode}
                            onChangeText={setSearchCode}
                            placeholder="Enter friend code"
                            placeholderTextColor={colors.ui.textTertiary}
                            autoCapitalize="characters"
                            maxLength={6}
                        />
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => Alert.alert('Friend Request Sent!', `Request sent to code: ${searchCode}`)}
                        >
                            <Text style={styles.addBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Referral */}
                    <View style={styles.referralCard}>
                        <Text style={styles.referralIcon}>🎁</Text>
                        <Text style={styles.referralTitle}>Invite & Earn!</Text>
                        <Text style={styles.referralDesc}>
                            Both you and your friend get {REFERRAL_REWARDS.inviter.coins} coins + exclusive dice!
                        </Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

// ─── Sub-Components ─────────────────────────────────────────────

const FriendRow = React.memo(function FriendRow({ friend, onChallenge }: { friend: Friend; onChallenge: () => void }) {
    return (
        <View style={styles.friendRow}>
            <View style={[styles.onlineDot, { backgroundColor: friend.isOnline ? colors.ui.success : colors.ui.textTertiary }]} />
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.displayName}</Text>
                <Text style={styles.friendMeta}>
                    {friend.elo} ELO · {friend.gamesPlayedTogether} games · W{friend.winsAgainst}/L{friend.lossesAgainst}
                </Text>
            </View>
            {friend.isOnline && (
                <TouchableOpacity style={styles.challengeBtn} onPress={onChallenge} accessibilityLabel={`Challenge ${friend.displayName}`}>
                    <Text style={styles.challengeBtnText}>⚔️</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});

const ActivityRow = React.memo(function ActivityRow({ activity }: { activity: FriendActivity }) {
    const ACTIVITY_ICONS: Record<string, string> = {
        online: '🟢',
        in_game: '🎮',
        won_match: '🏆',
        level_up: '⬆️',
        streak: '🔥',
        joined_clan: '🏰',
    };

    const timeAgo = useMemo(() => {
        const diff = Date.now() - activity.timestamp;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    }, [activity.timestamp]);

    return (
        <View style={styles.activityRow}>
            <Text style={styles.activityIcon}>{ACTIVITY_ICONS[activity.type] ?? '📍'}</Text>
            <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{activity.playerName}</Text>
                <Text style={styles.activityDesc}>{activity.description}</Text>
            </View>
            <Text style={styles.activityTime}>{timeAgo}</Text>
        </View>
    );
});

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    onlineCount: { fontSize: typography.size.xs, color: colors.ui.success, fontWeight: typography.weight.bold },
    listPad: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
    friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.ui.border },
    onlineDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
    friendInfo: { flex: 1 },
    friendName: { fontSize: typography.size.base, fontWeight: typography.weight.semiBold, color: colors.ui.text },
    friendMeta: { fontSize: typography.size.xs, color: colors.ui.textSecondary, marginTop: 2 },
    challengeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.ui.accent + '20', justifyContent: 'center', alignItems: 'center' },
    challengeBtnText: { fontSize: 18 },
    activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.ui.border },
    activityIcon: { fontSize: 16, marginRight: spacing.sm },
    activityInfo: { flex: 1 },
    activityName: { fontSize: typography.size.sm, fontWeight: typography.weight.semiBold, color: colors.ui.text },
    activityDesc: { fontSize: typography.size.xs, color: colors.ui.textSecondary },
    activityTime: { fontSize: typography.size.xs, color: colors.ui.textTertiary },
    addContainer: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
    codeCard: { backgroundColor: colors.ui.surface, borderRadius: radii.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.ui.accent + '30', ...shadows.md },
    codeLabel: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.ui.textSecondary, letterSpacing: 2 },
    codeValue: { fontSize: typography.size['3xl'], fontWeight: typography.weight.extraBold, color: colors.ui.accent, letterSpacing: 6, marginVertical: spacing.md },
    shareCodeBtn: { backgroundColor: colors.ui.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radii.md },
    shareCodeText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: ON_ACCENT_COLOR },
    searchRow: { flexDirection: 'row', gap: spacing.sm },
    searchInput: { flex: 1, backgroundColor: colors.ui.surface, borderRadius: radii.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.ui.text, letterSpacing: 4, borderWidth: 1, borderColor: colors.ui.border },
    addBtn: { backgroundColor: colors.ui.accent, paddingHorizontal: spacing.xl, borderRadius: radii.md, justifyContent: 'center' },
    addBtnText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: ON_ACCENT_COLOR },
    referralCard: { backgroundColor: colors.ui.surface, borderRadius: radii.xl, padding: spacing.xl, alignItems: 'center', marginTop: spacing.xl, borderWidth: 1, borderColor: colors.ui.gold + '30' },
    referralIcon: { fontSize: 36, marginBottom: spacing.sm },
    referralTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.ui.text },
    referralDesc: { fontSize: typography.size.sm, color: colors.ui.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 18 },
});
