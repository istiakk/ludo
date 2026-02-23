/**
 * Ludo: Legends — In-App Purchase Service
 * 
 * IAP product definitions, purchase flow, and receipt validation.
 * Supports gem bundles, season pass, and ad-free purchase.
 * 
 * NOTE: Actual payment processing requires expo-iap or
 * react-native-iap on device. This module defines the
 * product catalog and validation logic.
 */

// ─── Types ──────────────────────────────────────────────────────

export type IAPProductType = 'consumable' | 'non_consumable' | 'subscription';

export interface IAPProduct {
    id: string;
    name: string;
    description: string;
    price: string; // Display price (e.g., "$4.99")
    priceAmount: number; // Numeric (e.g., 4.99)
    type: IAPProductType;
    icon: string;
    gemsAwarded?: number;
    bonusPercentage?: number;
    isBestValue?: boolean;
    tag?: string;
}

export interface PurchaseReceipt {
    productId: string;
    transactionId: string;
    platform: 'ios' | 'android';
    receiptData: string;
    purchasedAt: number;
    verified: boolean;
}

export interface PurchaseHistory {
    receipts: PurchaseReceipt[];
    totalSpent: number;
    isAdFree: boolean;
    hasSeasonPass: boolean;
}

// ─── Product Catalog ────────────────────────────────────────────

export const GEM_BUNDLES: IAPProduct[] = [
    {
        id: 'gems_starter',
        name: 'Starter Pack',
        description: '50 Gems',
        price: '$0.99',
        priceAmount: 0.99,
        type: 'consumable',
        icon: '💎',
        gemsAwarded: 50,
    },
    {
        id: 'gems_popular',
        name: 'Popular Pack',
        description: '300 Gems + 10% bonus',
        price: '$4.99',
        priceAmount: 4.99,
        type: 'consumable',
        icon: '💎',
        gemsAwarded: 330,
        bonusPercentage: 10,
        tag: 'POPULAR',
    },
    {
        id: 'gems_value',
        name: 'Value Pack',
        description: '700 Gems + 17% bonus',
        price: '$9.99',
        priceAmount: 9.99,
        type: 'consumable',
        icon: '💎',
        gemsAwarded: 819,
        bonusPercentage: 17,
        isBestValue: true,
        tag: 'BEST VALUE',
    },
    {
        id: 'gems_pro',
        name: 'Pro Pack',
        description: '1,500 Gems + 25% bonus',
        price: '$19.99',
        priceAmount: 19.99,
        type: 'consumable',
        icon: '💎',
        gemsAwarded: 1875,
        bonusPercentage: 25,
    },
    {
        id: 'gems_legend',
        name: 'Legend Pack',
        description: '4,000 Gems + 33% bonus',
        price: '$49.99',
        priceAmount: 49.99,
        type: 'consumable',
        icon: '💎',
        gemsAwarded: 5320,
        bonusPercentage: 33,
        tag: 'LEGEND',
    },
];

export const SPECIAL_PRODUCTS: IAPProduct[] = [
    {
        id: 'season_pass',
        name: 'Season Pass',
        description: 'Unlock premium rewards for 30 days',
        price: '$4.99',
        priceAmount: 4.99,
        type: 'non_consumable',
        icon: '⭐',
        tag: 'SEASON',
    },
    {
        id: 'ad_free',
        name: 'Ad-Free Forever',
        description: 'Remove all ad prompts permanently',
        price: '$2.99',
        priceAmount: 2.99,
        type: 'non_consumable',
        icon: '🚫',
    },
    {
        id: 'starter_bundle',
        name: 'New Player Bundle',
        description: '200 Gems + 500 Coins + Rare Dice Skin',
        price: '$1.99',
        priceAmount: 1.99,
        type: 'non_consumable',
        icon: '🎁',
        gemsAwarded: 200,
        tag: 'LIMITED',
    },
];

export const ALL_PRODUCTS: IAPProduct[] = [...GEM_BUNDLES, ...SPECIAL_PRODUCTS];

// ─── Purchase Flow ──────────────────────────────────────────────

export function createInitialPurchaseHistory(): PurchaseHistory {
    return {
        receipts: [],
        totalSpent: 0,
        isAdFree: false,
        hasSeasonPass: false,
    };
}

/**
 * Validate a product ID exists in our catalog.
 */
export function getProduct(productId: string): IAPProduct | null {
    return ALL_PRODUCTS.find(p => p.id === productId) ?? null;
}

/**
 * Process a verified purchase.
 * Returns the updated purchase history and gems to credit.
 */
export function processPurchase(
    history: PurchaseHistory,
    receipt: PurchaseReceipt,
): {
    history: PurchaseHistory;
    gemsToCredit: number;
    coinsToCredit: number;
    specialEffects: string[];
} {
    const product = getProduct(receipt.productId);
    if (!product) {
        return { history, gemsToCredit: 0, coinsToCredit: 0, specialEffects: [] };
    }

    // Prevent duplicate purchases for non-consumables
    if (product.type === 'non_consumable') {
        const alreadyPurchased = history.receipts.some(r => r.productId === receipt.productId);
        if (alreadyPurchased) {
            return { history, gemsToCredit: 0, coinsToCredit: 0, specialEffects: ['already_owned'] };
        }
    }

    const newHistory: PurchaseHistory = {
        receipts: [...history.receipts, receipt],
        totalSpent: history.totalSpent + product.priceAmount,
        isAdFree: history.isAdFree || receipt.productId === 'ad_free',
        hasSeasonPass: history.hasSeasonPass || receipt.productId === 'season_pass',
    };

    const specialEffects: string[] = [];
    let coinsToCredit = 0;

    if (receipt.productId === 'ad_free') specialEffects.push('ads_removed');
    if (receipt.productId === 'season_pass') specialEffects.push('season_pass_activated');
    if (receipt.productId === 'starter_bundle') {
        coinsToCredit = 500;
        specialEffects.push('unlock_dice_neon');
    }

    return {
        history: newHistory,
        gemsToCredit: product.gemsAwarded ?? 0,
        coinsToCredit,
        specialEffects,
    };
}

/**
 * Check if a specific product has been purchased (non-consumable).
 */
export function hasPurchased(history: PurchaseHistory, productId: string): boolean {
    return history.receipts.some(r => r.productId === productId && r.verified);
}

/**
 * Restore previous purchases (called on reinstall or new device).
 */
export function restorePurchases(
    history: PurchaseHistory,
    receipts: PurchaseReceipt[],
): PurchaseHistory {
    const nonConsumableReceipts = receipts.filter(r => {
        const product = getProduct(r.productId);
        return product && product.type === 'non_consumable';
    });

    return {
        ...history,
        receipts: [...history.receipts, ...nonConsumableReceipts],
        isAdFree: nonConsumableReceipts.some(r => r.productId === 'ad_free') || history.isAdFree,
        hasSeasonPass: nonConsumableReceipts.some(r => r.productId === 'season_pass') || history.hasSeasonPass,
    };
}

/**
 * Get the player's spending tier for analytics.
 */
export function getSpenderTier(totalSpent: number): 'free' | 'minnow' | 'dolphin' | 'whale' {
    if (totalSpent === 0) return 'free';
    if (totalSpent < 10) return 'minnow';
    if (totalSpent < 50) return 'dolphin';
    return 'whale';
}
