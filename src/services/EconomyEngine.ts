/**
 * Ludo: Legends — Economy Engine
 * 
 * Dual-currency system with transaction processing,
 * loot box probabilities, daily login rewards, and spin wheel.
 * 
 * Core rule: Coins earned free, gems are premium. No coin→gem conversion.
 */

import { CosmeticRarity, Currency } from './ProgressionService';

// ─── Types ──────────────────────────────────────────────────────

export interface Wallet {
    coins: number;
    gems: number;
}

export type TransactionType =
    | 'match_reward'
    | 'ad_reward'
    | 'daily_login'
    | 'achievement'
    | 'season_pass'
    | 'purchase_cosmetic'
    | 'iap_purchase'
    | 'spin_reward'
    | 'streak_bonus';

export interface Transaction {
    id: string;
    type: TransactionType;
    currency: Currency;
    amount: number; // positive = earn, negative = spend
    description: string;
    timestamp: number;
    balanceAfter: Wallet;
}

export interface DailyLoginReward {
    day: number; // 1-7
    reward: { currency: Currency; amount: number };
    bonusItem?: string; // cosmetic id for day 7
    icon: string;
}

export interface SpinResult {
    rarity: CosmeticRarity;
    cosmeticId: string;
    cosmeticName: string;
    icon: string;
}

// ─── Constants ──────────────────────────────────────────────────

/**
 * 7-day login reward calendar. Resets weekly.
 */
export const DAILY_LOGIN_REWARDS: DailyLoginReward[] = [
    { day: 1, reward: { currency: 'coins', amount: 25 }, icon: '📦' },
    { day: 2, reward: { currency: 'coins', amount: 50 }, icon: '📦' },
    { day: 3, reward: { currency: 'coins', amount: 75 }, icon: '🎁' },
    { day: 4, reward: { currency: 'coins', amount: 100 }, icon: '🎁' },
    { day: 5, reward: { currency: 'gems', amount: 3 }, icon: '💎' },
    { day: 6, reward: { currency: 'coins', amount: 150 }, icon: '🎁' },
    { day: 7, reward: { currency: 'gems', amount: 10 }, bonusItem: 'emote_rocket', icon: '🏆' },
];

/**
 * Spin wheel rarity probabilities.
 */
const SPIN_PROBABILITIES: { rarity: CosmeticRarity; chance: number }[] = [
    { rarity: 'common', chance: 0.45 },
    { rarity: 'rare', chance: 0.30 },
    { rarity: 'epic', chance: 0.18 },
    { rarity: 'legendary', chance: 0.07 },
];

/**
 * Streak bonus multiplier.
 */
const STREAK_MULTIPLIERS: Record<number, number> = {
    3: 1.25,   // 3-win streak → +25%
    5: 1.50,   // 5-win streak → +50%
    7: 1.75,   // 7-win streak → +75%
    10: 2.00,  // 10-win streak → 2×
};

// ─── Wallet Operations ──────────────────────────────────────────

export function createInitialWallet(): Wallet {
    return { coins: 100, gems: 5 }; // Welcome bonus
}

/**
 * Check if wallet has enough currency for a purchase.
 */
export function canAfford(wallet: Wallet, currency: Currency, amount: number): boolean {
    return wallet[currency] >= amount;
}

/**
 * Process a transaction: earn or spend currency.
 * Returns updated wallet and transaction record, or error.
 */
export function processTransaction(
    wallet: Wallet,
    type: TransactionType,
    currency: Currency,
    amount: number,
    description: string,
): { wallet: Wallet; transaction: Transaction } | { error: string } {
    const newBalance = wallet[currency] + amount;

    // Prevent negative balance
    if (newBalance < 0) {
        return { error: `Insufficient ${currency}: need ${Math.abs(amount)}, have ${wallet[currency]}` };
    }

    const newWallet: Wallet = {
        ...wallet,
        [currency]: newBalance,
    };

    const transaction: Transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        currency,
        amount,
        description,
        timestamp: Date.now(),
        balanceAfter: { ...newWallet },
    };

    return { wallet: newWallet, transaction };
}

// ─── Daily Login ────────────────────────────────────────────────

export interface LoginStreakState {
    currentDay: number; // 1-7
    lastClaimDate: string; // YYYY-MM-DD
    consecutiveDays: number;
}

export function createInitialLoginStreak(): LoginStreakState {
    return {
        currentDay: 0,
        lastClaimDate: '',
        consecutiveDays: 0,
    };
}

/**
 * Check if today's login reward is available.
 */
export function canClaimDailyReward(state: LoginStreakState): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return state.lastClaimDate !== today;
}

/**
 * Claim the daily login reward. Advances the cycle.
 */
export function claimDailyReward(state: LoginStreakState): {
    state: LoginStreakState;
    reward: DailyLoginReward;
    streakBonus: number; // extra coin multiplier
} {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const isConsecutive = state.lastClaimDate === yesterday || state.lastClaimDate === '';
    const newConsecutiveDays = isConsecutive ? state.consecutiveDays + 1 : 1;
    const newDay = (state.currentDay % 7) + 1; // Cycle 1-7

    const reward = DAILY_LOGIN_REWARDS[newDay - 1];
    const streakBonus = getStreakMultiplier(newConsecutiveDays);

    const newState: LoginStreakState = {
        currentDay: newDay,
        lastClaimDate: today,
        consecutiveDays: newConsecutiveDays,
    };

    return { state: newState, reward, streakBonus };
}

// ─── Spin Wheel ─────────────────────────────────────────────────

/**
 * Determine the rarity outcome of a spin.
 */
export function spinWheel(): CosmeticRarity {
    const roll = Math.random();
    let cumulative = 0;

    for (const { rarity, chance } of SPIN_PROBABILITIES) {
        cumulative += chance;
        if (roll <= cumulative) return rarity;
    }

    return 'common'; // fallback
}

/**
 * Get display-friendly spin probabilities.
 */
export function getSpinProbabilities(): { rarity: CosmeticRarity; percentage: string }[] {
    return SPIN_PROBABILITIES.map(({ rarity, chance }) => ({
        rarity,
        percentage: `${(chance * 100).toFixed(0)}%`,
    }));
}

// ─── Streak Bonus ───────────────────────────────────────────────

/**
 * Get the coin multiplier for a given win streak.
 */
export function getStreakMultiplier(streakLength: number): number {
    let bestMultiplier = 1.0;
    for (const [threshold, multiplier] of Object.entries(STREAK_MULTIPLIERS)) {
        if (streakLength >= Number(threshold)) {
            bestMultiplier = multiplier;
        }
    }
    return bestMultiplier;
}

/**
 * Apply streak bonus to base coins.
 */
export function applyStreakBonus(baseCoins: number, streakLength: number): {
    total: number;
    bonus: number;
    multiplier: number;
} {
    const multiplier = getStreakMultiplier(streakLength);
    const total = Math.floor(baseCoins * multiplier);
    return {
        total,
        bonus: total - baseCoins,
        multiplier,
    };
}
