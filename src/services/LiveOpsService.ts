/**
 * Ludo: Legends — LiveOps Event Framework
 * 
 * JSON-driven event definitions, scheduling, and state tracking.
 * Supports: flash challenges, themed weekends, festivals,
 * collection albums, mini battle passes, and milestone marathons.
 */

// ─── Event Types ────────────────────────────────────────────────

export type EventType =
    | 'flash_challenge'      // Short-duration task (2-6 hours)
    | 'themed_weekend'       // 2x reward modifier for specific action
    | 'festival'             // Multi-day themed event with unique rewards
    | 'collection_album'     // Collect stickers from matches
    | 'mini_battle_pass'     // Per-event tiered pass (10 tiers)
    | 'milestone_marathon';  // Community-wide goal

export type EventStatus = 'upcoming' | 'active' | 'completed' | 'expired';

export interface LiveEvent {
    id: string;
    type: EventType;
    title: string;
    description: string;
    icon: string;
    startTime: number;      // Unix timestamp
    endTime: number;
    rewards: EventReward[];
    conditions: EventCondition[];
    color: string;          // Accent color for UI
    status: EventStatus;
}

export interface EventReward {
    type: 'coins' | 'gems' | 'xp' | 'cosmetic' | 'title';
    amount?: number;
    itemId?: string;
    label: string;
}

export interface EventCondition {
    metric: EventMetric;
    target: number;
    current: number;
}

export type EventMetric =
    | 'wins'
    | 'games_played'
    | 'captures'
    | 'tokens_finished'
    | 'dice_sixes'
    | 'win_streak'
    | 'play_minutes';

// ─── Event State ────────────────────────────────────────────────

export interface EventProgress {
    eventId: string;
    conditions: EventCondition[];
    completed: boolean;
    claimed: boolean;
    startedAt: number;
}

export interface LiveOpsState {
    activeEvents: LiveEvent[];
    progress: Record<string, EventProgress>;
    lastRefresh: number;
}

// ─── Event Definitions ──────────────────────────────────────────

const now = Date.now;

export function createFlashChallenge(overrides?: Partial<LiveEvent>): LiveEvent {
    const start = now();
    return {
        id: `flash_${start}`,
        type: 'flash_challenge',
        title: 'Quick Strike!',
        description: 'Win 3 games in the next 2 hours',
        icon: '⚡',
        startTime: start,
        endTime: start + 2 * 60 * 60 * 1000,
        rewards: [{ type: 'coins', amount: 200, label: '200 Coins' }],
        conditions: [{ metric: 'wins', target: 3, current: 0 }],
        color: '#FFD700',
        status: 'active',
        ...overrides,
    };
}

export function createThemedWeekend(overrides?: Partial<LiveEvent>): LiveEvent {
    const start = now();
    return {
        id: `weekend_${start}`,
        type: 'themed_weekend',
        title: 'Capture Weekend',
        description: '2x capture rewards all weekend!',
        icon: '⚔️',
        startTime: start,
        endTime: start + 48 * 60 * 60 * 1000,
        rewards: [
            { type: 'coins', amount: 500, label: '500 Coins' },
            { type: 'gems', amount: 50, label: '50 Gems' },
        ],
        conditions: [{ metric: 'captures', target: 20, current: 0 }],
        color: '#E63946',
        status: 'active',
        ...overrides,
    };
}

export function createFestivalEvent(overrides?: Partial<LiveEvent>): LiveEvent {
    const start = now();
    return {
        id: `festival_${start}`,
        type: 'festival',
        title: 'Spring Festival 🌸',
        description: 'Complete festival missions for exclusive rewards!',
        icon: '🌸',
        startTime: start,
        endTime: start + 7 * 24 * 60 * 60 * 1000,
        rewards: [
            { type: 'cosmetic', itemId: 'dice_cherry_blossom', label: 'Cherry Blossom Dice' },
            { type: 'coins', amount: 2000, label: '2,000 Coins' },
            { type: 'title', itemId: 'title_festival_champion', label: 'Festival Champion' },
        ],
        conditions: [
            { metric: 'games_played', target: 20, current: 0 },
            { metric: 'wins', target: 10, current: 0 },
            { metric: 'captures', target: 30, current: 0 },
        ],
        color: '#FF69B4',
        status: 'active',
        ...overrides,
    };
}

export function createMilestoneMarathon(overrides?: Partial<LiveEvent>): LiveEvent {
    const start = now();
    return {
        id: `milestone_${start}`,
        type: 'milestone_marathon',
        title: 'Community Challenge',
        description: 'Together, finish 1 million tokens worldwide!',
        icon: '🌍',
        startTime: start,
        endTime: start + 14 * 24 * 60 * 60 * 1000,
        rewards: [{ type: 'gems', amount: 100, label: '100 Gems for everyone!' }],
        conditions: [{ metric: 'tokens_finished', target: 1_000_000, current: 0 }],
        color: '#2A9D8F',
        status: 'active',
        ...overrides,
    };
}

// ─── Event Manager ──────────────────────────────────────────────

/**
 * Get all currently active events.
 * In production, these would come from the server.
 * For now, we generate a rotating set of local events.
 */
export function getActiveEvents(): LiveEvent[] {
    const timestamp = now();
    const dayOfWeek = new Date(timestamp).getDay();
    const hourOfDay = new Date(timestamp).getHours();

    const events: LiveEvent[] = [];

    // Always have a flash challenge
    events.push(createFlashChallenge());

    // Themed weekend on Sat/Sun
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        events.push(createThemedWeekend());
    }

    // Milestone marathon always running
    events.push(createMilestoneMarathon());

    return events;
}

/**
 * Update progress for an event condition.
 */
export function updateEventProgress(
    state: LiveOpsState,
    metric: EventMetric,
    increment: number = 1,
): LiveOpsState {
    const updatedProgress = { ...state.progress };

    for (const event of state.activeEvents) {
        const progress = updatedProgress[event.id];
        if (!progress || progress.completed) continue;

        let allMet = true;
        const updatedConditions = progress.conditions.map(c => {
            if (c.metric === metric) {
                const updated = { ...c, current: c.current + increment };
                if (updated.current < updated.target) allMet = false;
                return updated;
            }
            if (c.current < c.target) allMet = false;
            return c;
        });

        updatedProgress[event.id] = {
            ...progress,
            conditions: updatedConditions,
            completed: allMet,
        };
    }

    return { ...state, progress: updatedProgress };
}

/**
 * Initialize progress tracking for a set of events.
 */
export function initializeEventProgress(events: LiveEvent[]): Record<string, EventProgress> {
    const progress: Record<string, EventProgress> = {};
    for (const event of events) {
        progress[event.id] = {
            eventId: event.id,
            conditions: event.conditions.map(c => ({ ...c, current: 0 })),
            completed: false,
            claimed: false,
            startedAt: Date.now(),
        };
    }
    return progress;
}
