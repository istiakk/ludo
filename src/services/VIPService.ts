/**
 * Ludo: Legends — VIP / Legends Pass Service
 * 
 * Premium subscription tier: ad-free, daily gems, exclusive cosmetics,
 * bonus XP/coins, and early access to events.
 * 
 * $4.99/month or $39.99/year (33% discount).
 */

import { getJSON, setJSON } from './StorageService';

// ─── Types ──────────────────────────────────────────────────────

export interface VIPStatus {
    isActive: boolean;
    plan: VIPPlan | null;
    startDate: number | null;
    expiryDate: number | null;
    totalDaysActive: number;
    gemsCollectedToday: boolean;
    streakDays: number;
}

export type VIPPlan = 'monthly' | 'yearly';

export interface VIPBenefit {
    icon: string;
    title: string;
    description: string;
    value: string;
}

export interface VIPPricing {
    plan: VIPPlan;
    label: string;
    price: string;
    pricePerMonth: string;
    savings?: string;
    popular?: boolean;
}

// ─── Constants ──────────────────────────────────────────────────

export const VIP_BENEFITS: VIPBenefit[] = [
    { icon: '🚫', title: 'Ad-Free Experience', description: 'No banner ads, no interstitials, no wait times', value: 'Unlimited' },
    { icon: '💎', title: 'Daily Gems', description: 'Collect 15 gems every day just by logging in', value: '15/day' },
    { icon: '⚡', title: 'XP Boost', description: 'Earn 15% more XP from every match', value: '+15%' },
    { icon: '🪙', title: 'Coin Boost', description: 'Earn 10% more coins from every match', value: '+10%' },
    { icon: '🖼️', title: 'Exclusive Frame', description: 'Animated gold VIP profile frame', value: '1' },
    { icon: '🎲', title: 'VIP Dice Skin', description: 'Premium holographic VIP dice', value: '1' },
    { icon: '🏆', title: 'Tournament Discount', description: '20% off tournament entry fees', value: '-20%' },
    { icon: '📅', title: 'Early Event Access', description: 'Join limited events 2 hours early', value: '2h' },
    { icon: '⭐', title: 'VIP Badge', description: 'Show off your VIP status in matches', value: '1' },
];

export const VIP_PRICING: VIPPricing[] = [
    {
        plan: 'monthly',
        label: 'Monthly',
        price: '$4.99',
        pricePerMonth: '$4.99/mo',
    },
    {
        plan: 'yearly',
        label: 'Yearly',
        price: '$39.99',
        pricePerMonth: '$3.33/mo',
        savings: 'Save 33%',
        popular: true,
    },
];

export const VIP_DAILY_GEMS = 15;
export const VIP_XP_MULTIPLIER = 1.15;
export const VIP_COIN_MULTIPLIER = 1.10;
export const VIP_TOURNAMENT_DISCOUNT = 0.80;

// ─── Storage ────────────────────────────────────────────────────

const KEY = '@ludo:vip_status';

export async function getVIPStatus(): Promise<VIPStatus> {
    const status = await getJSON<VIPStatus>(KEY);
    return status ?? {
        isActive: false,
        plan: null,
        startDate: null,
        expiryDate: null,
        totalDaysActive: 0,
        gemsCollectedToday: false,
        streakDays: 0,
    };
}

export async function saveVIPStatus(status: VIPStatus): Promise<void> {
    return setJSON(KEY, status);
}

// ─── VIP Logic ──────────────────────────────────────────────────

export function isVIPExpired(status: VIPStatus): boolean {
    if (!status.isActive || !status.expiryDate) return true;
    return Date.now() > status.expiryDate;
}

export function activateVIP(plan: VIPPlan): VIPStatus {
    const now = Date.now();
    const durationMs = plan === 'monthly' ? 30 * 24 * 3600000 : 365 * 24 * 3600000;
    return {
        isActive: true,
        plan,
        startDate: now,
        expiryDate: now + durationMs,
        totalDaysActive: 0,
        gemsCollectedToday: false,
        streakDays: 0,
    };
}

export function collectDailyGems(status: VIPStatus): VIPStatus {
    if (!status.isActive || status.gemsCollectedToday) return status;
    return {
        ...status,
        gemsCollectedToday: true,
        streakDays: status.streakDays + 1,
        totalDaysActive: status.totalDaysActive + 1,
    };
}

/**
 * Apply VIP multiplier to match rewards.
 */
export function applyVIPMultipliers(
    baseCoins: number,
    baseXP: number,
    isVIP: boolean,
): { coins: number; xp: number } {
    if (!isVIP) return { coins: baseCoins, xp: baseXP };
    return {
        coins: Math.round(baseCoins * VIP_COIN_MULTIPLIER),
        xp: Math.round(baseXP * VIP_XP_MULTIPLIER),
    };
}

/**
 * Get discounted tournament entry fee for VIP.
 */
export function getVIPTournamentFee(baseFee: number, isVIP: boolean): number {
    if (!isVIP) return baseFee;
    return Math.round(baseFee * VIP_TOURNAMENT_DISCOUNT);
}

// ─── Starter Packs ──────────────────────────────────────────────

export interface StarterPack {
    id: string;
    name: string;
    icon: string;
    originalPrice: string;
    discountedPrice: string;
    discountPercent: number;
    contents: Array<{ type: string; label: string; amount?: number }>;
    expiresIn: string;
    oneTimePurchase: boolean;
}

export const STARTER_PACKS: StarterPack[] = [
    {
        id: 'starter_welcome',
        name: 'Welcome Bundle',
        icon: '🎁',
        originalPrice: '$9.99',
        discountedPrice: '$1.99',
        discountPercent: 80,
        contents: [
            { type: 'coins', label: '5,000 Coins', amount: 5000 },
            { type: 'gems', label: '200 Gems', amount: 200 },
            { type: 'cosmetic', label: 'Crystal Dice Skin' },
            { type: 'cosmetic', label: 'Neon Board Theme' },
        ],
        expiresIn: '48 hours',
        oneTimePurchase: true,
    },
    {
        id: 'starter_competitive',
        name: 'Competitor Pack',
        icon: '⚔️',
        originalPrice: '$14.99',
        discountedPrice: '$4.99',
        discountPercent: 67,
        contents: [
            { type: 'coins', label: '10,000 Coins', amount: 10000 },
            { type: 'gems', label: '500 Gems', amount: 500 },
            { type: 'cosmetic', label: 'Galaxy Dice Skin' },
            { type: 'cosmetic', label: 'Knight Token Skin' },
            { type: 'tournament', label: '3 Free Tournament Entries' },
        ],
        expiresIn: '72 hours',
        oneTimePurchase: true,
    },
];
