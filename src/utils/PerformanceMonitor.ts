/**
 * Ludo: Legends — Performance Monitor
 * 
 * Lightweight FPS tracker, frame drop detector, and render stats
 * for development profiling.
 * 
 * SME Agent: performance-engineer, react-native-architecture
 */

interface FrameSample {
    timestamp: number;
    duration: number;
}

interface PerformanceStats {
    fps: number;
    avgFrameTime: number;
    droppedFrames: number;
    totalFrames: number;
    jankScore: number; // 0 = perfect, 100 = terrible
}

const TARGET_FRAME_TIME = 16.67; // 60fps
const JANK_THRESHOLD = 33.34; // >2 frames = jank

class PerformanceMonitor {
    private samples: FrameSample[] = [];
    private lastFrameTime: number = 0;
    private droppedFrames: number = 0;
    private totalFrames: number = 0;
    private isTracking: boolean = false;
    private readonly maxSamples: number = 120; // 2 seconds at 60fps

    /**
     * Start frame tracking.
     */
    start(): void {
        this.isTracking = true;
        this.lastFrameTime = performance.now();
        this.samples = [];
        this.droppedFrames = 0;
        this.totalFrames = 0;
    }

    /**
     * Record a frame. Call this from requestAnimationFrame or useFrameCallback.
     */
    recordFrame(): void {
        if (!this.isTracking) return;

        const now = performance.now();
        const duration = now - this.lastFrameTime;
        this.lastFrameTime = now;
        this.totalFrames++;

        if (duration > JANK_THRESHOLD) {
            this.droppedFrames++;
        }

        this.samples.push({ timestamp: now, duration });
        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }
    }

    /**
     * Get current performance statistics.
     */
    getStats(): PerformanceStats {
        if (this.samples.length < 2) {
            return { fps: 0, avgFrameTime: 0, droppedFrames: 0, totalFrames: 0, jankScore: 0 };
        }

        const avgFrameTime = this.samples.reduce((sum, s) => sum + s.duration, 0) / this.samples.length;
        const fps = Math.round(1000 / avgFrameTime);
        const jankScore = Math.min(100, Math.round((this.droppedFrames / Math.max(this.totalFrames, 1)) * 100));

        return {
            fps,
            avgFrameTime: Math.round(avgFrameTime * 100) / 100,
            droppedFrames: this.droppedFrames,
            totalFrames: this.totalFrames,
            jankScore,
        };
    }

    /**
     * Stop tracking and return final stats.
     */
    stop(): PerformanceStats {
        this.isTracking = false;
        return this.getStats();
    }

    /**
     * Check if current performance is acceptable.
     */
    isPerformanceGood(): boolean {
        const stats = this.getStats();
        return stats.fps >= 50 && stats.jankScore < 10;
    }

    /**
     * Reset all counters.
     */
    reset(): void {
        this.samples = [];
        this.droppedFrames = 0;
        this.totalFrames = 0;
        this.lastFrameTime = performance.now();
    }
}

// Singleton
export const performanceMonitor = new PerformanceMonitor();

// ─── Memory Utilities ───────────────────────────────────────────

/**
 * Estimate token pool memory usage.
 */
export function estimateGameMemory(tokenCount: number, boardSize: number): {
    estimatedMB: number;
    isWithinBudget: boolean;
} {
    // Rough estimates
    const tokenMemory = tokenCount * 200; // bytes per token object
    const boardMemory = boardSize * boardSize * 50; // grid cell data
    const stateMemory = 2048; // game state overhead
    const totalBytes = tokenMemory + boardMemory + stateMemory;
    const estimatedMB = totalBytes / (1024 * 1024);

    return {
        estimatedMB: Math.round(estimatedMB * 100) / 100,
        isWithinBudget: estimatedMB < 5, // 5MB budget for game state
    };
}

/**
 * Throttle function execution for performance-sensitive paths.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    intervalMs: number,
): T {
    let lastCall = 0;
    return ((...args: unknown[]) => {
        const now = Date.now();
        if (now - lastCall >= intervalMs) {
            lastCall = now;
            return fn(...args);
        }
    }) as T;
}
