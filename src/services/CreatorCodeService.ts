/**
 * Ludo: Legends — Creator Code System
 * 
 * Revenue-sharing for creators: fans enter a creator code when
 * buying cosmetics, and the creator earns a commission.
 * 
 * This drives organic growth (creators promote the game)
 * AND revenue (fans buy more to support their creator).
 */

// ─── Types ──────────────────────────────────────────────────────

export interface CreatorProfile {
    code: string;              // Unique alphanumeric code (e.g., "NINJA", "LUDO_KING")
    displayName: string;
    avatar: string | null;
    socialLinks: {
        youtube?: string;
        tiktok?: string;
        instagram?: string;
        twitter?: string;
    };
    tier: CreatorTier;
    commissionRate: number;    // 5-15% depending on tier
    totalEarnings: number;     // Lifetime earnings in $$
    totalSales: number;        // Number of sales attributed
    activeUsers: number;       // Fans currently using this code
    createdAt: number;
    isActive: boolean;
}

export type CreatorTier =
    | 'starter'     // 0-49 sales → 5% commission
    | 'partner'     // 50-199 sales → 8% commission
    | 'ambassador'  // 200-999 sales → 10% commission
    | 'legend';     // 1000+ sales → 15% commission

export interface CreatorSale {
    id: string;
    creatorCode: string;
    buyerPlayerId: string;
    productId: string;
    productPrice: number;     // In real money
    commission: number;       // Creator's cut
    currency: 'gems' | 'usd';
    timestamp: number;
}

export interface FanBonus {
    type: 'discount' | 'bonus_gems' | 'exclusive_cosmetic';
    value: number;
    description: string;
}

export interface ActiveCreatorCode {
    code: string;
    creatorName: string;
    appliedAt: number;
    expiresAt: number; // Codes stay active for 14 days
}

// ─── Constants ──────────────────────────────────────────────────

const CREATOR_CODE_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const CODE_PATTERN = /^[A-Z0-9_]{3,16}$/;

const TIER_CONFIG: Record<CreatorTier, {
    minSales: number;
    commissionRate: number;
    perks: string[];
}> = {
    starter: {
        minSales: 0,
        commissionRate: 0.05,
        perks: ['Basic analytics', '5% commission'],
    },
    partner: {
        minSales: 50,
        commissionRate: 0.08,
        perks: ['Detailed analytics', '8% commission', 'Custom creator badge'],
    },
    ambassador: {
        minSales: 200,
        commissionRate: 0.10,
        perks: ['Priority support', '10% commission', 'Exclusive cosmetics', 'Early access'],
    },
    legend: {
        minSales: 1000,
        commissionRate: 0.15,
        perks: ['15% commission', 'Co-branded cosmetics', 'Feature promotion', 'Revenue dashboard'],
    },
};

// ─── Fan-Side Functions ─────────────────────────────────────────

/**
 * Validate a creator code format.
 */
export function isValidCreatorCode(code: string): boolean {
    return CODE_PATTERN.test(code.toUpperCase());
}

/**
 * Apply a creator code. Returns the active code state.
 */
export function applyCreatorCode(code: string, creatorName: string): ActiveCreatorCode {
    const now = Date.now();
    return {
        code: code.toUpperCase(),
        creatorName,
        appliedAt: now,
        expiresAt: now + CREATOR_CODE_EXPIRY_MS,
    };
}

/**
 * Check if the active creator code is still valid.
 */
export function isCreatorCodeActive(activeCode: ActiveCreatorCode | null): boolean {
    if (!activeCode) return false;
    return Date.now() < activeCode.expiresAt;
}

/**
 * Get the fan bonus for using a creator code on a purchase.
 */
export function getFanBonus(purchase: { priceInGems: number }): FanBonus {
    // Fans get 5% bonus gems for supporting a creator
    const bonusGems = Math.ceil(purchase.priceInGems * 0.05);
    return {
        type: 'bonus_gems',
        value: bonusGems,
        description: `+${bonusGems} bonus gems for supporting your creator!`,
    };
}

// ─── Creator-Side Functions ─────────────────────────────────────

/**
 * Calculate a creator's current tier based on total sales.
 */
export function getCreatorTier(totalSales: number): CreatorTier {
    if (totalSales >= 1000) return 'legend';
    if (totalSales >= 200) return 'ambassador';
    if (totalSales >= 50) return 'partner';
    return 'starter';
}

/**
 * Get the commission rate for a creator tier.
 */
export function getCommissionRate(tier: CreatorTier): number {
    return TIER_CONFIG[tier].commissionRate;
}

/**
 * Get tier perks for display.
 */
export function getTierPerks(tier: CreatorTier): string[] {
    return TIER_CONFIG[tier].perks;
}

/**
 * Get progress to next tier.
 */
export function getTierProgress(totalSales: number): {
    currentTier: CreatorTier;
    nextTier: CreatorTier | null;
    salesNeeded: number;
    progressPercent: number;
} {
    const currentTier = getCreatorTier(totalSales);

    const tiers: CreatorTier[] = ['starter', 'partner', 'ambassador', 'legend'];
    const currentIdx = tiers.indexOf(currentTier);
    const nextTier = currentIdx < tiers.length - 1 ? tiers[currentIdx + 1] : null;

    if (!nextTier) {
        return { currentTier, nextTier: null, salesNeeded: 0, progressPercent: 100 };
    }

    const currentMin = TIER_CONFIG[currentTier].minSales;
    const nextMin = TIER_CONFIG[nextTier].minSales;
    const salesNeeded = nextMin - totalSales;
    const progressPercent = Math.min(
        100,
        Math.floor(((totalSales - currentMin) / (nextMin - currentMin)) * 100),
    );

    return { currentTier, nextTier, salesNeeded, progressPercent };
}

/**
 * Process a sale with creator code attribution.
 */
export function processCreatorSale(
    creatorCode: string,
    buyerPlayerId: string,
    productId: string,
    productPriceUSD: number,
    creatorTier: CreatorTier,
): CreatorSale {
    const commission = productPriceUSD * getCommissionRate(creatorTier);

    return {
        id: `csale_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        creatorCode,
        buyerPlayerId,
        productId,
        productPrice: productPriceUSD,
        commission: Math.round(commission * 100) / 100,
        currency: 'usd',
        timestamp: Date.now(),
    };
}

// ─── Creator Code Registry (Sample Data) ────────────────────────

/**
 * Sample creator codes for testing.
 * In production, these would come from a backend API.
 */
export const SAMPLE_CREATORS: CreatorProfile[] = [
    {
        code: 'LUDO_KING',
        displayName: 'Ludo King',
        avatar: null,
        socialLinks: { youtube: 'youtube.com/@ludoking', tiktok: 'tiktok.com/@ludoking' },
        tier: 'ambassador',
        commissionRate: 0.10,
        totalEarnings: 450.00,
        totalSales: 312,
        activeUsers: 1_250,
        createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
        isActive: true,
    },
    {
        code: 'DICE_QUEEN',
        displayName: 'DiceQueen',
        avatar: null,
        socialLinks: { instagram: 'instagram.com/dicequeen', twitter: 'twitter.com/dicequeen' },
        tier: 'partner',
        commissionRate: 0.08,
        totalEarnings: 89.50,
        totalSales: 72,
        activeUsers: 340,
        createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
        isActive: true,
    },
];

/**
 * Look up a creator code (simulated).
 */
export function lookupCreatorCode(code: string): CreatorProfile | null {
    return SAMPLE_CREATORS.find(c => c.code === code.toUpperCase() && c.isActive) ?? null;
}

/**
 * Format commission for display.
 */
export function formatCommission(rate: number): string {
    return `${Math.round(rate * 100)}%`;
}

/**
 * Format creator code expiry for display.
 */
export function formatCodeExpiry(expiresAt: number): string {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return 'Expired';
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} left`;
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    return `${hours} hour${hours === 1 ? '' : 's'} left`;
}
