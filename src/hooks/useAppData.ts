/**
 * Ludo: Legends — Centralized App Data Hook
 * 
 * Loads profile, wallet, progression, and settings ONCE on mount,
 * caches in state, and shares across screens via a simple hook.
 * Prevents redundant AsyncStorage reads when navigating between screens.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getProfile,
    getWallet,
    getProgression,
    getSettings,
    getMatchHistory,
    getOwnedCosmetics,
    getEquippedCosmetics,
    getLoginStreak,
    StoredProfile,
    StoredWallet,
    StoredProgression,
    StoredSettings,
    StoredMatch,
    StoredLoginStreak,
} from '../services/StorageService';

export interface AppData {
    profile: StoredProfile | null;
    wallet: StoredWallet;
    progression: StoredProgression;
    settings: StoredSettings;
    matchHistory: StoredMatch[];
    ownedCosmetics: string[];
    equippedCosmetics: Record<string, string | null>;
    loginStreak: StoredLoginStreak;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

const DEFAULT_WALLET: StoredWallet = { coins: 0, gems: 0 };
const DEFAULT_PROGRESSION: StoredProgression = {
    level: 1, xp: 0, totalWins: 0, totalGames: 0, winStreak: 0, bestStreak: 0,
};
const DEFAULT_SETTINGS: StoredSettings = {
    soundEnabled: true, musicEnabled: true, hapticsEnabled: true,
    notifications: true, showThreatOverlay: true, showCoachingHints: false,
    autoRollDice: false, animationSpeed: 'normal',
};
const DEFAULT_LOGIN: StoredLoginStreak = { currentDay: 0, lastClaimDate: '', consecutiveDays: 0 };

/**
 * Load all app data in parallel. Use this hook in screens that need
 * multiple data sources to avoid waterfall reads.
 */
export function useAppData(): AppData {
    const [profile, setProfile] = useState<StoredProfile | null>(null);
    const [wallet, setWallet] = useState<StoredWallet>(DEFAULT_WALLET);
    const [progression, setProgression] = useState<StoredProgression>(DEFAULT_PROGRESSION);
    const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
    const [matchHistory, setMatchHistory] = useState<StoredMatch[]>([]);
    const [ownedCosmetics, setOwnedCosmetics] = useState<string[]>([]);
    const [equippedCosmetics, setEquippedCosmetics] = useState<Record<string, string | null>>({});
    const [loginStreak, setLoginStreak] = useState<StoredLoginStreak>(DEFAULT_LOGIN);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [prof, w, prog, s, hist, owned, equipped, login] = await Promise.all([
                getProfile(),
                getWallet(),
                getProgression(),
                getSettings(),
                getMatchHistory(),
                getOwnedCosmetics(),
                getEquippedCosmetics(),
                getLoginStreak(),
            ]);
            setProfile(prof);
            setWallet(w);
            setProgression(prog);
            setSettings(s);
            setMatchHistory(hist);
            setOwnedCosmetics(owned);
            setEquippedCosmetics(equipped);
            setLoginStreak(login);
        } catch (err) {
            setError('Failed to load data. Please restart the app.');
            console.warn('[useAppData] Load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    return {
        profile, wallet, progression, settings,
        matchHistory, ownedCosmetics, equippedCosmetics,
        loginStreak, loading, error, reload,
    };
}
