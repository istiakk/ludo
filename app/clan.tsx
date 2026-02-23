/**
 * Ludo: Legends — Clan Screen
 * 
 * Full clan experience: overview, members, chat, wars, and perks.
 * Uses shared components: ScreenHeader, PillTabs, ProgressBar, Badge.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    FlatList,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import { commonStyles, ON_ACCENT_COLOR } from '../src/theme/commonStyles';
import { ScreenHeader, PillTabs, ProgressBar, Badge, EmptyState } from '../src/components/ui';
import {
    Clan,
    ClanMember,
    ClanChatMessage,
    ClanWar,
    getMyClan,
    saveMyClan,
    getClanMembers,
    getClanChat,
    addClanMessage,
    createChatMessage,
    getClanPerks,
    getClanXPForLevel,
    generateDemoClan,
    generateDemoMembers,
} from '../src/services/ClanService';

type ClanTab = 'overview' | 'members' | 'chat' | 'wars';

const TABS: { id: ClanTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '🏰' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'wars', label: 'Wars', icon: '⚔️' },
];

const ROLE_COLORS: Record<string, string> = {
    leader: '#FFD700',
    co_leader: '#C0C0C0',
    elder: '#CD7F32',
    member: colors.ui.textSecondary,
};

export default function ClanScreen() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ClanTab>('overview');
    const [clan, setClan] = useState<Clan | null>(null);
    const [members, setMembers] = useState<ClanMember[]>([]);
    const [chat, setChat] = useState<ClanChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');

    useEffect(() => {
        loadClan();
    }, []);

    async function loadClan() {
        try {
            let myClan = await getMyClan();
            if (!myClan) {
                // Auto-create demo clan for first visit
                myClan = generateDemoClan();
                await saveMyClan(myClan);
            }
            setClan(myClan);
            setMembers(generateDemoMembers());
            setChat(await getClanChat());
        } catch (e) {
            console.warn('[Clan] Load error:', e);
        } finally {
            setLoading(false);
        }
    }

    const perks = useMemo(() => clan ? getClanPerks(clan.level) : getClanPerks(1), [clan]);

    const handleSendChat = useCallback(async () => {
        if (!chatInput.trim()) return;
        const msg = createChatMessage('player_self', 'You', chatInput.trim());
        await addClanMessage(msg);
        setChat(prev => [...prev, msg]);
        setChatInput('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [chatInput]);

    const handleTabChange = useCallback((tab: ClanTab) => {
        setActiveTab(tab);
        Haptics.selectionAsync();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={commonStyles.screen}>
                <ScreenHeader title="Clan" />
                <View style={commonStyles.loadingContainer}>
                    <ActivityIndicator color={colors.ui.accent} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    if (!clan) {
        return (
            <SafeAreaView style={commonStyles.screen}>
                <ScreenHeader title="Clan" />
                <EmptyState
                    icon="🏰"
                    title="No Clan Yet"
                    description="Join or create a clan to unlock perks, compete in wars, and chat with teammates!"
                    ctaLabel="Create Clan"
                    onCta={() => { }}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={commonStyles.screen}>
            <ScreenHeader
                title={`${clan.badge} ${clan.name}`}
                rightElement={<Badge label={`[${clan.tag}]`} color={colors.ui.accent} size="md" />}
            />

            <PillTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

            {activeTab === 'overview' && (
                <ScrollView contentContainerStyle={styles.contentPad}>
                    {/* Clan Level */}
                    <View style={styles.card}>
                        <View style={styles.levelRow}>
                            <Text style={styles.levelLabel}>Clan Level {clan.level}</Text>
                            <Text style={styles.levelXP}>{clan.xp} / {clan.xpToNext} XP</Text>
                        </View>
                        <ProgressBar current={clan.xp} total={clan.xpToNext} color={colors.ui.accent} height={6} />
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <StatBlock label="Members" value={`${clan.memberCount}/${clan.maxMembers}`} icon="👥" />
                        <StatBlock label="Level" value={String(clan.level)} icon="⭐" />
                        <StatBlock label="Wars Won" value="3" icon="⚔️" />
                    </View>

                    {/* Perks */}
                    <Text style={commonStyles.sectionTitle}>CLAN PERKS</Text>
                    <View style={styles.card}>
                        <PerkRow icon="🪙" label="Coin Bonus" value={`+${perks.coinBonus}%`} unlocked={perks.coinBonus > 0} />
                        <PerkRow icon="⚡" label="XP Bonus" value={`+${perks.xpBonus}%`} unlocked={perks.xpBonus > 0} />
                        <PerkRow icon="⚔️" label="War Slots" value={String(perks.warSlots)} unlocked />
                        <PerkRow icon="📜" label="Chat History" value={`${perks.chatHistoryDays}d`} unlocked />
                    </View>
                </ScrollView>
            )}

            {activeTab === 'members' && (
                <FlatList
                    data={members}
                    keyExtractor={m => m.playerId}
                    contentContainerStyle={styles.contentPad}
                    renderItem={({ item }) => <MemberRow member={item} />}
                />
            )}

            {activeTab === 'chat' && (
                <View style={styles.chatContainer}>
                    {chat.length === 0 ? (
                        <EmptyState icon="💬" title="No Messages" description="Start the conversation!" />
                    ) : (
                        <FlatList
                            data={chat}
                            keyExtractor={m => m.id}
                            contentContainerStyle={styles.chatList}
                            renderItem={({ item }) => <ChatBubble msg={item} />}
                        />
                    )}
                    <View style={styles.chatInputRow}>
                        <TextInput
                            style={styles.chatInput}
                            value={chatInput}
                            onChangeText={setChatInput}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.ui.textTertiary}
                            maxLength={200}
                        />
                        <TouchableOpacity style={styles.sendBtn} onPress={handleSendChat}>
                            <Text style={styles.sendBtnText}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {activeTab === 'wars' && (
                <ScrollView contentContainerStyle={styles.contentPad}>
                    <EmptyState
                        icon="⚔️"
                        title="No Active Wars"
                        description="Start a clan war to compete against other clans in 5v5 matches!"
                        ctaLabel="Find Opponent"
                        onCta={() => { }}
                    />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ─── Sub-Components ─────────────────────────────────────────────

const StatBlock = React.memo(function StatBlock({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <View style={styles.statBlock}>
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
});

const PerkRow = React.memo(function PerkRow({ icon, label, value, unlocked }: { icon: string; label: string; value: string; unlocked: boolean }) {
    return (
        <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>{icon}</Text>
            <Text style={[styles.perkLabel, !unlocked && styles.perkLocked]}>{label}</Text>
            <Text style={[styles.perkValue, unlocked ? styles.perkActive : styles.perkLocked]}>{value}</Text>
        </View>
    );
});

const MemberRow = React.memo(function MemberRow({ member }: { member: ClanMember }) {
    return (
        <View style={styles.memberRow}>
            <View style={[styles.onlineDot, { backgroundColor: member.isOnline ? colors.ui.success : colors.ui.textTertiary }]} />
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.playerName}</Text>
                <Text style={styles.memberMeta}>{member.elo} ELO · {member.totalWins}W</Text>
            </View>
            <Badge label={member.role.replace('_', ' ').toUpperCase()} color={ROLE_COLORS[member.role]} />
        </View>
    );
});

const ChatBubble = React.memo(function ChatBubble({ msg }: { msg: ClanChatMessage }) {
    const isMine = msg.senderId === 'player_self';
    const isSystem = msg.type === 'system' || msg.type === 'join' || msg.type === 'leave';

    if (isSystem) {
        return (
            <View style={styles.systemMsg}>
                <Text style={styles.systemMsgText}>{msg.message}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
            {!isMine && <Text style={styles.bubbleSender}>{msg.senderName}</Text>}
            <Text style={styles.bubbleText}>{msg.message}</Text>
        </View>
    );
});

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    contentPad: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
    card: { backgroundColor: colors.ui.surface, borderRadius: radii.lg, padding: spacing.lg, ...shadows.sm, marginBottom: spacing.md },
    levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    levelLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.ui.text },
    levelXP: { fontSize: typography.size.xs, color: colors.ui.textSecondary },
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    statBlock: { flex: 1, backgroundColor: colors.ui.surface, borderRadius: radii.md, padding: spacing.md, alignItems: 'center', ...shadows.sm },
    statIcon: { fontSize: 20, marginBottom: spacing.xxs },
    statValue: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.ui.text },
    statLabel: { fontSize: typography.size.xs, color: colors.ui.textSecondary },
    perkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.ui.border },
    perkIcon: { fontSize: 16, marginRight: spacing.sm },
    perkLabel: { flex: 1, fontSize: typography.size.sm, color: colors.ui.text },
    perkValue: { fontSize: typography.size.sm, fontWeight: typography.weight.bold },
    perkActive: { color: colors.ui.success },
    perkLocked: { color: colors.ui.textTertiary },
    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.ui.border },
    onlineDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
    memberInfo: { flex: 1 },
    memberName: { fontSize: typography.size.base, fontWeight: typography.weight.semiBold, color: colors.ui.text },
    memberMeta: { fontSize: typography.size.xs, color: colors.ui.textSecondary },
    chatContainer: { flex: 1 },
    chatList: { paddingHorizontal: spacing.base, paddingBottom: spacing.md },
    chatInputRow: { flexDirection: 'row', padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.ui.border, gap: spacing.sm },
    chatInput: { flex: 1, backgroundColor: colors.ui.surface, borderRadius: radii.md, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, fontSize: typography.size.sm, color: colors.ui.text },
    sendBtn: { backgroundColor: colors.ui.accent, borderRadius: radii.md, paddingHorizontal: spacing.lg, justifyContent: 'center' },
    sendBtnText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: ON_ACCENT_COLOR },
    bubble: { maxWidth: '75%', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm },
    bubbleMine: { backgroundColor: colors.ui.accent + '20', alignSelf: 'flex-end', borderBottomRightRadius: radii.xs },
    bubbleTheirs: { backgroundColor: colors.ui.surface, alignSelf: 'flex-start', borderBottomLeftRadius: radii.xs },
    bubbleSender: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.ui.accent, marginBottom: 2 },
    bubbleText: { fontSize: typography.size.sm, color: colors.ui.text },
    systemMsg: { alignSelf: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
    systemMsgText: { fontSize: typography.size.xs, color: colors.ui.textTertiary, fontStyle: 'italic' },
});
