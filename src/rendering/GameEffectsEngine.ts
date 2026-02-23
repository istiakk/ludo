/**
 * Ludo: Legends — Game Effects Engine
 *
 * Central adrenaline coordinator. Tracks combos, streaks, momentum,
 * and emits typed events for the rendering layer to consume.
 *
 * No React dependency — pure logic that the UI layer observes.
 */

// ─── Types ──────────────────────────────────────────────────────

export type GameEffect =
    | { type: 'combo'; count: number; label: string }
    | { type: 'streak'; count: number }
    | { type: 'screen_shake'; intensity: ScreenShakeIntensity }
    | { type: 'flash'; color: 'gold' | 'red' | 'blue' }
    | { type: 'slow_motion'; durationMs: number }
    | { type: 'near_miss'; tokenId: string }
    | { type: 'comeback'; isActive: boolean }
    | { type: 'momentum_shift'; leader: string; value: number }
    | { type: 'lucky_roll'; value: number }
    | { type: 'perfect_finish' }
    | { type: 'first_blood'; capturer: string; victim: string };

export type ScreenShakeIntensity = 'light' | 'medium' | 'heavy' | 'earthquake';

export interface MatchStats {
    capturesMade: Record<string, number>;
    capturesReceived: Record<string, number>;
    tokensFinished: Record<string, number>;
    totalTokens: Record<string, number>;
    sixesRolled: Record<string, number>;
    consecutiveSixes: Record<string, number>;
    turnsPlayed: Record<string, number>;
    comboCount: number;          // Current active combo (resets on non-capture turn)
    maxCombo: number;            // Highest combo this match
    isFirstCapture: boolean;     // Track first blood
}

// ─── Combo Labels ───────────────────────────────────────────────

const COMBO_LABELS: Record<number, string> = {
    2: 'DOUBLE KILL! 💥',
    3: 'TRIPLE KILL! 🔥🔥',
    4: 'ULTRA KILL! ⚡⚡⚡',
    5: 'RAMPAGE! 💀💀💀💀',
    6: 'GODLIKE! 👑',
};

function getComboLabel(count: number): string {
    if (count >= 6) return COMBO_LABELS[6];
    return COMBO_LABELS[count] ?? `COMBO x${count}!`;
}

// ─── Shake Intensity by Combo ───────────────────────────────────

function getShakeIntensity(comboCount: number): ScreenShakeIntensity {
    if (comboCount >= 4) return 'earthquake';
    if (comboCount >= 3) return 'heavy';
    if (comboCount >= 2) return 'medium';
    return 'light';
}

// ─── Engine ─────────────────────────────────────────────────────

export function createMatchStats(playerIds: string[], tokensPerPlayer: number): MatchStats {
    const record = <T>(val: T) =>
        Object.fromEntries(playerIds.map(id => [id, val])) as Record<string, T>;

    return {
        capturesMade: record(0),
        capturesReceived: record(0),
        tokensFinished: record(0),
        totalTokens: record(tokensPerPlayer),
        sixesRolled: record(0),
        consecutiveSixes: record(0),
        turnsPlayed: record(0),
        comboCount: 0,
        maxCombo: 0,
        isFirstCapture: true,
    };
}

/**
 * Process a capture event. Returns effects to fire.
 */
export function processCaptureEvent(
    stats: MatchStats,
    capturerId: string,
    victimId: string,
): { stats: MatchStats; effects: GameEffect[] } {
    const effects: GameEffect[] = [];
    const updated = { ...stats };

    // Track captures
    updated.capturesMade = { ...updated.capturesMade, [capturerId]: (updated.capturesMade[capturerId] ?? 0) + 1 };
    updated.capturesReceived = { ...updated.capturesReceived, [victimId]: (updated.capturesReceived[victimId] ?? 0) + 1 };

    // First blood
    if (updated.isFirstCapture) {
        updated.isFirstCapture = false;
        effects.push({ type: 'first_blood', capturer: capturerId, victim: victimId });
    }

    // Combo
    updated.comboCount += 1;
    updated.maxCombo = Math.max(updated.maxCombo, updated.comboCount);

    if (updated.comboCount >= 2) {
        effects.push({ type: 'combo', count: updated.comboCount, label: getComboLabel(updated.comboCount) });
    }

    // Screen shake (always on capture, intensity scales with combo)
    effects.push({ type: 'screen_shake', intensity: getShakeIntensity(updated.comboCount) });

    // Flash
    effects.push({ type: 'flash', color: 'gold' });

    // Momentum
    const momentum = calculateMomentum(updated);
    effects.push({ type: 'momentum_shift', leader: momentum.leader, value: momentum.value });

    // Comeback detection
    const comebackActive = detectComeback(updated, capturerId);
    if (comebackActive) {
        effects.push({ type: 'comeback', isActive: true });
    }

    return { stats: updated, effects };
}

/**
 * Process a dice roll event.
 */
export function processDiceRoll(
    stats: MatchStats,
    playerId: string,
    value: number,
): { stats: MatchStats; effects: GameEffect[] } {
    const effects: GameEffect[] = [];
    const updated = { ...stats };

    updated.turnsPlayed = { ...updated.turnsPlayed, [playerId]: (updated.turnsPlayed[playerId] ?? 0) + 1 };

    if (value === 6) {
        updated.sixesRolled = { ...updated.sixesRolled, [playerId]: (updated.sixesRolled[playerId] ?? 0) + 1 };
        updated.consecutiveSixes = { ...updated.consecutiveSixes, [playerId]: (updated.consecutiveSixes[playerId] ?? 0) + 1 };

        const consecutive = updated.consecutiveSixes[playerId] ?? 0;
        if (consecutive >= 2) {
            effects.push({ type: 'lucky_roll', value: consecutive });
        }
    } else {
        updated.consecutiveSixes = { ...updated.consecutiveSixes, [playerId]: 0 };
    }

    return { stats: updated, effects };
}

/**
 * Process a non-capture move (resets combo).
 */
export function processNonCaptureMove(stats: MatchStats): MatchStats {
    return { ...stats, comboCount: 0 };
}

/**
 * Process a token finishing.
 */
export function processTokenFinish(
    stats: MatchStats,
    playerId: string,
): { stats: MatchStats; effects: GameEffect[] } {
    const effects: GameEffect[] = [];
    const updated = { ...stats };

    updated.tokensFinished = {
        ...updated.tokensFinished,
        [playerId]: (updated.tokensFinished[playerId] ?? 0) + 1,
    };

    // Perfect finish: all tokens done
    const totalTokens = updated.totalTokens[playerId] ?? 4;
    if ((updated.tokensFinished[playerId] ?? 0) >= totalTokens) {
        effects.push({ type: 'perfect_finish' });
    }

    return { stats: updated, effects };
}

// ─── Momentum Calculation ───────────────────────────────────────

interface MomentumResult {
    leader: string;
    value: number; // 0 to 1
}

function calculateMomentum(stats: MatchStats): MomentumResult {
    let bestPlayer = '';
    let bestScore = -1;
    let totalScore = 0;

    for (const [playerId, finished] of Object.entries(stats.tokensFinished)) {
        const captures = stats.capturesMade[playerId] ?? 0;
        const score = finished * 3 + captures * 2;
        totalScore += score;
        if (score > bestScore) {
            bestScore = score;
            bestPlayer = playerId;
        }
    }

    return {
        leader: bestPlayer,
        value: totalScore > 0 ? bestScore / totalScore : 0,
    };
}

// ─── Comeback Detection ─────────────────────────────────────────

function detectComeback(stats: MatchStats, playerId: string): boolean {
    const myFinished = stats.tokensFinished[playerId] ?? 0;
    const myReceived = stats.capturesReceived[playerId] ?? 0;

    // Player was behind (more captures received than others, fewer finishes)
    for (const [otherId, otherFinished] of Object.entries(stats.tokensFinished)) {
        if (otherId === playerId) continue;
        if (otherFinished >= myFinished + 2 && myReceived >= 2) {
            return true;
        }
    }
    return false;
}

// ─── Near-Miss Detection ────────────────────────────────────────

/**
 * Check if a move results in a near-miss (landing 1 cell from an opponent).
 * Called by the game store after processing a move.
 */
export function checkNearMiss(
    movedTokenPosition: number,
    opponentPositions: number[],
): boolean {
    return opponentPositions.some(pos =>
        Math.abs(pos - movedTokenPosition) === 1
    );
}
