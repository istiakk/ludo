/**
 * Ludo: Legends — Season Pass Service
 * 
 * 30-day seasons with free + paid reward tracks,
 * daily/weekly/season missions, and tier progression.
 */

import { CosmeticRarity, Currency } from './ProgressionService';

// ─── Types ──────────────────────────────────────────────────────

export interface Season {
    id: string;
    name: string;
    theme: string;
    startDate: number;
    endDate: number;
    totalTiers: number;
    xpPerTier: number;
}

export interface TierReward {
    tier: number;
    free: RewardItem;
    paid: RewardItem;
}

export type RewardItem =
    | { type: 'currency'; currency: Currency; amount: number }
    | { type: 'cosmetic'; cosmeticId: string; rarity: CosmeticRarity }
    | { type: 'badge'; badgeId: string; name: string };

export type MissionType = 'daily' | 'weekly' | 'season';

export interface Mission {
    id: string;
    type: MissionType;
    title: string;
    description: string;
    target: number;
    xpReward: number;
    icon: string;
}

export interface MissionProgress {
    missionId: string;
    current: number;
    completed: boolean;
    claimedAt: number | null;
}

export interface SeasonPassState {
    seasonId: string;
    isPremium: boolean;
    currentTier: number;
    currentXP: number;
    totalXPEarned: number;
    claimedFreeTiers: number[];
    claimedPaidTiers: number[];
    missionProgress: Record<string, MissionProgress>;
    activeDailyMissions: string[];
    activeWeeklyMissions: string[];
}

// ─── Season Configuration ───────────────────────────────────────

export function createCurrentSeason(): Season {
    const now = Date.now();
    return {
        id: 'season_1',
        name: 'Inaugural Season',
        theme: 'Golden Era',
        startDate: now,
        endDate: now + 30 * 24 * 60 * 60 * 1000, // 30 days
        totalTiers: 30,
        xpPerTier: 1000,
    };
}

// ─── Tier Rewards ───────────────────────────────────────────────

export const SEASON_REWARDS: TierReward[] = [
    { tier: 1, free: { type: 'currency', currency: 'coins', amount: 50 }, paid: { type: 'currency', currency: 'coins', amount: 100 } },
    { tier: 2, free: { type: 'currency', currency: 'coins', amount: 50 }, paid: { type: 'cosmetic', cosmeticId: 's1_frame_bronze', rarity: 'common' } },
    { tier: 3, free: { type: 'currency', currency: 'coins', amount: 75 }, paid: { type: 'currency', currency: 'coins', amount: 150 } },
    { tier: 4, free: { type: 'currency', currency: 'coins', amount: 75 }, paid: { type: 'currency', currency: 'coins', amount: 150 } },
    { tier: 5, free: { type: 'currency', currency: 'coins', amount: 100 }, paid: { type: 'cosmetic', cosmeticId: 's1_dice_royal', rarity: 'rare' } },
    { tier: 6, free: { type: 'currency', currency: 'coins', amount: 100 }, paid: { type: 'currency', currency: 'coins', amount: 200 } },
    { tier: 7, free: { type: 'currency', currency: 'coins', amount: 100 }, paid: { type: 'currency', currency: 'coins', amount: 200 } },
    { tier: 8, free: { type: 'currency', currency: 'coins', amount: 125 }, paid: { type: 'currency', currency: 'coins', amount: 250 } },
    { tier: 9, free: { type: 'currency', currency: 'coins', amount: 125 }, paid: { type: 'currency', currency: 'coins', amount: 250 } },
    { tier: 10, free: { type: 'cosmetic', cosmeticId: 's1_emote_wave', rarity: 'common' }, paid: { type: 'cosmetic', cosmeticId: 's1_token_ruby', rarity: 'epic' } },
    { tier: 11, free: { type: 'currency', currency: 'coins', amount: 150 }, paid: { type: 'currency', currency: 'coins', amount: 300 } },
    { tier: 12, free: { type: 'currency', currency: 'coins', amount: 150 }, paid: { type: 'currency', currency: 'coins', amount: 300 } },
    { tier: 13, free: { type: 'currency', currency: 'coins', amount: 150 }, paid: { type: 'currency', currency: 'coins', amount: 300 } },
    { tier: 14, free: { type: 'currency', currency: 'coins', amount: 175 }, paid: { type: 'currency', currency: 'coins', amount: 350 } },
    { tier: 15, free: { type: 'currency', currency: 'coins', amount: 200 }, paid: { type: 'currency', currency: 'gems', amount: 5 } },
    { tier: 16, free: { type: 'currency', currency: 'coins', amount: 200 }, paid: { type: 'currency', currency: 'coins', amount: 400 } },
    { tier: 17, free: { type: 'currency', currency: 'coins', amount: 200 }, paid: { type: 'currency', currency: 'coins', amount: 400 } },
    { tier: 18, free: { type: 'currency', currency: 'coins', amount: 225 }, paid: { type: 'currency', currency: 'coins', amount: 450 } },
    { tier: 19, free: { type: 'currency', currency: 'coins', amount: 225 }, paid: { type: 'currency', currency: 'coins', amount: 450 } },
    { tier: 20, free: { type: 'currency', currency: 'coins', amount: 250 }, paid: { type: 'cosmetic', cosmeticId: 's1_board_palace', rarity: 'epic' } },
    { tier: 21, free: { type: 'currency', currency: 'coins', amount: 250 }, paid: { type: 'currency', currency: 'coins', amount: 500 } },
    { tier: 22, free: { type: 'currency', currency: 'coins', amount: 250 }, paid: { type: 'currency', currency: 'coins', amount: 500 } },
    { tier: 23, free: { type: 'currency', currency: 'coins', amount: 275 }, paid: { type: 'currency', currency: 'coins', amount: 550 } },
    { tier: 24, free: { type: 'currency', currency: 'coins', amount: 275 }, paid: { type: 'currency', currency: 'coins', amount: 550 } },
    { tier: 25, free: { type: 'currency', currency: 'coins', amount: 300 }, paid: { type: 'cosmetic', cosmeticId: 's1_trail_golden', rarity: 'epic' } },
    { tier: 26, free: { type: 'currency', currency: 'coins', amount: 300 }, paid: { type: 'currency', currency: 'coins', amount: 600 } },
    { tier: 27, free: { type: 'currency', currency: 'coins', amount: 300 }, paid: { type: 'currency', currency: 'coins', amount: 600 } },
    { tier: 28, free: { type: 'currency', currency: 'coins', amount: 350 }, paid: { type: 'currency', currency: 'coins', amount: 700 } },
    { tier: 29, free: { type: 'currency', currency: 'coins', amount: 400 }, paid: { type: 'currency', currency: 'gems', amount: 10 } },
    { tier: 30, free: { type: 'badge', badgeId: 's1_badge', name: 'Season 1 Veteran' }, paid: { type: 'cosmetic', cosmeticId: 's1_legendary_crown', rarity: 'legendary' } },
];

// ─── Missions ───────────────────────────────────────────────────

export const DAILY_MISSION_POOL: Mission[] = [
    { id: 'daily_win_2', type: 'daily', title: 'Win 2 Matches', description: 'Win any 2 matches today', target: 2, xpReward: 150, icon: '🏆' },
    { id: 'daily_play_3', type: 'daily', title: 'Play 3 Games', description: 'Complete 3 matches in any mode', target: 3, xpReward: 100, icon: '🎲' },
    { id: 'daily_capture_3', type: 'daily', title: 'Capture 3 Tokens', description: 'Send 3 opponent tokens home', target: 3, xpReward: 150, icon: '💥' },
    { id: 'daily_finish_4', type: 'daily', title: 'Finish 4 Tokens', description: 'Get 4 tokens to the home column', target: 4, xpReward: 200, icon: '🏠' },
    { id: 'daily_speed', type: 'daily', title: 'Speed Round', description: 'Play a Speed Ludo match', target: 1, xpReward: 100, icon: '⚡' },
    { id: 'daily_roll_6', type: 'daily', title: 'Lucky Sixes', description: 'Roll three 6s in one match', target: 3, xpReward: 200, icon: '🎯' },
];

export const WEEKLY_MISSION_POOL: Mission[] = [
    { id: 'weekly_win_10', type: 'weekly', title: 'Weekly Victor', description: 'Win 10 matches this week', target: 10, xpReward: 750, icon: '🏅' },
    { id: 'weekly_all_modes', type: 'weekly', title: 'Mode Explorer', description: 'Play all 4 game modes', target: 4, xpReward: 500, icon: '🗺️' },
    { id: 'weekly_streak_5', type: 'weekly', title: 'Hot Streak', description: 'Get a 5-game win streak', target: 5, xpReward: 1000, icon: '🔥' },
    { id: 'weekly_capture_20', type: 'weekly', title: 'Capture Frenzy', description: 'Capture 20 opponent tokens', target: 20, xpReward: 750, icon: '⚔️' },
];

export const SEASON_MISSIONS: Mission[] = [
    { id: 'season_wins_50', type: 'season', title: 'Season Champion', description: 'Win 50 matches this season', target: 50, xpReward: 3000, icon: '👑' },
    { id: 'season_gold_rank', type: 'season', title: 'Gold Rush', description: 'Reach Gold rank', target: 1, xpReward: 2000, icon: '🥇' },
    { id: 'season_tokens_100', type: 'season', title: 'Token Master', description: 'Finish 100 tokens', target: 100, xpReward: 2500, icon: '🏠' },
    { id: 'season_fast_win', type: 'season', title: 'Lightning Strike', description: 'Win a match in under 3 minutes', target: 1, xpReward: 5000, icon: '⚡' },
];

// ─── State Management ───────────────────────────────────────────

export function createInitialSeasonState(seasonId: string): SeasonPassState {
    // Select 3 random daily missions
    const dailies = shuffleArray([...DAILY_MISSION_POOL]).slice(0, 3).map(m => m.id);
    // Select 3 random weekly missions
    const weeklies = shuffleArray([...WEEKLY_MISSION_POOL]).slice(0, 3).map(m => m.id);

    const missionProgress: Record<string, MissionProgress> = {};
    for (const id of [...dailies, ...weeklies, ...SEASON_MISSIONS.map(m => m.id)]) {
        missionProgress[id] = { missionId: id, current: 0, completed: false, claimedAt: null };
    }

    return {
        seasonId,
        isPremium: false,
        currentTier: 0,
        currentXP: 0,
        totalXPEarned: 0,
        claimedFreeTiers: [],
        claimedPaidTiers: [],
        missionProgress,
        activeDailyMissions: dailies,
        activeWeeklyMissions: weeklies,
    };
}

/**
 * Add XP and advance tiers.
 */
export function addSeasonXP(
    state: SeasonPassState,
    season: Season,
    xp: number,
): { state: SeasonPassState; tiersAdvanced: number } {
    let newXP = state.currentXP + xp;
    let newTier = state.currentTier;
    let tiersAdvanced = 0;

    while (newXP >= season.xpPerTier && newTier < season.totalTiers) {
        newXP -= season.xpPerTier;
        newTier++;
        tiersAdvanced++;
    }

    // Cap at max tier
    if (newTier >= season.totalTiers) {
        newTier = season.totalTiers;
        newXP = 0;
    }

    return {
        state: {
            ...state,
            currentXP: newXP,
            currentTier: newTier,
            totalXPEarned: state.totalXPEarned + xp,
        },
        tiersAdvanced,
    };
}

/**
 * Claim a tier reward.
 */
export function claimTierReward(
    state: SeasonPassState,
    tier: number,
    track: 'free' | 'paid',
): { state: SeasonPassState; reward: RewardItem } | { error: string } {
    if (tier > state.currentTier) {
        return { error: 'Tier not yet reached' };
    }

    if (track === 'paid' && !state.isPremium) {
        return { error: 'Premium pass required' };
    }

    const claimedList = track === 'free' ? state.claimedFreeTiers : state.claimedPaidTiers;
    if (claimedList.includes(tier)) {
        return { error: 'Already claimed' };
    }

    const tierReward = SEASON_REWARDS.find(r => r.tier === tier);
    if (!tierReward) return { error: 'Invalid tier' };

    const reward = track === 'free' ? tierReward.free : tierReward.paid;
    const newClaimedList = [...claimedList, tier];

    return {
        state: {
            ...state,
            claimedFreeTiers: track === 'free' ? newClaimedList : state.claimedFreeTiers,
            claimedPaidTiers: track === 'paid' ? newClaimedList : state.claimedPaidTiers,
        },
        reward,
    };
}

/**
 * Update mission progress after a game event.
 */
export function updateMissionProgress(
    state: SeasonPassState,
    missionId: string,
    increment: number,
): { state: SeasonPassState; completed: boolean; xpEarned: number } {
    const progress = state.missionProgress[missionId];
    if (!progress || progress.completed) {
        return { state, completed: false, xpEarned: 0 };
    }

    const allMissions = [...DAILY_MISSION_POOL, ...WEEKLY_MISSION_POOL, ...SEASON_MISSIONS];
    const mission = allMissions.find(m => m.id === missionId);
    if (!mission) return { state, completed: false, xpEarned: 0 };

    const newCurrent = Math.min(progress.current + increment, mission.target);
    const justCompleted = newCurrent >= mission.target && !progress.completed;

    const newProgress: MissionProgress = {
        ...progress,
        current: newCurrent,
        completed: justCompleted || progress.completed,
        claimedAt: justCompleted ? Date.now() : progress.claimedAt,
    };

    return {
        state: {
            ...state,
            missionProgress: { ...state.missionProgress, [missionId]: newProgress },
        },
        completed: justCompleted,
        xpEarned: justCompleted ? mission.xpReward : 0,
    };
}

/**
 * Get time remaining in the season.
 */
export function getSeasonTimeRemaining(season: Season): {
    days: number;
    hours: number;
    expired: boolean;
} {
    const remaining = season.endDate - Date.now();
    if (remaining <= 0) return { days: 0, hours: 0, expired: true };
    return {
        days: Math.floor(remaining / (24 * 60 * 60 * 1000)),
        hours: Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
        expired: false,
    };
}

// ─── Helpers ────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
