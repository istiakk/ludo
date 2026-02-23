/**
 * Ludo: Legends — Progression & Cosmetics Service
 * 
 * Player progression, unlockables, and cosmetics shop.
 * 
 * SME Agent: game-development/game-design, ui-ux-pro-max
 */

export type CosmeticCategory = 'token_skin' | 'dice_style' | 'board_theme' | 'emote' | 'trail_effect';
export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Currency = 'coins' | 'gems';

export interface Cosmetic {
    id: string;
    name: string;
    category: CosmeticCategory;
    rarity: CosmeticRarity;
    icon: string;
    price: { amount: number; currency: Currency };
    unlockRequirement: UnlockRequirement | null;
    description: string;
}

export type UnlockRequirement =
    | { type: 'level'; level: number }
    | { type: 'wins'; count: number }
    | { type: 'captures'; count: number }
    | { type: 'streak'; count: number }
    | { type: 'rank'; tier: string };

export interface PlayerProgression {
    level: number;
    xp: number;
    xpToNextLevel: number;
    totalWins: number;
    totalGames: number;
    coins: number;
    gems: number;
    ownedCosmetics: string[];
    equippedCosmetics: Record<CosmeticCategory, string | null>;
    achievements: Achievement[];
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: number | null;
    progress: number;
    target: number;
}

// ─── XP & Level System ──────────────────────────────────────────

/**
 * XP required for each level follows a gentle curve.
 */
export function xpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.15, level - 1));
}

/**
 * Calculate XP earned from a match.
 */
export function calculateMatchXP(params: {
    won: boolean;
    captures: number;
    tokensFinished: number;
    gameDurationMinutes: number;
    opponentEloDiff: number;
}): number {
    let xp = 0;

    // Base XP
    xp += params.won ? 50 : 20;

    // Performance bonuses
    xp += params.captures * 5;
    xp += params.tokensFinished * 10;

    // Duration bonus (longer games = more XP, capped)
    xp += Math.min(params.gameDurationMinutes * 2, 20);

    // Underdog bonus
    if (params.opponentEloDiff > 100) {
        xp += Math.floor(params.opponentEloDiff / 50) * 5;
    }

    return xp;
}

/**
 * Coin rewards from a match.
 */
export function calculateMatchCoins(params: {
    won: boolean;
    captures: number;
    tokensFinished: number;
}): number {
    let coins = params.won ? 25 : 5;
    coins += params.captures * 3;
    coins += params.tokensFinished * 5;
    return coins;
}

// ─── Shop Catalog ───────────────────────────────────────────────

export const COSMETICS_CATALOG: Cosmetic[] = [
    // Token Skins
    {
        id: 'token_gold',
        name: 'Golden Tokens',
        category: 'token_skin',
        rarity: 'epic',
        icon: '🥇',
        price: { amount: 500, currency: 'coins' },
        unlockRequirement: { type: 'wins', count: 50 },
        description: 'Gleaming gold tokens that reflect your victories.',
    },
    {
        id: 'token_crystal',
        name: 'Crystal Tokens',
        category: 'token_skin',
        rarity: 'legendary',
        icon: '💎',
        price: { amount: 100, currency: 'gems' },
        unlockRequirement: { type: 'rank', tier: 'diamond' },
        description: 'Translucent crystal tokens that shimmer with inner light.',
    },
    {
        id: 'token_flame',
        name: 'Flame Tokens',
        category: 'token_skin',
        rarity: 'epic',
        icon: '🔥',
        price: { amount: 400, currency: 'coins' },
        unlockRequirement: { type: 'streak', count: 10 },
        description: 'Burning hot tokens for players on fire.',
    },
    {
        id: 'token_ice',
        name: 'Frost Tokens',
        category: 'token_skin',
        rarity: 'rare',
        icon: '❄️',
        price: { amount: 200, currency: 'coins' },
        unlockRequirement: null,
        description: 'Cool, calm, and collected — ice-blue elegance.',
    },

    // Dice Styles
    {
        id: 'dice_neon',
        name: 'Neon Dice',
        category: 'dice_style',
        rarity: 'rare',
        icon: '🌈',
        price: { amount: 150, currency: 'coins' },
        unlockRequirement: null,
        description: 'Glowing neon dice that light up the board.',
    },
    {
        id: 'dice_galaxy',
        name: 'Galaxy Dice',
        category: 'dice_style',
        rarity: 'legendary',
        icon: '🌌',
        price: { amount: 150, currency: 'gems' },
        unlockRequirement: { type: 'level', level: 30 },
        description: 'Cosmic dice with swirling nebula patterns.',
    },

    // Board Themes
    {
        id: 'board_ocean',
        name: 'Ocean Board',
        category: 'board_theme',
        rarity: 'epic',
        icon: '🌊',
        price: { amount: 300, currency: 'coins' },
        unlockRequirement: { type: 'wins', count: 100 },
        description: 'Deep blue ocean theme with wave animations.',
    },
    {
        id: 'board_forest',
        name: 'Enchanted Forest',
        category: 'board_theme',
        rarity: 'rare',
        icon: '🌿',
        price: { amount: 200, currency: 'coins' },
        unlockRequirement: null,
        description: 'Mystical forest board with firefly particles.',
    },

    // Emotes
    {
        id: 'emote_crown',
        name: 'Victory Crown',
        category: 'emote',
        rarity: 'rare',
        icon: '👑',
        price: { amount: 100, currency: 'coins' },
        unlockRequirement: null,
        description: 'Show them who rules the board.',
    },
    {
        id: 'emote_rocket',
        name: 'Blast Off',
        category: 'emote',
        rarity: 'common',
        icon: '🚀',
        price: { amount: 50, currency: 'coins' },
        unlockRequirement: null,
        description: 'Celebrate a power move with a rocket launch.',
    },

    // Trail Effects
    {
        id: 'trail_sparkle',
        name: 'Sparkle Trail',
        category: 'trail_effect',
        rarity: 'epic',
        icon: '✨',
        price: { amount: 350, currency: 'coins' },
        unlockRequirement: { type: 'captures', count: 200 },
        description: 'Leave a trail of sparkles as your tokens move.',
    },
    {
        id: 'trail_shadow',
        name: 'Shadow Trail',
        category: 'trail_effect',
        rarity: 'legendary',
        icon: '🖤',
        price: { amount: 200, currency: 'gems' },
        unlockRequirement: { type: 'rank', tier: 'legend' },
        description: 'Dark, mysterious trail for the elite.',
    },
];

// ─── Achievements ───────────────────────────────────────────────

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
    { id: 'first_win', name: 'First Blood', description: 'Win your first match', icon: '🏆', target: 1 },
    { id: 'ten_wins', name: 'Rising Star', description: 'Win 10 matches', icon: '⭐', target: 10 },
    { id: 'fifty_wins', name: 'Veteran', description: 'Win 50 matches', icon: '🎖️', target: 50 },
    { id: 'hundred_wins', name: 'Legend', description: 'Win 100 matches', icon: '👑', target: 100 },
    { id: 'capture_master', name: 'Capture Master', description: 'Capture 100 opponent tokens', icon: '💥', target: 100 },
    { id: 'hot_streak', name: 'On Fire', description: 'Win 5 games in a row', icon: '🔥', target: 5 },
    { id: 'underdog', name: 'Giant Killer', description: 'Beat a player 200+ ELO above you', icon: '🗡️', target: 1 },
    { id: 'perfect_game', name: 'Flawless', description: 'Finish all 4 tokens without losing any', icon: '💎', target: 1 },
    { id: 'speed_demon', name: 'Speed Demon', description: 'Win a game in under 3 minutes', icon: '⚡', target: 1 },
    { id: 'social_butterfly', name: 'Social Butterfly', description: 'Add 10 friends', icon: '🦋', target: 10 },
];
