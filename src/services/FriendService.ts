/**
 * Ludo: Legends — Friend System Service
 * 
 * Friend graph: add/remove, challenge, spectate, gift, activity feed.
 * Data persists locally; server sync planned for Phase 5.
 */

import { getJSON, setJSON } from './StorageService';

// ─── Types ──────────────────────────────────────────────────────

export interface Friend {
    playerId: string;
    displayName: string;
    avatar: string | null;
    elo: number;
    tier: string;
    isOnline: boolean;
    lastActive: number;
    addedAt: number;
    gamesPlayedTogether: number;
    winsAgainst: number;
    lossesAgainst: number;
}

export interface FriendRequest {
    id: string;
    fromPlayerId: string;
    fromPlayerName: string;
    timestamp: number;
    status: 'pending' | 'accepted' | 'declined';
}

export interface FriendActivity {
    id: string;
    playerId: string;
    playerName: string;
    type: 'online' | 'in_game' | 'won_match' | 'level_up' | 'streak' | 'joined_clan';
    description: string;
    timestamp: number;
}

export interface GiftTransaction {
    id: string;
    fromPlayerId: string;
    toPlayerId: string;
    type: 'coins' | 'cosmetic';
    amount?: number;
    itemId?: string;
    message?: string;
    timestamp: number;
}

// ─── Storage Keys ───────────────────────────────────────────────

const KEYS = {
    FRIENDS: '@ludo:friends',
    FRIEND_REQUESTS: '@ludo:friend_requests',
    FRIEND_ACTIVITY: '@ludo:friend_activity',
    FRIEND_CODE: '@ludo:friend_code',
} as const;

// ─── Friend Code ────────────────────────────────────────────────

/**
 * Generate a unique 6-character friend code.
 */
export function generateFriendCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export async function getMyFriendCode(): Promise<string> {
    const existing = await getJSON<string>(KEYS.FRIEND_CODE);
    if (existing) return existing;
    const code = generateFriendCode();
    await setJSON(KEYS.FRIEND_CODE, code);
    return code;
}

// ─── Friend CRUD ────────────────────────────────────────────────

export async function getFriends(): Promise<Friend[]> {
    return (await getJSON<Friend[]>(KEYS.FRIENDS)) ?? [];
}

export async function saveFriends(friends: Friend[]): Promise<void> {
    return setJSON(KEYS.FRIENDS, friends);
}

export async function addFriend(friend: Friend): Promise<void> {
    const friends = await getFriends();
    if (friends.some(f => f.playerId === friend.playerId)) return;
    friends.push(friend);
    await saveFriends(friends);
}

export async function removeFriend(playerId: string): Promise<void> {
    const friends = await getFriends();
    await saveFriends(friends.filter(f => f.playerId !== playerId));
}

// ─── Friend Requests ────────────────────────────────────────────

export async function getFriendRequests(): Promise<FriendRequest[]> {
    return (await getJSON<FriendRequest[]>(KEYS.FRIEND_REQUESTS)) ?? [];
}

export async function saveFriendRequests(requests: FriendRequest[]): Promise<void> {
    return setJSON(KEYS.FRIEND_REQUESTS, requests);
}

export async function sendFriendRequest(toId: string, toName: string): Promise<FriendRequest> {
    const request: FriendRequest = {
        id: `req_${Date.now()}`,
        fromPlayerId: toId,
        fromPlayerName: toName,
        timestamp: Date.now(),
        status: 'pending',
    };
    const requests = await getFriendRequests();
    requests.push(request);
    await saveFriendRequests(requests);
    return request;
}

// ─── Activity Feed ──────────────────────────────────────────────

export async function getFriendActivity(): Promise<FriendActivity[]> {
    return (await getJSON<FriendActivity[]>(KEYS.FRIEND_ACTIVITY)) ?? [];
}

export async function addFriendActivity(activity: FriendActivity): Promise<void> {
    const feed = await getFriendActivity();
    feed.unshift(activity); // Newest first
    // Keep last 100
    const trimmed = feed.slice(0, 100);
    await setJSON(KEYS.FRIEND_ACTIVITY, trimmed);
}

// ─── Gift System ────────────────────────────────────────────────

const DAILY_GIFT_LIMIT = 3;
const GIFT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function canSendGift(lastGiftTime: number | null): boolean {
    if (!lastGiftTime) return true;
    return Date.now() - lastGiftTime >= GIFT_COOLDOWN_MS;
}

export function createGift(
    fromId: string,
    toId: string,
    type: 'coins' | 'cosmetic',
    amount?: number,
    itemId?: string,
    message?: string,
): GiftTransaction {
    return {
        id: `gift_${Date.now()}`,
        fromPlayerId: fromId,
        toPlayerId: toId,
        type,
        amount,
        itemId,
        message,
        timestamp: Date.now(),
    };
}

// ─── Referral System ────────────────────────────────────────────

export const REFERRAL_REWARDS = {
    inviter: { coins: 500, cosmetic: 'dice_referral_exclusive' },
    invitee: { coins: 500, cosmetic: 'dice_referral_exclusive' },
} as const;

// ─── Demo Data ──────────────────────────────────────────────────

export function generateDemoFriends(): Friend[] {
    return [
        { playerId: 'f1', displayName: 'DiceKing', avatar: null, elo: 1450, tier: 'gold', isOnline: true, lastActive: Date.now(), addedAt: Date.now() - 7 * 86400000, gamesPlayedTogether: 12, winsAgainst: 7, lossesAgainst: 5 },
        { playerId: 'f2', displayName: 'BoardQueen', avatar: null, elo: 1380, tier: 'gold', isOnline: false, lastActive: Date.now() - 3600000, addedAt: Date.now() - 14 * 86400000, gamesPlayedTogether: 8, winsAgainst: 3, lossesAgainst: 5 },
        { playerId: 'f3', displayName: 'TokenMaster', avatar: null, elo: 1200, tier: 'silver', isOnline: true, lastActive: Date.now(), addedAt: Date.now() - 3 * 86400000, gamesPlayedTogether: 3, winsAgainst: 2, lossesAgainst: 1 },
        { playerId: 'f4', displayName: 'CaptureBot', avatar: null, elo: 1100, tier: 'bronze', isOnline: false, lastActive: Date.now() - 86400000, addedAt: Date.now() - 21 * 86400000, gamesPlayedTogether: 20, winsAgainst: 14, lossesAgainst: 6 },
    ];
}

export function generateDemoActivity(): FriendActivity[] {
    return [
        { id: 'a1', playerId: 'f1', playerName: 'DiceKing', type: 'won_match', description: 'Won a Classic match vs AI Expert', timestamp: Date.now() - 300000 },
        { id: 'a2', playerId: 'f3', playerName: 'TokenMaster', type: 'online', description: 'Just came online', timestamp: Date.now() - 600000 },
        { id: 'a3', playerId: 'f2', playerName: 'BoardQueen', type: 'level_up', description: 'Reached Level 15!', timestamp: Date.now() - 3600000 },
        { id: 'a4', playerId: 'f4', playerName: 'CaptureBot', type: 'streak', description: '5-win streak!', timestamp: Date.now() - 7200000 },
        { id: 'a5', playerId: 'f1', playerName: 'DiceKing', type: 'joined_clan', description: 'Joined Ludo Legends clan', timestamp: Date.now() - 86400000 },
    ];
}
