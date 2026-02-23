/**
 * Ludo: Legends — Authentication Service
 * 
 * Social login integration layer for Apple, Google, and Facebook.
 * Manages user sessions, guest accounts, and account linking.
 * 
 * SME Agent: mobile-security-coder, react-native-architecture
 */

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
}

/**
 * Creates a guest account for immediate play.
 * Guest accounts can be upgraded to social accounts later.
 */
export function createGuestProfile(): UserProfile {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
        id: guestId,
        displayName: `Player_${guestId.slice(-4)}`,
        avatar: null,
        provider: 'guest',
        email: null,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
    };
}

/**
 * Validates and normalizes profile data from OAuth providers.
 */
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

/**
 * Generate a deep link for challenge invitations.
 * Format: ludo-legends://challenge/{gameId}?from={playerId}
 */
export function generateChallengeLink(gameId: string, fromPlayerId: string): string {
    return `ludo-legends://challenge/${gameId}?from=${encodeURIComponent(fromPlayerId)}`;
}

/**
 * Parse a deep link URL to extract challenge parameters.
 */
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
