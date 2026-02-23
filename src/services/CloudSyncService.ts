/**
 * Ludo: Legends — Cloud Sync Service
 * 
 * Cross-device sync for progression, cosmetics, settings, and match history.
 * Uses local-first with server push on connectivity.
 * Conflict resolution: server wins on progression, latest-timestamp wins on settings.
 */

import { getJSON, setJSON } from './StorageService';

// ─── Types ──────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncState {
    status: SyncStatus;
    lastSyncAt: number | null;
    pendingChanges: number;
    error: string | null;
    deviceId: string;
}

export type SyncCategory =
    | 'profile'
    | 'progression'
    | 'cosmetics'
    | 'settings'
    | 'match_history'
    | 'clan'
    | 'friends'
    | 'vip';

export interface SyncPayload {
    category: SyncCategory;
    data: unknown;
    timestamp: number;
    version: number;
    checksum: string;
}

export interface SyncConflict {
    category: SyncCategory;
    localTimestamp: number;
    serverTimestamp: number;
    resolution: 'local_wins' | 'server_wins' | 'merge';
}

// ─── Constants ──────────────────────────────────────────────────

const SYNC_KEY = '@ludo:sync_state';
const PENDING_KEY = '@ludo:sync_pending';
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_PENDING_ITEMS = 50;

// ─── Conflict Resolution ────────────────────────────────────────

const RESOLUTION_RULES: Record<SyncCategory, 'server_wins' | 'latest' | 'merge'> = {
    profile: 'latest',
    progression: 'server_wins',  // Server is source of truth for XP/ELO
    cosmetics: 'latest',
    settings: 'latest',
    match_history: 'merge',       // Combine match records
    clan: 'server_wins',
    friends: 'merge',
    vip: 'server_wins',
};

export function resolveConflict(category: SyncCategory, localTs: number, serverTs: number): SyncConflict {
    const rule = RESOLUTION_RULES[category];
    let resolution: SyncConflict['resolution'];

    if (rule === 'server_wins') {
        resolution = 'server_wins';
    } else if (rule === 'merge') {
        resolution = 'merge';
    } else {
        resolution = localTs > serverTs ? 'local_wins' : 'server_wins';
    }

    return { category, localTimestamp: localTs, serverTimestamp: serverTs, resolution };
}

// ─── Sync State ─────────────────────────────────────────────────

export async function getSyncState(): Promise<SyncState> {
    const state = await getJSON<SyncState>(SYNC_KEY);
    return state ?? {
        status: 'idle',
        lastSyncAt: null,
        pendingChanges: 0,
        error: null,
        deviceId: generateDeviceId(),
    };
}

export async function saveSyncState(state: SyncState): Promise<void> {
    return setJSON(SYNC_KEY, state);
}

// ─── Pending Queue ──────────────────────────────────────────────

export async function getPendingChanges(): Promise<SyncPayload[]> {
    return (await getJSON<SyncPayload[]>(PENDING_KEY)) ?? [];
}

export async function addPendingChange(payload: SyncPayload): Promise<void> {
    const pending = await getPendingChanges();
    pending.push(payload);
    // Keep only latest MAX_PENDING_ITEMS
    const trimmed = pending.slice(-MAX_PENDING_ITEMS);
    await setJSON(PENDING_KEY, trimmed);
}

export async function clearPendingChanges(): Promise<void> {
    await setJSON(PENDING_KEY, []);
}

// ─── Sync Operations ────────────────────────────────────────────

/**
 * Record a local change for later sync.
 */
export async function recordChange(category: SyncCategory, data: unknown): Promise<void> {
    const payload: SyncPayload = {
        category,
        data,
        timestamp: Date.now(),
        version: 1,
        checksum: simpleChecksum(JSON.stringify(data)),
    };
    await addPendingChange(payload);
}

/**
 * Attempt to sync all pending changes.
 * In production: POST to /api/sync with the pending queue.
 */
export async function syncNow(): Promise<SyncState> {
    const state = await getSyncState();
    const pending = await getPendingChanges();

    if (pending.length === 0) {
        return { ...state, status: 'success', lastSyncAt: Date.now(), pendingChanges: 0 };
    }

    // Stub: In production, POST pending to server
    // Server returns merged state + conflict resolutions
    console.log(`[CloudSync] Syncing ${pending.length} changes...`);

    const updatedState: SyncState = {
        ...state,
        status: 'success',
        lastSyncAt: Date.now(),
        pendingChanges: 0,
        error: null,
    };

    await clearPendingChanges();
    await saveSyncState(updatedState);
    return updatedState;
}

/**
 * Check if auto-sync is due.
 */
export function shouldAutoSync(state: SyncState): boolean {
    if (!state.lastSyncAt) return true;
    return Date.now() - state.lastSyncAt > SYNC_INTERVAL_MS;
}

// ─── Utilities ──────────────────────────────────────────────────

function generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function simpleChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}
