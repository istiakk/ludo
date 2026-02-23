/**
 * Ludo: Legends — Push Notification Service
 * 
 * FCM/APNs push notification management.
 * Handles permission requests, token registration,
 * notification categories, and local scheduling.
 */

import { getJSON, setJSON } from './StorageService';

// ─── Types ──────────────────────────────────────────────────────

export type NotificationCategory =
    | 'friend_challenge'
    | 'clan_war'
    | 'tournament_start'
    | 'event_start'
    | 'event_ending'
    | 'daily_reward'
    | 'friend_online'
    | 'season_ending'
    | 'vip_gems_ready'
    | 'system';

export interface PushNotification {
    id: string;
    category: NotificationCategory;
    title: string;
    body: string;
    data?: Record<string, string>;
    timestamp: number;
    read: boolean;
    actionUrl?: string;
}

export interface PushPreferences {
    enabled: boolean;
    categories: Record<NotificationCategory, boolean>;
    quietHoursStart: number | null;  // Hour (0-23)
    quietHoursEnd: number | null;
    pushToken: string | null;
}

// ─── Default Preferences ────────────────────────────────────────

const DEFAULT_PREFERENCES: PushPreferences = {
    enabled: true,
    categories: {
        friend_challenge: true,
        clan_war: true,
        tournament_start: true,
        event_start: true,
        event_ending: true,
        daily_reward: true,
        friend_online: false,   // Off by default (can be noisy)
        season_ending: true,
        vip_gems_ready: true,
        system: true,
    },
    quietHoursStart: null,
    quietHoursEnd: null,
    pushToken: null,
};

// ─── Storage ────────────────────────────────────────────────────

const PREFS_KEY = '@ludo:push_preferences';
const NOTIFICATIONS_KEY = '@ludo:notifications';

export async function getPushPreferences(): Promise<PushPreferences> {
    const prefs = await getJSON<PushPreferences>(PREFS_KEY);
    return prefs ?? { ...DEFAULT_PREFERENCES };
}

export async function savePushPreferences(prefs: PushPreferences): Promise<void> {
    return setJSON(PREFS_KEY, prefs);
}

export async function getNotifications(): Promise<PushNotification[]> {
    return (await getJSON<PushNotification[]>(NOTIFICATIONS_KEY)) ?? [];
}

export async function saveNotifications(notifications: PushNotification[]): Promise<void> {
    return setJSON(NOTIFICATIONS_KEY, notifications);
}

// ─── Permission ─────────────────────────────────────────────────

/**
 * Request push notification permission.
 * Stub: In production, uses expo-notifications.
 */
export async function requestPermission(): Promise<boolean> {
    // In production: use Notifications.requestPermissionsAsync()
    const prefs = await getPushPreferences();
    await savePushPreferences({ ...prefs, enabled: true });
    return true;
}

// ─── Token Registration ─────────────────────────────────────────

/**
 * Register push token with the server.
 * Stub: In production, POST token to /api/push/register.
 */
export async function registerPushToken(token: string): Promise<void> {
    const prefs = await getPushPreferences();
    await savePushPreferences({ ...prefs, pushToken: token });
    // In production: POST to server
    console.log('[Push] Token registered:', token.slice(0, 10) + '...');
}

// ─── Notification CRUD ──────────────────────────────────────────

export async function addNotification(notification: PushNotification): Promise<void> {
    const notifications = await getNotifications();
    notifications.unshift(notification); // Newest first
    // Keep last 100
    const trimmed = notifications.slice(0, 100);
    await saveNotifications(trimmed);
}

export async function markAsRead(notificationId: string): Promise<void> {
    const notifications = await getNotifications();
    const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n,
    );
    await saveNotifications(updated);
}

export async function markAllAsRead(): Promise<void> {
    const notifications = await getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    await saveNotifications(updated);
}

export async function getUnreadCount(): Promise<number> {
    const notifications = await getNotifications();
    return notifications.filter(n => !n.read).length;
}

// ─── Category Toggle ────────────────────────────────────────────

export async function toggleCategory(
    category: NotificationCategory,
    enabled: boolean,
): Promise<void> {
    const prefs = await getPushPreferences();
    await savePushPreferences({
        ...prefs,
        categories: { ...prefs.categories, [category]: enabled },
    });
}

// ─── Quiet Hours ────────────────────────────────────────────────

export async function setQuietHours(start: number, end: number): Promise<void> {
    const prefs = await getPushPreferences();
    await savePushPreferences({ ...prefs, quietHoursStart: start, quietHoursEnd: end });
}

export function isInQuietHours(prefs: PushPreferences): boolean {
    if (prefs.quietHoursStart === null || prefs.quietHoursEnd === null) return false;
    const currentHour = new Date().getHours();
    if (prefs.quietHoursStart < prefs.quietHoursEnd) {
        return currentHour >= prefs.quietHoursStart && currentHour < prefs.quietHoursEnd;
    }
    // Wraps midnight (e.g. 22:00 - 07:00)
    return currentHour >= prefs.quietHoursStart || currentHour < prefs.quietHoursEnd;
}

// ─── Notification Factories ─────────────────────────────────────

export function createNotification(
    category: NotificationCategory,
    title: string,
    body: string,
    data?: Record<string, string>,
): PushNotification {
    return {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        category,
        title,
        body,
        data,
        timestamp: Date.now(),
        read: false,
    };
}

// Pre-built notification templates
export const NOTIFICATION_TEMPLATES = {
    friendChallenge: (name: string) =>
        createNotification('friend_challenge', `${name} challenges you! ⚔️`, 'Accept their 1v1 challenge and show who\'s boss!'),
    clanWar: (clanName: string) =>
        createNotification('clan_war', `Clan War Started! ⚔️`, `${clanName} has been matched — rally your team!`),
    tournamentStart: (name: string) =>
        createNotification('tournament_start', `${name} is starting! 🏆`, 'Your tournament match is about to begin.'),
    eventStart: (name: string) =>
        createNotification('event_start', `New Event: ${name} 🎉`, 'A new event is live — complete challenges for rewards!'),
    eventEnding: (name: string) =>
        createNotification('event_ending', `${name} ending soon! ⏰`, 'Only 2 hours left to complete this event.'),
    dailyReward: () =>
        createNotification('daily_reward', 'Daily Reward Ready! 🎁', 'Log in to collect your daily coins and keep your streak.'),
    vipGems: () =>
        createNotification('vip_gems_ready', 'VIP Gems Ready! 💎', 'Your daily 15 gems are waiting to be collected.'),
} as const;
