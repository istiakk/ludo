/**
 * Ludo: Legends — Local Persistence Service
 * 
 * AsyncStorage wrapper for persisting user data locally.
 * All game data survives app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ───────────────────────────────────────────────

const KEYS = {
    USER_PROFILE: '@ludo:user_profile',
    SETTINGS: '@ludo:settings',
    WALLET: '@ludo:wallet',
    OWNED_COSMETICS: '@ludo:owned_cosmetics',
    EQUIPPED_COSMETICS: '@ludo:equipped_cosmetics',
    MATCH_HISTORY: '@ludo:match_history',
    DAILY_LOGIN: '@ludo:daily_login',
    AD_STATE: '@ludo:ad_state',
    SEASON_PASS: '@ludo:season_pass',
    PROGRESSION: '@ludo:progression',
} as const;

// ─── Generic Helpers ────────────────────────────────────────────

async function getJSON<T>(key: string): Promise<T | null> {
    try {
        const value = await AsyncStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.warn(`[Storage] Failed to read ${key}:`, error);
        return null;
    }
}

async function setJSON<T>(key: string, value: T): Promise<void> {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`[Storage] Failed to write ${key}:`, error);
    }
}

async function removeKey(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.warn(`[Storage] Failed to remove ${key}:`, error);
    }
}

// ─── User Profile ───────────────────────────────────────────────

export interface StoredProfile {
    id: string;
    displayName: string;
    avatar: string | null;
    provider: string;
    elo: number;
    tier: string;
    createdAt: number;
}

export async function getProfile(): Promise<StoredProfile | null> {
    return getJSON<StoredProfile>(KEYS.USER_PROFILE);
}

export async function saveProfile(profile: StoredProfile): Promise<void> {
    return setJSON(KEYS.USER_PROFILE, profile);
}

// ─── Settings ───────────────────────────────────────────────────

export interface StoredSettings {
    soundEnabled: boolean;
    musicEnabled: boolean;
    hapticsEnabled: boolean;
    notifications: boolean;
    showThreatOverlay: boolean;
    showCoachingHints: boolean;
    autoRollDice: boolean;
    animationSpeed: 'normal' | 'fast' | 'instant';
}

const DEFAULT_SETTINGS: StoredSettings = {
    soundEnabled: true,
    musicEnabled: true,
    hapticsEnabled: true,
    notifications: true,
    showThreatOverlay: true,
    showCoachingHints: false,
    autoRollDice: false,
    animationSpeed: 'normal',
};

export async function getSettings(): Promise<StoredSettings> {
    return (await getJSON<StoredSettings>(KEYS.SETTINGS)) ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: StoredSettings): Promise<void> {
    return setJSON(KEYS.SETTINGS, settings);
}

// ─── Wallet ─────────────────────────────────────────────────────

export interface StoredWallet {
    coins: number;
    gems: number;
}

export async function getWallet(): Promise<StoredWallet> {
    return (await getJSON<StoredWallet>(KEYS.WALLET)) ?? { coins: 100, gems: 5 };
}

export async function saveWallet(wallet: StoredWallet): Promise<void> {
    return setJSON(KEYS.WALLET, wallet);
}

// ─── Cosmetics ──────────────────────────────────────────────────

export async function getOwnedCosmetics(): Promise<string[]> {
    return (await getJSON<string[]>(KEYS.OWNED_COSMETICS)) ?? [];
}

export async function saveOwnedCosmetics(ids: string[]): Promise<void> {
    return setJSON(KEYS.OWNED_COSMETICS, ids);
}

export async function getEquippedCosmetics(): Promise<Record<string, string | null>> {
    return (await getJSON<Record<string, string | null>>(KEYS.EQUIPPED_COSMETICS)) ?? {};
}

export async function saveEquippedCosmetics(equipped: Record<string, string | null>): Promise<void> {
    return setJSON(KEYS.EQUIPPED_COSMETICS, equipped);
}

// ─── Match History ──────────────────────────────────────────────

export interface StoredMatch {
    id: string;
    mode: string;
    matchType: string;
    result: 'win' | 'loss';
    eloChange: number;
    captures: number;
    tokensFinished: number;
    duration: number;
    opponentName: string;
    playedAt: number;
}

const MAX_STORED_MATCHES = 50;

export async function getMatchHistory(): Promise<StoredMatch[]> {
    return (await getJSON<StoredMatch[]>(KEYS.MATCH_HISTORY)) ?? [];
}

export async function addMatchToHistory(match: StoredMatch): Promise<void> {
    const history = await getMatchHistory();
    history.unshift(match); // Newest first
    if (history.length > MAX_STORED_MATCHES) history.pop();
    return setJSON(KEYS.MATCH_HISTORY, history);
}

// ─── Daily Login ────────────────────────────────────────────────

export interface StoredLoginStreak {
    currentDay: number;
    lastClaimDate: string;
    consecutiveDays: number;
}

export async function getLoginStreak(): Promise<StoredLoginStreak> {
    return (await getJSON<StoredLoginStreak>(KEYS.DAILY_LOGIN)) ?? {
        currentDay: 0,
        lastClaimDate: '',
        consecutiveDays: 0,
    };
}

export async function saveLoginStreak(streak: StoredLoginStreak): Promise<void> {
    return setJSON(KEYS.DAILY_LOGIN, streak);
}

// ─── Progression ────────────────────────────────────────────────

export interface StoredProgression {
    level: number;
    xp: number;
    totalWins: number;
    totalGames: number;
    winStreak: number;
    bestStreak: number;
}

export async function getProgression(): Promise<StoredProgression> {
    return (await getJSON<StoredProgression>(KEYS.PROGRESSION)) ?? {
        level: 1,
        xp: 0,
        totalWins: 0,
        totalGames: 0,
        winStreak: 0,
        bestStreak: 0,
    };
}

export async function saveProgression(prog: StoredProgression): Promise<void> {
    return setJSON(KEYS.PROGRESSION, prog);
}

// ─── Clear All ──────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
    const keys = Object.values(KEYS);
    await AsyncStorage.multiRemove(keys);
}
