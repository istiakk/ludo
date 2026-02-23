/**
 * Ludo: Legends — Tournament Service
 * 
 * Full tournament lifecycle: creation, registration, brackets,
 * matchmaking, results, and prizes.
 * 
 * Formats: Daily Blitz, Weekend Championship, Monthly Masters, Seasonal Grand Prix.
 */

import { getJSON, setJSON } from './StorageService';

// ─── Types ──────────────────────────────────────────────────────

export type TournamentFormat = 'daily_blitz' | 'weekend_championship' | 'monthly_masters' | 'seasonal_grand_prix';
export type TournamentStatus = 'upcoming' | 'registration' | 'in_progress' | 'completed';
export type BracketType = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';

export interface Tournament {
    id: string;
    name: string;
    format: TournamentFormat;
    status: TournamentStatus;
    bracketType: BracketType;
    icon: string;
    description: string;
    entryFee: { currency: 'coins' | 'gems' | 'free'; amount: number };
    prizes: TournamentPrize[];
    maxPlayers: number;
    registeredPlayers: number;
    minElo: number;
    maxElo: number;
    registrationEnd: number;
    startTime: number;
    endTime: number;
    rounds: TournamentRound[];
    rules: TournamentRules;
}

export interface TournamentPrize {
    position: number;       // 1st, 2nd, 3rd, etc.
    label: string;
    rewards: Array<{
        type: 'coins' | 'gems' | 'cosmetic' | 'title';
        amount?: number;
        itemId?: string;
        label: string;
    }>;
}

export interface TournamentRound {
    roundNumber: number;
    name: string;           // "Round of 16", "Quarterfinals", etc.
    matches: TournamentMatch[];
    status: 'pending' | 'active' | 'completed';
}

export interface TournamentMatch {
    id: string;
    player1: TournamentPlayer | null;
    player2: TournamentPlayer | null;
    winner: string | null;  // playerId
    score: [number, number];
    gameId: string | null;
    status: 'pending' | 'live' | 'completed';
    scheduledTime: number;
}

export interface TournamentPlayer {
    playerId: string;
    displayName: string;
    elo: number;
    seed: number;
    isEliminated: boolean;
}

export interface TournamentRules {
    gameMode: string;
    bestOf: number;         // Best of 1, 3, or 5
    timePerMove: number;    // seconds
    allowSpectators: boolean;
}

export interface TournamentRegistration {
    tournamentId: string;
    playerId: string;
    registeredAt: number;
    seed: number;
}

// ─── Storage ────────────────────────────────────────────────────

const KEYS = {
    TOURNAMENTS: '@ludo:tournaments',
    MY_REGISTRATIONS: '@ludo:tournament_registrations',
} as const;

export async function getTournaments(): Promise<Tournament[]> {
    return (await getJSON<Tournament[]>(KEYS.TOURNAMENTS)) ?? [];
}

export async function saveTournaments(tournaments: Tournament[]): Promise<void> {
    return setJSON(KEYS.TOURNAMENTS, tournaments);
}

export async function getMyRegistrations(): Promise<TournamentRegistration[]> {
    return (await getJSON<TournamentRegistration[]>(KEYS.MY_REGISTRATIONS)) ?? [];
}

export async function saveMyRegistrations(regs: TournamentRegistration[]): Promise<void> {
    return setJSON(KEYS.MY_REGISTRATIONS, regs);
}

// ─── Tournament Factories ───────────────────────────────────────

export function createDailyBlitz(): Tournament {
    const now = Date.now();
    return {
        id: `daily_${now}`,
        name: 'Daily Blitz',
        format: 'daily_blitz',
        status: 'registration',
        bracketType: 'single_elimination',
        icon: '⚡',
        description: 'Quick 5-match sprint. Play your best 3 games!',
        entryFee: { currency: 'free', amount: 0 },
        maxPlayers: 16,
        registeredPlayers: 12,
        minElo: 0,
        maxElo: 9999,
        prizes: [
            { position: 1, label: '1st Place', rewards: [{ type: 'coins', amount: 500, label: '500 Coins' }] },
            { position: 2, label: '2nd Place', rewards: [{ type: 'coins', amount: 250, label: '250 Coins' }] },
            { position: 3, label: '3rd Place', rewards: [{ type: 'coins', amount: 100, label: '100 Coins' }] },
        ],
        registrationEnd: now + 2 * 3600000,
        startTime: now + 3 * 3600000,
        endTime: now + 6 * 3600000,
        rounds: generateBracketRounds(16, 'single_elimination'),
        rules: { gameMode: 'quick', bestOf: 1, timePerMove: 30, allowSpectators: true },
    };
}

export function createWeekendChampionship(): Tournament {
    const now = Date.now();
    return {
        id: `weekend_${now}`,
        name: 'Weekend Championship',
        format: 'weekend_championship',
        status: 'upcoming',
        bracketType: 'single_elimination',
        icon: '🏆',
        description: '16-player bracket. Compete for exclusive dice skin!',
        entryFee: { currency: 'coins', amount: 100 },
        maxPlayers: 16,
        registeredPlayers: 8,
        minElo: 800,
        maxElo: 9999,
        prizes: [
            {
                position: 1, label: '1st Place', rewards: [
                    { type: 'coins', amount: 5000, label: '5,000 Coins' },
                    { type: 'cosmetic', itemId: 'dice_champion', label: 'Champion Dice' },
                ]
            },
            { position: 2, label: '2nd Place', rewards: [{ type: 'coins', amount: 2000, label: '2,000 Coins' }] },
            { position: 3, label: '3rd Place', rewards: [{ type: 'coins', amount: 1000, label: '1,000 Coins' }] },
        ],
        registrationEnd: now + 24 * 3600000,
        startTime: now + 48 * 3600000,
        endTime: now + 72 * 3600000,
        rounds: generateBracketRounds(16, 'single_elimination'),
        rules: { gameMode: 'classic', bestOf: 3, timePerMove: 45, allowSpectators: true },
    };
}

export function createMonthlyMasters(): Tournament {
    const now = Date.now();
    return {
        id: `monthly_${now}`,
        name: 'Monthly Masters',
        format: 'monthly_masters',
        status: 'upcoming',
        bracketType: 'double_elimination',
        icon: '👑',
        description: 'The ultimate monthly competition. Legendary cosmetic for the champion!',
        entryFee: { currency: 'gems', amount: 500 },
        maxPlayers: 64,
        registeredPlayers: 32,
        minElo: 1200,
        maxElo: 9999,
        prizes: [
            {
                position: 1, label: 'Champion', rewards: [
                    { type: 'gems', amount: 2000, label: '2,000 Gems' },
                    { type: 'coins', amount: 50000, label: '50,000 Coins' },
                    { type: 'cosmetic', itemId: 'token_crown', label: 'Royal Crown Token' },
                    { type: 'title', itemId: 'title_monthly_master', label: 'Monthly Master' },
                ]
            },
            {
                position: 2, label: 'Runner-Up', rewards: [
                    { type: 'gems', amount: 1000, label: '1,000 Gems' },
                    { type: 'coins', amount: 20000, label: '20,000 Coins' },
                ]
            },
            {
                position: 3, label: '3rd Place', rewards: [
                    { type: 'gems', amount: 500, label: '500 Gems' },
                    { type: 'coins', amount: 10000, label: '10,000 Coins' },
                ]
            },
        ],
        registrationEnd: now + 7 * 24 * 3600000,
        startTime: now + 10 * 24 * 3600000,
        endTime: now + 14 * 24 * 3600000,
        rounds: generateBracketRounds(64, 'double_elimination'),
        rules: { gameMode: 'pro', bestOf: 5, timePerMove: 60, allowSpectators: true },
    };
}

// ─── Bracket Generation ─────────────────────────────────────────

function generateBracketRounds(playerCount: number, type: BracketType): TournamentRound[] {
    const rounds: TournamentRound[] = [];
    let remaining = playerCount;
    let roundNumber = 1;

    const roundNames: Record<number, string> = {
        2: 'Final',
        4: 'Semifinals',
        8: 'Quarterfinals',
        16: 'Round of 16',
        32: 'Round of 32',
        64: 'Round of 64',
    };

    while (remaining > 1) {
        const matchCount = Math.floor(remaining / 2);
        const matches: TournamentMatch[] = [];

        for (let i = 0; i < matchCount; i++) {
            matches.push({
                id: `match_r${roundNumber}_${i}`,
                player1: null,
                player2: null,
                winner: null,
                score: [0, 0],
                gameId: null,
                status: 'pending',
                scheduledTime: 0,
            });
        }

        rounds.push({
            roundNumber,
            name: roundNames[remaining] ?? `Round ${roundNumber}`,
            matches,
            status: 'pending',
        });

        remaining = matchCount;
        roundNumber++;
    }

    return rounds;
}

// ─── Bracket Seeding ────────────────────────────────────────────

export function seedPlayers(players: TournamentPlayer[]): TournamentPlayer[] {
    // Sort by ELO descending, then assign seeds
    return players
        .sort((a, b) => b.elo - a.elo)
        .map((p, i) => ({ ...p, seed: i + 1 }));
}

export function assignFirstRoundMatchups(
    round: TournamentRound,
    seededPlayers: TournamentPlayer[],
): TournamentRound {
    const matches = [...round.matches];

    // Classic bracket seeding: 1 vs N, 2 vs N-1, etc.
    const n = seededPlayers.length;
    for (let i = 0; i < matches.length && i * 2 + 1 < n; i++) {
        matches[i] = {
            ...matches[i],
            player1: seededPlayers[i] ?? null,
            player2: seededPlayers[n - 1 - i] ?? null,
        };
    }

    return { ...round, matches };
}

// ─── Active Tournaments ─────────────────────────────────────────

export function getActiveTournaments(): Tournament[] {
    return [
        createDailyBlitz(),
        createWeekendChampionship(),
        createMonthlyMasters(),
    ];
}

// ─── Spectator ──────────────────────────────────────────────────

export interface SpectatorSession {
    matchId: string;
    tournamentId: string;
    viewerCount: number;
    isLive: boolean;
}

export function canSpectate(match: TournamentMatch, rules: TournamentRules): boolean {
    return rules.allowSpectators && match.status === 'live';
}
