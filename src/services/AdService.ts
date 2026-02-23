/**
 * Ludo: Legends — Rewarded Ad Service
 * 
 * Opt-in ad placements with anti-abuse cooldowns.
 * Players choose to watch ads — never forced.
 * 
 * Core rule: Max 10 rewarded ads/day, server-validated.
 */

// ─── Types ──────────────────────────────────────────────────────

export type AdPlacement =
    | 'post_match_double'
    | 'free_spin'
    | 'daily_boost'
    | 'tournament_ticket'
    | 'streak_saver';

export interface AdPlacementConfig {
    id: AdPlacement;
    label: string;
    description: string;
    reward: AdReward;
    cooldownMs: number;
    maxPerDay: number;
    icon: string;
}

export type AdReward =
    | { type: 'multiply_coins'; multiplier: number }
    | { type: 'coins'; amount: number }
    | { type: 'spin'; spins: number }
    | { type: 'ticket'; count: number }
    | { type: 'streak_save' };

export interface AdWatchRecord {
    placement: AdPlacement;
    watchedAt: number;
    rewardClaimed: boolean;
}

export interface AdState {
    dailyWatchCount: number;
    lastResetDate: string; // YYYY-MM-DD
    watchHistory: AdWatchRecord[];
    cooldowns: Partial<Record<AdPlacement, number>>; // placement → next available timestamp
}

// ─── Configuration ──────────────────────────────────────────────

const MAX_DAILY_ADS = 10;

export const AD_PLACEMENTS: AdPlacementConfig[] = [
    {
        id: 'post_match_double',
        label: 'Double Rewards',
        description: 'Watch a short ad to double your match coins',
        reward: { type: 'multiply_coins', multiplier: 2 },
        cooldownMs: 0, // Once per match (managed by match lifecycle)
        maxPerDay: 10,
        icon: '💰',
    },
    {
        id: 'free_spin',
        label: 'Lucky Spin',
        description: 'Watch to spin the cosmetic wheel for free',
        reward: { type: 'spin', spins: 1 },
        cooldownMs: 4 * 60 * 60 * 1000, // 4 hours
        maxPerDay: 3,
        icon: '🎰',
    },
    {
        id: 'daily_boost',
        label: 'Daily Coin Boost',
        description: 'Claim 50 bonus coins today',
        reward: { type: 'coins', amount: 50 },
        cooldownMs: 24 * 60 * 60 * 1000, // 24 hours
        maxPerDay: 1,
        icon: '🪙',
    },
    {
        id: 'tournament_ticket',
        label: 'Tournament Entry',
        description: 'Earn a free tournament ticket',
        reward: { type: 'ticket', count: 1 },
        cooldownMs: 8 * 60 * 60 * 1000, // 8 hours
        maxPerDay: 2,
        icon: '🎫',
    },
    {
        id: 'streak_saver',
        label: 'Streak Shield',
        description: 'Protect your win streak from a loss',
        reward: { type: 'streak_save' },
        cooldownMs: 0, // Once per streak (managed by streak lifecycle)
        maxPerDay: 1,
        icon: '🛡️',
    },
];

// ─── Service ────────────────────────────────────────────────────

export function createInitialAdState(): AdState {
    return {
        dailyWatchCount: 0,
        lastResetDate: getTodayDateString(),
        watchHistory: [],
        cooldowns: {},
    };
}

/**
 * Check if a specific ad placement is available right now.
 */
export function isAdAvailable(state: AdState, placement: AdPlacement): {
    available: boolean;
    reason?: string;
    nextAvailableIn?: number;
} {
    // Reset daily count if new day
    const today = getTodayDateString();
    if (state.lastResetDate !== today) {
        state.dailyWatchCount = 0;
        state.lastResetDate = today;
        state.watchHistory = [];
    }

    // Global daily cap
    if (state.dailyWatchCount >= MAX_DAILY_ADS) {
        return { available: false, reason: 'Daily ad limit reached (10/day)' };
    }

    const config = AD_PLACEMENTS.find(p => p.id === placement);
    if (!config) {
        return { available: false, reason: 'Invalid placement' };
    }

    // Per-placement daily cap
    const todayWatches = state.watchHistory.filter(r => r.placement === placement).length;
    if (todayWatches >= config.maxPerDay) {
        return { available: false, reason: `Max ${config.maxPerDay} per day for this reward` };
    }

    // Cooldown check
    const cooldownEnd = state.cooldowns[placement] ?? 0;
    const now = Date.now();
    if (now < cooldownEnd) {
        return {
            available: false,
            reason: 'On cooldown',
            nextAvailableIn: cooldownEnd - now,
        };
    }

    return { available: true };
}

/**
 * Record an ad watch and calculate the reward.
 * Returns the reward to be applied by the Economy Engine.
 */
export function recordAdWatch(state: AdState, placement: AdPlacement): {
    state: AdState;
    reward: AdReward;
} {
    const config = AD_PLACEMENTS.find(p => p.id === placement)!;
    const now = Date.now();

    const newState: AdState = {
        ...state,
        dailyWatchCount: state.dailyWatchCount + 1,
        watchHistory: [
            ...state.watchHistory,
            { placement, watchedAt: now, rewardClaimed: true },
        ],
        cooldowns: {
            ...state.cooldowns,
            [placement]: config.cooldownMs > 0 ? now + config.cooldownMs : 0,
        },
    };

    return { state: newState, reward: config.reward };
}

/**
 * Format remaining cooldown time for display.
 */
export function formatCooldown(ms: number): string {
    if (ms <= 0) return 'Available now';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

/**
 * Get count of remaining ads today.
 */
export function getRemainingAdsToday(state: AdState): number {
    const today = getTodayDateString();
    if (state.lastResetDate !== today) return MAX_DAILY_ADS;
    return Math.max(0, MAX_DAILY_ADS - state.dailyWatchCount);
}

// ─── Helpers ────────────────────────────────────────────────────

function getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}
