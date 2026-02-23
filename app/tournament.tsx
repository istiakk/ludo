/**
 * Ludo: Legends — Tournament Screen
 * 
 * Browse tournaments, register, view brackets, track progress.
 * Uses shared: ScreenHeader, PillTabs, Badge, EmptyState, ProgressBar.
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
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radii, shadows } from '../src/theme/design-system';
import { commonStyles, ON_ACCENT_COLOR } from '../src/theme/commonStyles';
import { ScreenHeader, PillTabs, Badge, EmptyState, ProgressBar } from '../src/components/ui';
import {
    Tournament,
    TournamentFormat,
    TournamentRound,
    TournamentMatch,
    getActiveTournaments,
    getMyRegistrations,
    saveMyRegistrations,
    TournamentRegistration,
} from '../src/services/TournamentService';

type TournamentTab = 'browse' | 'my_tournaments' | 'brackets';

const TABS: { id: TournamentTab; label: string; icon: string }[] = [
    { id: 'browse', label: 'Browse', icon: '🏆' },
    { id: 'my_tournaments', label: 'My Tournaments', icon: '⭐' },
    { id: 'brackets', label: 'Brackets', icon: '🗂️' },
];

const FORMAT_COLORS: Record<TournamentFormat, string> = {
    daily_blitz: '#FFD700',
    weekend_championship: '#58A6FF',
    monthly_masters: '#A855F7',
    seasonal_grand_prix: '#FF6B6B',
};

export default function TournamentScreen() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TournamentTab>('browse');
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [tourns, regs] = await Promise.all([
                    Promise.resolve(getActiveTournaments()),
                    getMyRegistrations(),
                ]);
                setTournaments(tourns);
                setRegistrations(regs);
            } catch (e) {
                console.warn('[Tournament] Load error:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleRegister = useCallback(async (tournament: Tournament) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const already = registrations.some(r => r.tournamentId === tournament.id);
        if (already) {
            Alert.alert('Already Registered', 'You\'re already signed up for this tournament!');
            return;
        }

        const reg: TournamentRegistration = {
            tournamentId: tournament.id,
            playerId: 'player_self',
            registeredAt: Date.now(),
            seed: 0,
        };

        const updated = [...registrations, reg];
        setRegistrations(updated);
        await saveMyRegistrations(updated);

        Alert.alert('Registered! 🎉', `You're in the ${tournament.name}! Good luck.`);
    }, [registrations]);

    const handleTabChange = useCallback((tab: TournamentTab) => {
        setActiveTab(tab);
        if (tab !== 'brackets') setSelectedTournament(null);
    }, []);

    const myTournaments = useMemo(() => {
        const myIds = new Set(registrations.map(r => r.tournamentId));
        return tournaments.filter(t => myIds.has(t.id));
    }, [tournaments, registrations]);

    if (loading) {
        return (
            <SafeAreaView style={commonStyles.screen}>
                <ScreenHeader title="Tournaments" />
                <View style={commonStyles.loadingContainer}>
                    <ActivityIndicator color={colors.ui.accent} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={commonStyles.screen}>
            <ScreenHeader title="Tournaments" />
            <PillTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

            {activeTab === 'browse' && (
                <FlatList
                    data={tournaments}
                    keyExtractor={t => t.id}
                    contentContainerStyle={styles.listPad}
                    renderItem={({ item }) => (
                        <TournamentCard
                            tournament={item}
                            isRegistered={registrations.some(r => r.tournamentId === item.id)}
                            onRegister={() => handleRegister(item)}
                            onViewBracket={() => { setSelectedTournament(item); setActiveTab('brackets'); }}
                        />
                    )}
                />
            )}

            {activeTab === 'my_tournaments' && (
                myTournaments.length === 0 ? (
                    <EmptyState
                        icon="🏆"
                        title="No Tournaments"
                        description="Browse and register for tournaments to compete!"
                        ctaLabel="Browse"
                        onCta={() => setActiveTab('browse')}
                    />
                ) : (
                    <FlatList
                        data={myTournaments}
                        keyExtractor={t => t.id}
                        contentContainerStyle={styles.listPad}
                        renderItem={({ item }) => (
                            <TournamentCard
                                tournament={item}
                                isRegistered
                                onRegister={() => { }}
                                onViewBracket={() => { setSelectedTournament(item); setActiveTab('brackets'); }}
                            />
                        )}
                    />
                )
            )}

            {activeTab === 'brackets' && (
                selectedTournament ? (
                    <BracketView tournament={selectedTournament} />
                ) : (
                    <EmptyState
                        icon="🗂️"
                        title="Select a Tournament"
                        description="Tap 'View Bracket' on any tournament to see the bracket."
                    />
                )
            )}
        </SafeAreaView>
    );
}

// ─── Sub-Components ─────────────────────────────────────────────

const TournamentCard = React.memo(function TournamentCard({
    tournament, isRegistered, onRegister, onViewBracket,
}: {
    tournament: Tournament;
    isRegistered: boolean;
    onRegister: () => void;
    onViewBracket: () => void;
}) {
    const formatColor = FORMAT_COLORS[tournament.format];

    const timeUntilStart = useMemo(() => {
        const diff = tournament.startTime - Date.now();
        if (diff <= 0) return 'Started';
        const hours = Math.floor(diff / 3600000);
        if (hours > 24) return `${Math.floor(hours / 24)}d`;
        return `${hours}h`;
    }, [tournament.startTime]);

    return (
        <View style={[styles.card, { borderColor: formatColor + '30' }]}>
            <View style={styles.cardTop}>
                <Text style={styles.cardIcon}>{tournament.icon}</Text>
                <View style={styles.cardTitleArea}>
                    <Text style={styles.cardName}>{tournament.name}</Text>
                    <Text style={styles.cardDesc}>{tournament.description}</Text>
                </View>
                <Badge label={timeUntilStart} color={formatColor} />
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <StatPill icon="👥" value={`${tournament.registeredPlayers}/${tournament.maxPlayers}`} />
                <StatPill icon="🎮" value={`BO${tournament.rules.bestOf}`} />
                <StatPill icon="💰" value={tournament.entryFee.currency === 'free' ? 'Free' : `${tournament.entryFee.amount} ${tournament.entryFee.currency === 'coins' ? '🪙' : '💎'}`} />
            </View>

            {/* Prizes */}
            <View style={styles.prizesRow}>
                {tournament.prizes.slice(0, 3).map((prize, i) => (
                    <View key={i} style={styles.prizeChip}>
                        <Text style={styles.prizePos}>{['🥇', '🥈', '🥉'][i]}</Text>
                        <Text style={styles.prizeLabel}>{prize.rewards[0]?.label}</Text>
                    </View>
                ))}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.bracketBtn} onPress={onViewBracket}>
                    <Text style={styles.bracketBtnText}>View Bracket</Text>
                </TouchableOpacity>
                {!isRegistered ? (
                    <TouchableOpacity style={[styles.registerBtn, { backgroundColor: formatColor }]} onPress={onRegister}>
                        <Text style={styles.registerBtnText}>Register</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.registeredBadge}>
                        <Text style={styles.registeredText}>✓ Registered</Text>
                    </View>
                )}
            </View>
        </View>
    );
});

const StatPill = React.memo(function StatPill({ icon, value }: { icon: string; value: string }) {
    return (
        <View style={styles.statPill}>
            <Text style={styles.statPillIcon}>{icon}</Text>
            <Text style={styles.statPillValue}>{value}</Text>
        </View>
    );
});

const BracketView = React.memo(function BracketView({ tournament }: { tournament: Tournament }) {
    return (
        <ScrollView contentContainerStyle={styles.listPad}>
            <Text style={styles.bracketTitle}>{tournament.icon} {tournament.name} Bracket</Text>
            <Text style={styles.bracketSub}>{tournament.bracketType.replace('_', ' ')} · {tournament.maxPlayers} players</Text>

            {tournament.rounds.map((round) => (
                <View key={round.roundNumber} style={styles.roundBlock}>
                    <Text style={styles.roundName}>{round.name}</Text>
                    {round.matches.map((match, i) => (
                        <MatchSlot key={match.id} match={match} index={i} />
                    ))}
                </View>
            ))}
        </ScrollView>
    );
});

const MatchSlot = React.memo(function MatchSlot({ match, index }: { match: TournamentMatch; index: number }) {
    return (
        <View style={styles.matchSlot}>
            <View style={styles.matchPlayers}>
                <View style={styles.playerSlot}>
                    <Text style={styles.playerSeed}>{match.player1 ? `#${match.player1.seed}` : '-'}</Text>
                    <Text style={styles.playerName}>{match.player1?.displayName ?? 'TBD'}</Text>
                </View>
                <Text style={styles.vsText}>vs</Text>
                <View style={styles.playerSlot}>
                    <Text style={styles.playerSeed}>{match.player2 ? `#${match.player2.seed}` : '-'}</Text>
                    <Text style={styles.playerName}>{match.player2?.displayName ?? 'TBD'}</Text>
                </View>
            </View>
            <View style={[styles.matchStatus, { backgroundColor: match.status === 'live' ? colors.ui.success + '20' : colors.ui.surface }]}>
                <Text style={[styles.matchStatusText, match.status === 'live' && { color: colors.ui.success }]}>
                    {match.status === 'live' ? '🔴 LIVE' : match.status === 'completed' ? '✓ Done' : 'Pending'}
                </Text>
            </View>
        </View>
    );
});

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    listPad: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
    card: { backgroundColor: colors.ui.surface, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, ...shadows.sm },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
    cardIcon: { fontSize: 28 },
    cardTitleArea: { flex: 1 },
    cardName: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.ui.text },
    cardDesc: { fontSize: typography.size.xs, color: colors.ui.textSecondary, marginTop: 2, lineHeight: 14 },
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    statPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.glass.light, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.full },
    statPillIcon: { fontSize: 12 },
    statPillValue: { fontSize: typography.size.xs, fontWeight: typography.weight.semiBold, color: colors.ui.text },
    prizesRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    prizeChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    prizePos: { fontSize: 14 },
    prizeLabel: { fontSize: typography.size.xs, color: colors.ui.textSecondary },
    actionsRow: { flexDirection: 'row', gap: spacing.sm },
    bracketBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.ui.border, alignItems: 'center' },
    bracketBtnText: { fontSize: typography.size.sm, color: colors.ui.text, fontWeight: typography.weight.medium },
    registerBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, alignItems: 'center' },
    registerBtnText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: ON_ACCENT_COLOR },
    registeredBadge: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.ui.success + '15', alignItems: 'center' },
    registeredText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.ui.success },
    bracketTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.ui.text, marginBottom: spacing.xs },
    bracketSub: { fontSize: typography.size.sm, color: colors.ui.textSecondary, marginBottom: spacing.xl, textTransform: 'capitalize' },
    roundBlock: { marginBottom: spacing.xl },
    roundName: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.ui.accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },
    matchSlot: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.ui.surface, borderRadius: radii.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.xs, borderWidth: 1, borderColor: colors.ui.border },
    matchPlayers: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    playerSlot: { flex: 1 },
    playerSeed: { fontSize: 9, color: colors.ui.textTertiary, fontWeight: typography.weight.bold },
    playerName: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.ui.text },
    vsText: { fontSize: typography.size.xs, color: colors.ui.textTertiary, fontWeight: typography.weight.bold, marginHorizontal: spacing.sm },
    matchStatus: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm },
    matchStatusText: { fontSize: 9, fontWeight: typography.weight.bold, color: colors.ui.textTertiary },
});
