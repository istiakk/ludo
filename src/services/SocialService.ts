/**
 * Ludo: Legends — Social Service
 * 
 * Friends, squads, rivalries, and social graph management.
 * 
 * SME Agent: nodejs-backend-patterns, game-development/game-design
 */

export type FriendStatus = 'pending' | 'accepted' | 'blocked';
export type RivalryLevel = 'casual' | 'heated' | 'nemesis';

export interface Friend {
    id: string;
    displayName: string;
    avatar: string | null;
    status: FriendStatus;
    elo: number;
    isOnline: boolean;
    lastPlayedAt: number | null;
    addedAt: number;
}

export interface Rivalry {
    opponentId: string;
    opponentName: string;
    totalGames: number;
    wins: number;
    losses: number;
    level: RivalryLevel;
    lastMatchAt: number;
}

export interface Squad {
    id: string;
    name: string;
    tag: string; // 3-5 char tag
    members: SquadMember[];
    createdAt: number;
    totalWins: number;
}

export interface SquadMember {
    playerId: string;
    displayName: string;
    role: 'leader' | 'co-leader' | 'member';
    joinedAt: number;
}

/**
 * Determine rivalry level from head-to-head record.
 */
export function calculateRivalryLevel(totalGames: number, winRate: number): RivalryLevel {
    if (totalGames < 5) return 'casual';
    if (totalGames >= 20 || (totalGames >= 10 && Math.abs(winRate - 0.5) < 0.1)) return 'nemesis';
    return 'heated';
}

/**
 * Generate a shareable challenge URL for social platforms.
 */
export function generateShareableChallenge(
    playerName: string,
    mode: string,
    challengeCode: string,
): {
    text: string;
    url: string;
} {
    const url = `https://ludolegends.app/challenge/${challengeCode}`;
    const text = `⚔️ ${playerName} challenges you to a ${mode} Ludo match! Can you beat them? 🎲`;
    return { text, url };
}

/**
 * Quick chat messages for in-game social.
 */
export const QUICK_CHAT_MESSAGES = [
    { id: 'gg', text: 'Good game! 👏', category: 'positive' },
    { id: 'gl', text: 'Good luck! 🍀', category: 'positive' },
    { id: 'wp', text: 'Well played! 🎯', category: 'positive' },
    { id: 'nice', text: 'Nice move! 🔥', category: 'positive' },
    { id: 'oops', text: 'Oops! 😅', category: 'neutral' },
    { id: 'hurry', text: 'Hurry up! ⏰', category: 'neutral' },
    { id: 'rematch', text: 'Rematch? 🔄', category: 'neutral' },
    { id: 'wow', text: 'Wow! 😮', category: 'reaction' },
    { id: 'laugh', text: '😂', category: 'reaction' },
    { id: 'think', text: '🤔', category: 'reaction' },
] as const;

export type QuickChatId = typeof QUICK_CHAT_MESSAGES[number]['id'];
