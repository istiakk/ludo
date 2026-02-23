/**
 * Ludo: Legends — Authentication Service
 * 
 * Full auth lifecycle: guest accounts, Google/Apple Sign-In,
 * guest-to-authenticated upgrade, persistent sessions, token management.
 * 
 * SME Agent: mobile-security-coder, react-native-architecture
 */

import { getJSON, setJSON } from './StorageService';

// ─── Types ──────────────────────────────────────────────────────

export type AuthProvider = 'apple' | 'google' | 'facebook' | 'guest';

export interface UserProfile {
    id: string;
    displayName: string;
    avatar: string | null;
    provider: AuthProvider;
    email: string | null;
    createdAt: number;
    lastLoginAt: number;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    token: string | null;
    refreshToken: string | null;
    tokenExpiry: number | null;
}

// ─── Storage ────────────────────────────────────────────────────

const AUTH_KEY = '@ludo:auth_state';

export async function getPersistedAuthState(): Promise<AuthState | null> {
    return getJSON<AuthState>(AUTH_KEY);
}

export async function persistAuthState(state: AuthState): Promise<void> {
    return setJSON(AUTH_KEY, state);
}

function emptyAuthState(): AuthState {
    return {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        token: null,
        refreshToken: null,
        tokenExpiry: null,
    };
}

// ─── Guest Account ──────────────────────────────────────────────

export function createGuestProfile(): UserProfile {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
        id: guestId,
        displayName: `Player_${guestId.slice(-4).toUpperCase()}`,
        avatar: null,
        provider: 'guest',
        email: null,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
    };
}

export async function signInAsGuest(): Promise<AuthState> {
    const user = createGuestProfile();
    const state: AuthState = {
        isAuthenticated: false,
        user,
        isLoading: false,
        error: null,
        token: generateLocalToken(user.id),
        refreshToken: null,
        tokenExpiry: Date.now() + 365 * 24 * 3600000,
    };
    await persistAuthState(state);
    return state;
}

// ─── OAuth ──────────────────────────────────────────────────────

export function normalizeOAuthProfile(
    provider: AuthProvider,
    rawProfile: {
        id: string;
        name?: string;
        email?: string;
        picture?: string;
    },
): UserProfile {
    return {
        id: `${provider}_${rawProfile.id}`,
        displayName: rawProfile.name ?? `${provider}User`,
        avatar: rawProfile.picture ?? null,
        provider,
        email: rawProfile.email ?? null,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
    };
}

export async function signInWithOAuth(
    provider: AuthProvider,
    profile: UserProfile,
): Promise<AuthState> {
    const state: AuthState = {
        isAuthenticated: true,
        user: profile,
        isLoading: false,
        error: null,
        token: generateLocalToken(profile.id),
        refreshToken: generateLocalToken(profile.id + '_refresh'),
        tokenExpiry: Date.now() + 3600000,
    };
    await persistAuthState(state);
    return state;
}

// ─── Guest Upgrade ──────────────────────────────────────────────

/**
 * Upgrade guest to full account preserving all progression data.
 */
export async function upgradeGuestAccount(
    currentState: AuthState,
    provider: AuthProvider,
    providerProfile: { id: string; name?: string; email?: string; picture?: string },
): Promise<AuthState> {
    if (!currentState.user) throw new Error('No user to upgrade');

    const upgradedUser: UserProfile = {
        ...currentState.user,
        id: `${provider}_${providerProfile.id}`,
        displayName: providerProfile.name ?? currentState.user.displayName,
        email: providerProfile.email ?? null,
        avatar: providerProfile.picture ?? null,
        provider,
        lastLoginAt: Date.now(),
    };

    const state: AuthState = {
        isAuthenticated: true,
        user: upgradedUser,
        isLoading: false,
        error: null,
        token: generateLocalToken(upgradedUser.id),
        refreshToken: generateLocalToken(upgradedUser.id + '_refresh'),
        tokenExpiry: Date.now() + 3600000,
    };
    await persistAuthState(state);
    return state;
}

// ─── Sign Out ───────────────────────────────────────────────────

export async function signOut(): Promise<void> {
    await persistAuthState(emptyAuthState());
}

// ─── Token Utilities ────────────────────────────────────────────

function generateLocalToken(seed: string): string {
    const payload = `${seed}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return btoa(payload);
}

export function isTokenExpired(state: AuthState): boolean {
    if (!state.tokenExpiry) return true;
    return Date.now() > state.tokenExpiry;
}

// ─── Deep Links ─────────────────────────────────────────────────

export function generateChallengeLink(gameId: string, fromPlayerId: string): string {
    return `ludo-legends://challenge/${gameId}?from=${encodeURIComponent(fromPlayerId)}`;
}

export function parseChallengeLink(url: string): { gameId: string; fromPlayerId: string } | null {
    try {
        const match = url.match(/challenge\/([^?]+)\?from=(.+)/);
        if (!match) return null;
        return {
            gameId: match[1],
            fromPlayerId: decodeURIComponent(match[2]),
        };
    } catch {
        return null;
    }
}

