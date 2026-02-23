/**
 * Ludo: Legends — Clan System Service
 * 
 * Full clan lifecycle: creation, membership, chat, wars, perks, and leaderboard.
 * Data persists locally for now; server sync planned for Phase 5.
 */

import { getJSON, setJSON } from './StorageService';

// ─── Types ──────────────────────────────────────────────────────

export interface Clan {
    id: string;
    name: string;
    tag: string;              // 2-5 char tag, e.g. "GG" or "KINGS"
    badge: string;            // Emoji badge
    description: string;
    level: number;            // 1-10, unlocks perks
    xp: number;
    xpToNext: number;
    memberCount: number;
    maxMembers: number;       // 50 max
    createdAt: number;
    leaderId: string;
    isPublic: boolean;
}

export interface ClanMember {
    playerId: string;
    playerName: string;
    role: ClanRole;
    joinedAt: number;
    weeklyXP: number;
    totalWins: number;
    elo: number;
    isOnline: boolean;
    lastActive: number;
}

export type ClanRole = 'leader' | 'co_leader' | 'elder' | 'member';

export interface ClanWar {
    id: string;
    opponentClan: { name: string; tag: string; badge: string };
    status: 'pending' | 'active' | 'completed';
    ourScore: number;
    theirScore: number;
    matchesPlayed: number;
    totalMatches: number;  // 5v5 = 5 matches
    startTime: number;
    endTime: number;
}

export interface ClanChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: number;
    type: 'text' | 'system' | 'war_result' | 'join' | 'leave';
}

export interface ClanPerks {
    coinBonus: number;     // % bonus on coin earnings
    xpBonus: number;       // % bonus on XP earnings
    warSlots: number;      // Concurrent war slots
    chatHistoryDays: number;
}

// ─── Perk Tiers ─────────────────────────────────────────────────

const CLAN_PERK_TABLE: Record<number, ClanPerks> = {
    1: { coinBonus: 0, xpBonus: 0, warSlots: 1, chatHistoryDays: 1 },
    2: { coinBonus: 2, xpBonus: 0, warSlots: 1, chatHistoryDays: 3 },
    3: { coinBonus: 5, xpBonus: 0, warSlots: 1, chatHistoryDays: 7 },
    4: { coinBonus: 5, xpBonus: 2, warSlots: 2, chatHistoryDays: 7 },
    5: { coinBonus: 8, xpBonus: 5, warSlots: 2, chatHistoryDays: 14 },
    6: { coinBonus: 10, xpBonus: 5, warSlots: 2, chatHistoryDays: 14 },
    7: { coinBonus: 10, xpBonus: 8, warSlots: 3, chatHistoryDays: 30 },
    8: { coinBonus: 12, xpBonus: 10, warSlots: 3, chatHistoryDays: 30 },
    9: { coinBonus: 15, xpBonus: 12, warSlots: 3, chatHistoryDays: 30 },
    10: { coinBonus: 20, xpBonus: 15, warSlots: 4, chatHistoryDays: 30 },
};

export function getClanPerks(level: number): ClanPerks {
    return CLAN_PERK_TABLE[Math.min(Math.max(level, 1), 10)];
}

// ─── XP Requirements ────────────────────────────────────────────

const CLAN_XP_TABLE: number[] = [
    0,      // Level 1 (starting)
    500,    // Level 2
    1500,   // Level 3
    3000,   // Level 4
    6000,   // Level 5
    10000,  // Level 6
    16000,  // Level 7
    25000,  // Level 8
    40000,  // Level 9
    60000,  // Level 10
];

export function getClanXPForLevel(level: number): number {
    return CLAN_XP_TABLE[Math.min(level, 9)] ?? 60000;
}

// ─── Storage Keys ───────────────────────────────────────────────

const KEYS = {
    MY_CLAN: '@ludo:my_clan',
    CLAN_MEMBERS: '@ludo:clan_members',
    CLAN_CHAT: '@ludo:clan_chat',
    CLAN_WARS: '@ludo:clan_wars',
} as const;

// ─── Clan CRUD ──────────────────────────────────────────────────

export async function getMyClan(): Promise<Clan | null> {
    return getJSON<Clan>(KEYS.MY_CLAN);
}

export async function saveMyClan(clan: Clan | null): Promise<void> {
    return setJSON(KEYS.MY_CLAN, clan);
}

export function createClan(
    name: string,
    tag: string,
    badge: string,
    leaderId: string,
    isPublic: boolean = true,
): Clan {
    return {
        id: `clan_${Date.now()}`,
        name,
        tag: tag.toUpperCase().slice(0, 5),
        badge,
        description: '',
        level: 1,
        xp: 0,
        xpToNext: getClanXPForLevel(1),
        memberCount: 1,
        maxMembers: 50,
        createdAt: Date.now(),
        leaderId,
        isPublic,
    };
}

// ─── Members ────────────────────────────────────────────────────

export async function getClanMembers(): Promise<ClanMember[]> {
    return (await getJSON<ClanMember[]>(KEYS.CLAN_MEMBERS)) ?? [];
}

export async function saveClanMembers(members: ClanMember[]): Promise<void> {
    return setJSON(KEYS.CLAN_MEMBERS, members);
}

// ─── Chat ───────────────────────────────────────────────────────

export async function getClanChat(): Promise<ClanChatMessage[]> {
    return (await getJSON<ClanChatMessage[]>(KEYS.CLAN_CHAT)) ?? [];
}

export async function addClanMessage(message: ClanChatMessage): Promise<void> {
    const messages = await getClanChat();
    messages.push(message);
    // Keep last 200 messages
    const trimmed = messages.slice(-200);
    return setJSON(KEYS.CLAN_CHAT, trimmed);
}

export function createChatMessage(
    senderId: string,
    senderName: string,
    text: string,
    type: ClanChatMessage['type'] = 'text',
): ClanChatMessage {
    return {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        senderId,
        senderName,
        message: text,
        timestamp: Date.now(),
        type,
    };
}

// ─── Wars ───────────────────────────────────────────────────────

export async function getClanWars(): Promise<ClanWar[]> {
    return (await getJSON<ClanWar[]>(KEYS.CLAN_WARS)) ?? [];
}

export async function saveClanWars(wars: ClanWar[]): Promise<void> {
    return setJSON(KEYS.CLAN_WARS, wars);
}

// ─── Demo Data ──────────────────────────────────────────────────

export function generateDemoClan(): Clan {
    return createClan('Ludo Legends', 'LL', '🏰', 'player_self', true);
}

export function generateDemoMembers(): ClanMember[] {
    return [
        { playerId: 'player_self', playerName: 'You', role: 'leader', joinedAt: Date.now() - 30 * 86400000, weeklyXP: 1200, totalWins: 45, elo: 1450, isOnline: true, lastActive: Date.now() },
        { playerId: 'p2', playerName: 'DiceKing', role: 'co_leader', joinedAt: Date.now() - 25 * 86400000, weeklyXP: 980, totalWins: 38, elo: 1380, isOnline: true, lastActive: Date.now() },
        { playerId: 'p3', playerName: 'BoardQueen', role: 'elder', joinedAt: Date.now() - 20 * 86400000, weeklyXP: 750, totalWins: 30, elo: 1320, isOnline: false, lastActive: Date.now() - 3600000 },
        { playerId: 'p4', playerName: 'TokenMaster', role: 'member', joinedAt: Date.now() - 15 * 86400000, weeklyXP: 600, totalWins: 22, elo: 1240, isOnline: false, lastActive: Date.now() - 7200000 },
        { playerId: 'p5', playerName: 'CaptureBot', role: 'member', joinedAt: Date.now() - 10 * 86400000, weeklyXP: 420, totalWins: 15, elo: 1180, isOnline: true, lastActive: Date.now() },
    ];
}
