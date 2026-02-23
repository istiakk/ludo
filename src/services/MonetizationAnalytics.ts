/**
 * Ludo: Legends — Monetization Analytics
 * 
 * Revenue tracking, conversion funnels, and ARPU metrics.
 * All data stays local until a backend analytics service is connected.
 */

// ─── Types ──────────────────────────────────────────────────────

export type AnalyticsEvent =
    | { event: 'ad_watched'; placement: string; reward: string }
    | { event: 'ad_skipped'; placement: string }
    | { event: 'purchase_started'; productId: string; price: number }
    | { event: 'purchase_completed'; productId: string; price: number; currency: string }
    | { event: 'purchase_failed'; productId: string; reason: string }
    | { event: 'season_pass_bought'; seasonId: string }
    | { event: 'cosmetic_purchased'; cosmeticId: string; currency: string; amount: number }
    | { event: 'spin_performed'; result: string; rarity: string }
    | { event: 'daily_reward_claimed'; day: number; streak: number }
    | { event: 'mission_completed'; missionId: string; xpEarned: number }
    | { event: 'tier_reached'; tier: number; isPremium: boolean }
    | { event: 'session_start'; sessionId: string }
    | { event: 'session_end'; sessionId: string; durationMs: number };

export interface AnalyticsEntry {
    id: string;
    event: AnalyticsEvent;
    timestamp: number;
    sessionId: string;
}

export interface RevenueMetrics {
    totalRevenue: number;
    adRevenue: number;
    iapRevenue: number;
    seasonPassRevenue: number;
    adsWatched: number;
    purchaseCount: number;
    avgRevenuePerSession: number;
}

export type ConversionStage = 'installed' | 'played_match' | 'watched_ad' | 'visited_shop' | 'made_purchase';

export interface ConversionFunnel {
    stages: Record<ConversionStage, boolean>;
    currentStage: ConversionStage;
}

// ─── Analytics Service ──────────────────────────────────────────

class MonetizationAnalytics {
    private events: AnalyticsEntry[] = [];
    private currentSessionId: string = '';
    private sessionStartTime: number = 0;
    private funnel: ConversionFunnel = {
        stages: {
            installed: true,
            played_match: false,
            watched_ad: false,
            visited_shop: false,
            made_purchase: false,
        },
        currentStage: 'installed',
    };

    /**
     * Track an analytics event.
     */
    track(event: AnalyticsEvent): void {
        this.events.push({
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            event,
            timestamp: Date.now(),
            sessionId: this.currentSessionId,
        });

        // Auto-advance funnel
        this.advanceFunnel(event);

        // In production, batch and send to analytics backend
        // For now, keep local
    }

    /**
     * Start a new session.
     */
    startSession(): string {
        this.currentSessionId = `sess_${Date.now()}`;
        this.sessionStartTime = Date.now();
        this.track({ event: 'session_start', sessionId: this.currentSessionId });
        return this.currentSessionId;
    }

    /**
     * End the current session.
     */
    endSession(): void {
        if (this.currentSessionId) {
            this.track({
                event: 'session_end',
                sessionId: this.currentSessionId,
                durationMs: Date.now() - this.sessionStartTime,
            });
        }
    }

    /**
     * Calculate revenue metrics.
     */
    getRevenueMetrics(): RevenueMetrics {
        let adRevenue = 0;
        let iapRevenue = 0;
        let seasonPassRevenue = 0;
        let adsWatched = 0;
        let purchaseCount = 0;

        const sessions = new Set<string>();

        for (const entry of this.events) {
            sessions.add(entry.sessionId);
            const evt = entry.event;

            if (evt.event === 'ad_watched') {
                adsWatched++;
                adRevenue += 0.01; // Estimated eCPM: ~$10 → $0.01 per view
            }
            if (evt.event === 'purchase_completed') {
                iapRevenue += evt.price;
                purchaseCount++;
            }
            if (evt.event === 'season_pass_bought') {
                seasonPassRevenue += 4.99;
            }
        }

        const totalRevenue = adRevenue + iapRevenue + seasonPassRevenue;
        const sessionCount = Math.max(sessions.size, 1);

        return {
            totalRevenue: round2(totalRevenue),
            adRevenue: round2(adRevenue),
            iapRevenue: round2(iapRevenue),
            seasonPassRevenue: round2(seasonPassRevenue),
            adsWatched,
            purchaseCount,
            avgRevenuePerSession: round2(totalRevenue / sessionCount),
        };
    }

    /**
     * Get the conversion funnel status.
     */
    getFunnel(): ConversionFunnel {
        return { ...this.funnel };
    }

    /**
     * Calculate ARPU (Average Revenue Per User).
     * In production, this would be per-user across the backend.
     */
    getARPU(daysSinceInstall: number): number {
        const metrics = this.getRevenueMetrics();
        if (daysSinceInstall <= 0) return 0;
        return round2(metrics.totalRevenue / daysSinceInstall);
    }

    /**
     * Get event count by type for dashboards.
     */
    getEventCounts(): Record<string, number> {
        const counts: Record<string, number> = {};
        for (const entry of this.events) {
            const key = entry.event.event;
            counts[key] = (counts[key] ?? 0) + 1;
        }
        return counts;
    }

    // ─── Private ────────────────────────────────────────────────

    private advanceFunnel(event: AnalyticsEvent): void {
        const stageMap: Partial<Record<AnalyticsEvent['event'], ConversionStage>> = {
            ad_watched: 'watched_ad',
            purchase_completed: 'made_purchase',
            cosmetic_purchased: 'visited_shop',
        };

        const stage = stageMap[event.event];
        if (stage) {
            this.funnel.stages[stage] = true;
            this.funnel.currentStage = stage;
        }
    }
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

// Singleton
export const monetizationAnalytics = new MonetizationAnalytics();
