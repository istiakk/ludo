/**
 * Ludo: Legends — Cosmetics 2.0 Catalog
 * 
 * Comprehensive cosmetic items covering board themes, dice skins,
 * token skins, victory animations, emotes, player titles, and profile frames.
 * All cosmetics are VISUAL ONLY — zero gameplay advantage.
 */

// ─── Types ──────────────────────────────────────────────────────

export type CosmeticCategory =
    | 'board_theme'
    | 'dice_skin'
    | 'token_skin'
    | 'victory_animation'
    | 'emote'
    | 'player_title'
    | 'profile_frame';

export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CosmeticItem {
    id: string;
    category: CosmeticCategory;
    name: string;
    description: string;
    icon: string;
    rarity: CosmeticRarity;
    price: { currency: 'coins' | 'gems'; amount: number };
    season?: string;       // Seasonal exclusive
    unlockCondition?: string; // Achievement unlock
}

// ─── Rarity Colors ──────────────────────────────────────────────

export const RARITY_COLORS: Record<CosmeticRarity, string> = {
    common: '#8B949E',
    rare: '#58A6FF',
    epic: '#A855F7',
    legendary: '#FFD700',
};

// ─── Board Themes ───────────────────────────────────────────────

export const BOARD_THEMES: CosmeticItem[] = [
    { id: 'theme_classic', category: 'board_theme', name: 'Classic', description: 'The original Ludo board', icon: '🎲', rarity: 'common', price: { currency: 'coins', amount: 0 } },
    { id: 'theme_wood', category: 'board_theme', name: 'Polished Wood', description: 'Warm oak finish with brass accents', icon: '🪵', rarity: 'common', price: { currency: 'coins', amount: 500 } },
    { id: 'theme_neon', category: 'board_theme', name: 'Neon Nights', description: 'Glowing neon on a dark grid', icon: '🌃', rarity: 'rare', price: { currency: 'coins', amount: 1500 } },
    { id: 'theme_egyptian', category: 'board_theme', name: 'Egyptian Temple', description: 'Golden hieroglyphs and sandstone', icon: '🏛️', rarity: 'rare', price: { currency: 'coins', amount: 1500 } },
    { id: 'theme_candy', category: 'board_theme', name: 'Candy Land', description: 'Sweet pastel colors and frosting', icon: '🍬', rarity: 'rare', price: { currency: 'coins', amount: 1500 } },
    { id: 'theme_space', category: 'board_theme', name: 'Deep Space', description: 'Cosmic nebula with star particles', icon: '🌌', rarity: 'epic', price: { currency: 'gems', amount: 200 } },
    { id: 'theme_royal', category: 'board_theme', name: 'Royal Palace', description: 'Marble and gold filigree', icon: '👑', rarity: 'epic', price: { currency: 'gems', amount: 300 } },
    { id: 'theme_underwater', category: 'board_theme', name: 'Ocean Floor', description: 'Coral reefs and bioluminescence', icon: '🌊', rarity: 'epic', price: { currency: 'gems', amount: 250 } },
    { id: 'theme_steampunk', category: 'board_theme', name: 'Steampunk', description: 'Brass gears and copper pipes', icon: '⚙️', rarity: 'epic', price: { currency: 'gems', amount: 300 } },
    { id: 'theme_cherry', category: 'board_theme', name: 'Cherry Blossom', description: 'Falling petals on pale pink', icon: '🌸', rarity: 'legendary', price: { currency: 'gems', amount: 500 }, season: 'spring' },
    { id: 'theme_aurora', category: 'board_theme', name: 'Northern Lights', description: 'Shimmering aurora on ice', icon: '🌌', rarity: 'legendary', price: { currency: 'gems', amount: 500 }, season: 'winter' },
    { id: 'theme_diamond', category: 'board_theme', name: 'Diamond Edition', description: 'Crystal-cut facets with prismatic light', icon: '💎', rarity: 'legendary', price: { currency: 'gems', amount: 800 } },
];

// ─── Dice Skins ─────────────────────────────────────────────────

export const DICE_SKINS: CosmeticItem[] = [
    { id: 'dice_default', category: 'dice_skin', name: 'Standard', description: 'Classic white dice', icon: '🎲', rarity: 'common', price: { currency: 'coins', amount: 0 } },
    { id: 'dice_crystal', category: 'dice_skin', name: 'Crystal Clear', description: 'Transparent with visible pips', icon: '🔮', rarity: 'rare', price: { currency: 'coins', amount: 800 } },
    { id: 'dice_fire', category: 'dice_skin', name: 'Inferno', description: 'Burning ember dice', icon: '🔥', rarity: 'rare', price: { currency: 'coins', amount: 1000 } },
    { id: 'dice_ice', category: 'dice_skin', name: 'Frozen', description: 'Ice crystal with frost particles', icon: '❄️', rarity: 'rare', price: { currency: 'coins', amount: 1000 } },
    { id: 'dice_galaxy', category: 'dice_skin', name: 'Galaxy', description: 'Swirling stars and cosmic dust', icon: '✨', rarity: 'epic', price: { currency: 'gems', amount: 150 } },
    { id: 'dice_rainbow', category: 'dice_skin', name: 'Prism', description: 'Color-shifting rainbow holographic', icon: '🌈', rarity: 'epic', price: { currency: 'gems', amount: 200 } },
    { id: 'dice_gold', category: 'dice_skin', name: 'Pure Gold', description: '24k gold with diamond pips', icon: '🥇', rarity: 'epic', price: { currency: 'gems', amount: 250 } },
    { id: 'dice_lava', category: 'dice_skin', name: 'Molten Lava', description: 'Cracked obsidian with glowing magma', icon: '🌋', rarity: 'epic', price: { currency: 'gems', amount: 200 } },
    { id: 'dice_neon_pink', category: 'dice_skin', name: 'Neon Pink', description: 'Hot pink glow in the dark', icon: '💗', rarity: 'rare', price: { currency: 'coins', amount: 1200 } },
    { id: 'dice_thunder', category: 'dice_skin', name: 'Thunderstrike', description: 'Lightning crackles on impact', icon: '⚡', rarity: 'legendary', price: { currency: 'gems', amount: 500 } },
    { id: 'dice_dragon', category: 'dice_skin', name: 'Dragon Scale', description: 'Iridescent dragon scale texture', icon: '🐉', rarity: 'legendary', price: { currency: 'gems', amount: 600 } },
    { id: 'dice_void', category: 'dice_skin', name: 'Void', description: 'Pure darkness with glowing numbers', icon: '🕳️', rarity: 'legendary', price: { currency: 'gems', amount: 500 } },
];

// ─── Token Skins ────────────────────────────────────────────────

export const TOKEN_SKINS: CosmeticItem[] = [
    { id: 'token_default', category: 'token_skin', name: 'Classic Token', description: 'Standard playing piece', icon: '🔵', rarity: 'common', price: { currency: 'coins', amount: 0 } },
    { id: 'token_metallic', category: 'token_skin', name: 'Metallic', description: 'Chrome-plated finish', icon: '🪙', rarity: 'rare', price: { currency: 'coins', amount: 800 } },
    { id: 'token_glass', category: 'token_skin', name: 'Crystal Glass', description: 'Transparent with light refraction', icon: '💠', rarity: 'rare', price: { currency: 'coins', amount: 1000 } },
    { id: 'token_knight', category: 'token_skin', name: 'Knight', description: 'Chess knight piece, regal posture', icon: '♞', rarity: 'epic', price: { currency: 'gems', amount: 200 } },
    { id: 'token_robot', category: 'token_skin', name: 'Mini Robot', description: 'Adorable walking robot', icon: '🤖', rarity: 'epic', price: { currency: 'gems', amount: 250 } },
    { id: 'token_animal_cat', category: 'token_skin', name: 'Lucky Cat', description: 'Maneki-neko fortune cat', icon: '🐱', rarity: 'rare', price: { currency: 'coins', amount: 1200 } },
    { id: 'token_animal_dragon', category: 'token_skin', name: 'Baby Dragon', description: 'Tiny fire-breathing companion', icon: '🐲', rarity: 'legendary', price: { currency: 'gems', amount: 500 } },
    { id: 'token_gem_ruby', category: 'token_skin', name: 'Ruby', description: 'Faceted precious gemstone', icon: '💎', rarity: 'epic', price: { currency: 'gems', amount: 300 } },
    { id: 'token_crown', category: 'token_skin', name: 'Royal Crown', description: 'Golden crown with jewels', icon: '👑', rarity: 'legendary', price: { currency: 'gems', amount: 600 } },
    { id: 'token_ghost', category: 'token_skin', name: 'Ghost', description: 'Semi-transparent floating spirit', icon: '👻', rarity: 'rare', price: { currency: 'coins', amount: 900 }, season: 'halloween' },
];

// ─── Victory Animations ─────────────────────────────────────────

export const VICTORY_ANIMATIONS: CosmeticItem[] = [
    { id: 'victory_confetti', category: 'victory_animation', name: 'Confetti Burst', description: 'Colorful confetti explosion', icon: '🎉', rarity: 'common', price: { currency: 'coins', amount: 0 } },
    { id: 'victory_fireworks', category: 'victory_animation', name: 'Fireworks', description: 'Dazzling sky fireworks', icon: '🎆', rarity: 'rare', price: { currency: 'coins', amount: 1000 } },
    { id: 'victory_disco', category: 'victory_animation', name: 'Disco Party', description: 'Strobe lights and dance floor', icon: '🕺', rarity: 'rare', price: { currency: 'coins', amount: 1200 } },
    { id: 'victory_lightning', category: 'victory_animation', name: 'Lightning Storm', description: 'Thunder and lightning strikes', icon: '⚡', rarity: 'epic', price: { currency: 'gems', amount: 200 } },
    { id: 'victory_aurora', category: 'victory_animation', name: 'Aurora Wave', description: 'Northern lights sweep', icon: '🌌', rarity: 'epic', price: { currency: 'gems', amount: 250 } },
    { id: 'victory_dragon_fire', category: 'victory_animation', name: 'Dragon Fire', description: 'Dragon breathes fire across screen', icon: '🐉', rarity: 'legendary', price: { currency: 'gems', amount: 500 } },
    { id: 'victory_golden_rain', category: 'victory_animation', name: 'Golden Rain', description: 'Coins and gems rain from above', icon: '💰', rarity: 'legendary', price: { currency: 'gems', amount: 400 } },
    { id: 'victory_roses', category: 'victory_animation', name: 'Rose Petals', description: 'Gentle shower of rose petals', icon: '🌹', rarity: 'rare', price: { currency: 'coins', amount: 800 } },
];

// ─── Emotes ─────────────────────────────────────────────────────

export const EMOTES: CosmeticItem[] = [
    { id: 'emote_gg', category: 'emote', name: 'GG', description: 'Good Game!', icon: '🤝', rarity: 'common', price: { currency: 'coins', amount: 0 } },
    { id: 'emote_nice', category: 'emote', name: 'Nice Move', description: 'Appreciating a great play', icon: '👏', rarity: 'common', price: { currency: 'coins', amount: 0 } },
    { id: 'emote_laugh', category: 'emote', name: 'Laugh', description: 'LOL moment', icon: '😂', rarity: 'common', price: { currency: 'coins', amount: 100 } },
    { id: 'emote_cry', category: 'emote', name: 'Cry', description: 'Sad moment', icon: '😢', rarity: 'common', price: { currency: 'coins', amount: 100 } },
    { id: 'emote_angry', category: 'emote', name: 'Angry', description: 'Frustrated reaction', icon: '😤', rarity: 'common', price: { currency: 'coins', amount: 100 } },
    { id: 'emote_cool', category: 'emote', name: 'Cool', description: 'Smooth operator', icon: '😎', rarity: 'rare', price: { currency: 'coins', amount: 300 } },
    { id: 'emote_fire', category: 'emote', name: 'On Fire', description: 'Win streak celebration', icon: '🔥', rarity: 'rare', price: { currency: 'coins', amount: 400 } },
    { id: 'emote_thinking', category: 'emote', name: 'Hmm...', description: 'Calculating next move', icon: '🤔', rarity: 'rare', price: { currency: 'coins', amount: 300 } },
    { id: 'emote_mind_blown', category: 'emote', name: 'Mind Blown', description: 'Incredible play reaction', icon: '🤯', rarity: 'epic', price: { currency: 'gems', amount: 100 } },
    { id: 'emote_crown', category: 'emote', name: 'Bow Down', description: 'Assert dominance', icon: '👑', rarity: 'epic', price: { currency: 'gems', amount: 150 } },
    { id: 'emote_pray', category: 'emote', name: 'Pray', description: 'Need a 6', icon: '🙏', rarity: 'common', price: { currency: 'coins', amount: 200 } },
    { id: 'emote_sorry', category: 'emote', name: 'Sorry', description: 'Apologizing for a capture', icon: '🙈', rarity: 'common', price: { currency: 'coins', amount: 200 } },
];

// ─── Player Titles ──────────────────────────────────────────────

export const PLAYER_TITLES: CosmeticItem[] = [
    { id: 'title_newbie', category: 'player_title', name: 'Newcomer', description: 'Just getting started', icon: '🌱', rarity: 'common', price: { currency: 'coins', amount: 0 }, unlockCondition: 'Play 1 game' },
    { id: 'title_dice_master', category: 'player_title', name: 'Dice Master', description: 'Roll 100 sixes', icon: '🎲', rarity: 'rare', price: { currency: 'coins', amount: 0 }, unlockCondition: 'Roll 100 sixes' },
    { id: 'title_capture_king', category: 'player_title', name: 'Capture King', description: 'Capture 500 tokens', icon: '⚔️', rarity: 'epic', price: { currency: 'coins', amount: 0 }, unlockCondition: 'Capture 500 tokens' },
    { id: 'title_speed_demon', category: 'player_title', name: 'Speed Demon', description: 'Win 50 Quick Ludo matches', icon: '⚡', rarity: 'epic', price: { currency: 'coins', amount: 0 }, unlockCondition: 'Win 50 Quick Ludo matches' },
    { id: 'title_unbeatable', category: 'player_title', name: 'Unbeatable', description: '10-win streak', icon: '🛡️', rarity: 'legendary', price: { currency: 'coins', amount: 0 }, unlockCondition: '10 consecutive wins' },
    { id: 'title_legend', category: 'player_title', name: 'Living Legend', description: 'Reach Legend tier', icon: '🏆', rarity: 'legendary', price: { currency: 'coins', amount: 0 }, unlockCondition: 'Reach Legend rank' },
    { id: 'title_festival_champion', category: 'player_title', name: 'Festival Champion', description: 'Complete a festival event', icon: '🌸', rarity: 'epic', price: { currency: 'coins', amount: 0 }, unlockCondition: 'Complete any festival event' },
];

// ─── Profile Frames ─────────────────────────────────────────────

export const PROFILE_FRAMES: CosmeticItem[] = [
    { id: 'frame_default', category: 'profile_frame', name: 'Standard', description: 'Basic profile frame', icon: '⭕', rarity: 'common', price: { currency: 'coins', amount: 0 } },
    { id: 'frame_gold', category: 'profile_frame', name: 'Gold Ring', description: 'Gleaming gold border', icon: '🟡', rarity: 'rare', price: { currency: 'coins', amount: 1000 } },
    { id: 'frame_diamond', category: 'profile_frame', name: 'Diamond Halo', description: 'Sparkling diamond border', icon: '💎', rarity: 'epic', price: { currency: 'gems', amount: 300 } },
    { id: 'frame_fire', category: 'profile_frame', name: 'Inferno Ring', description: 'Animated flames around profile', icon: '🔥', rarity: 'epic', price: { currency: 'gems', amount: 250 } },
    { id: 'frame_legendary', category: 'profile_frame', name: 'Legendary Aura', description: 'Golden divine aura', icon: '✨', rarity: 'legendary', price: { currency: 'gems', amount: 600 } },
    { id: 'frame_season_1', category: 'profile_frame', name: 'Season 1', description: 'Exclusive Season 1 frame', icon: '⭐', rarity: 'legendary', price: { currency: 'gems', amount: 0 }, season: 'season_1', unlockCondition: 'Reach Season 1 Tier 30' },
];

// ─── Full Catalog ───────────────────────────────────────────────

export const FULL_COSMETICS_CATALOG: CosmeticItem[] = [
    ...BOARD_THEMES,
    ...DICE_SKINS,
    ...TOKEN_SKINS,
    ...VICTORY_ANIMATIONS,
    ...EMOTES,
    ...PLAYER_TITLES,
    ...PROFILE_FRAMES,
];

/**
 * Get cosmetics filtered by category.
 */
export function getCosmeticsByCategory(category: CosmeticCategory): CosmeticItem[] {
    return FULL_COSMETICS_CATALOG.filter(c => c.category === category);
}

/**
 * Get cosmetics filtered by rarity.
 */
export function getCosmeticsByRarity(rarity: CosmeticRarity): CosmeticItem[] {
    return FULL_COSMETICS_CATALOG.filter(c => c.rarity === rarity);
}

/**
 * Get total catalog count.
 */
export function getCatalogStats() {
    return {
        total: FULL_COSMETICS_CATALOG.length,
        boardThemes: BOARD_THEMES.length,
        diceSkins: DICE_SKINS.length,
        tokenSkins: TOKEN_SKINS.length,
        victoryAnimations: VICTORY_ANIMATIONS.length,
        emotes: EMOTES.length,
        playerTitles: PLAYER_TITLES.length,
        profileFrames: PROFILE_FRAMES.length,
    };
}
