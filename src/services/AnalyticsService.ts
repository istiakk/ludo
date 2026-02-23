/**
 * Ludo: Legends — Analytics Service
 * 
 * Full funnel tracking: install → tutorial → first game → retention → purchase.
 * Tracks game events, progression, monetization, and engagement metrics.
 * Privacy-first: no PII stored, opt-out supported.
 */

import { getJSON, setJSON } from './StorageService';

// ─── Types ──────────────────────────────────────────────────────

export type AnalyticsEvent =
    // Funnel events
    | 'app_open'
    | 'tutorial_start'
    | 'tutorial_complete'
    | 'first_game_start'
    | 'first_game_complete'
    | 'first_win'
    // Game events
    | 'game_start'
    | 'game_complete'
    | 'game_abandon'
    | 'dice_roll'
    | 'token_capture'
    | 'token_finish'
    // Social events
    | 'friend_added'
    | 'friend_challenged'
    | 'clan_joined'
    | 'clan_war_started'
    | 'chat_message_sent'
    // Monetization events
    | 'shop_opened'
    | 'item_purchased'
    | 'vip_subscribed'
    | 'ad_watched'
    | 'tournament_entry'
    | 'starter_pack_purchased'
    // Engagement events
    | 'daily_login'
    | 'streak_continued'
    | 'season_pass_tier_up'
    | 'event_completed'
    | 'cosmetic_equipped';

export interface AnalyticsPayload {
    event: AnalyticsEvent;
    timestamp: number;
    sessionId: string;
    properties?: Record<string, string | number | boolean>;
}

export interface AnalyticsConfig {
    enabled: boolean;
    sessionId: string;
    sessionStartAt: number;
    totalEvents: number;
    installDate: number | null;
}

// ─── Storage ────────────────────────────────────────────────────

const CONFIG_KEY = '@ludo:analytics_config';
const EVENTS_KEY = '@ludo:analytics_events';
const MAX_LOCAL_EVENTS = 200;

export async function getAnalyticsConfig(): Promise<AnalyticsConfig> {
    const config = await getJSON<AnalyticsConfig>(CONFIG_KEY);
    return config ?? {
        enabled: true,
        sessionId: generateSessionId(),
        sessionStartAt: Date.now(),
        totalEvents: 0,
        installDate: Date.now(),
    };
}

export async function saveAnalyticsConfig(config: AnalyticsConfig): Promise<void> {
    return setJSON(CONFIG_KEY, config);
}

// ─── Core Tracking ──────────────────────────────────────────────

/**
 * Track a single analytics event.
 */
export async function track(
    event: AnalyticsEvent,
    properties?: Record<string, string | number | boolean>,
): Promise<void> {
    const config = await getAnalyticsConfig();
    if (!config.enabled) return;

    const payload: AnalyticsPayload = {
        event,
        timestamp: Date.now(),
        sessionId: config.sessionId,
        properties,
    };

    // Store locally
    const events = await getLocalEvents();
    events.push(payload);
    const trimmed = events.slice(-MAX_LOCAL_EVENTS);
    await setJSON(EVENTS_KEY, trimmed);

    // Update counter
    await saveAnalyticsConfig({ ...config, totalEvents: config.totalEvents + 1 });

    // In production: also batch-send to analytics server
    if (__DEV__) {
        console.log(`[Analytics] ${event}`, properties ?? '');
    }
}

// ─── Convenience Trackers ───────────────────────────────────────

export async function trackGameStart(mode: string, matchType: string): Promise<void> {
    await track('game_start', { mode, matchType });
}

export async function trackGameComplete(
    mode: string,
    matchType: string,
    won: boolean,
    durationMs: number,
): Promise<void> {
    await track('game_complete', { mode, matchType, won, durationMs });
}

export async function trackPurchase(
    itemId: string,
    currency: string,
    amount: number,
): Promise<void> {
    await track('item_purchased', { itemId, currency, amount });
}

export async function trackAdWatched(adType: string, rewardType: string): Promise<void> {
    await track('ad_watched', { adType, rewardType });
}

export async function trackTournamentEntry(
    tournamentId: string,
    format: string,
    entryFee: number,
): Promise<void> {
    await track('tournament_entry', { tournamentId, format, entryFee });
}

// ─── Session Management ─────────────────────────────────────────

export async function startNewSession(): Promise<string> {
    const sessionId = generateSessionId();
    const config = await getAnalyticsConfig();
    await saveAnalyticsConfig({
        ...config,
        sessionId,
        sessionStartAt: Date.now(),
    });
    await track('app_open');
    return sessionId;
}

// ─── Privacy ────────────────────────────────────────────────────

export async function setAnalyticsEnabled(enabled: boolean): Promise<void> {
    const config = await getAnalyticsConfig();
    await saveAnalyticsConfig({ ...config, enabled });

    if (!enabled) {
        // Clear stored events
        await setJSON(EVENTS_KEY, []);
    }
}

// ─── Local Events ───────────────────────────────────────────────

async function getLocalEvents(): Promise<AnalyticsPayload[]> {
    return (await getJSON<AnalyticsPayload[]>(EVENTS_KEY)) ?? [];
}

/**
 * Get recent events for debugging or local dashboards.
 */
export async function getRecentEvents(count: number = 20): Promise<AnalyticsPayload[]> {
    const events = await getLocalEvents();
    return events.slice(-count);
}

// ─── Retention Metrics ──────────────────────────────────────────

export interface RetentionMetrics {
    installDate: number;
    daysSinceInstall: number;
    totalSessions: number;
    totalGamesPlayed: number;
    totalPurchases: number;
    currentStreak: number;
}

export async function getRetentionMetrics(): Promise<RetentionMetrics> {
    const config = await getAnalyticsConfig();
    const events = await getLocalEvents();

    const installDate = config.installDate ?? Date.now();
    const daysSinceInstall = Math.floor((Date.now() - installDate) / 86400000);
    const totalGamesPlayed = events.filter(e => e.event === 'game_complete').length;
    const totalPurchases = events.filter(e => e.event === 'item_purchased').length;
    const streakEvents = events.filter(e => e.event === 'streak_continued');

    return {
        installDate,
        daysSinceInstall,
        totalSessions: config.totalEvents,
        totalGamesPlayed,
        totalPurchases,
        currentStreak: streakEvents.length,
    };
}

// ─── Utilities ──────────────────────────────────────────────────

function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

declare const __DEV__: boolean;
