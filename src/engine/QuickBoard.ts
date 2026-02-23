/**
 * Ludo: Legends — Quick Board Logic
 * 
 * Shortened board variant for 5-minute games:
 * - 28-cell outer track (vs 52 standard)
 * - 4-cell home column (vs 6 standard)
 * - 2 tokens per player (vs 4 standard)
 * - 5-minute hard time limit
 * - Auto-spawn first token
 * 
 * All functions mirror Board.ts but use QUICK_BOARD constants.
 */

import {
    PlayerColor,
    QUICK_BOARD,
    BOARD,
    Token,
    TokenId,
} from './types';

// ─── Path Calculation ───────────────────────────────────────────

export function quickRelativeToGlobal(position: number, color: PlayerColor): number {
    if (position <= 0 || position > QUICK_BOARD.TRACK_LENGTH) {
        return -1;
    }
    return (QUICK_BOARD.START_POSITIONS[color] + position - 1) % QUICK_BOARD.TRACK_LENGTH;
}

export function quickGlobalToRelative(globalPos: number, color: PlayerColor): number {
    const startPos = QUICK_BOARD.START_POSITIONS[color];
    return ((globalPos - startPos + QUICK_BOARD.TRACK_LENGTH) % QUICK_BOARD.TRACK_LENGTH) + 1;
}

export function quickIsOnTrack(position: number): boolean {
    return position >= 1 && position <= QUICK_BOARD.TRACK_LENGTH;
}

export function quickIsInHomeColumn(position: number): boolean {
    return position > QUICK_BOARD.TRACK_LENGTH && position <= QUICK_BOARD.TOTAL_PATH_LENGTH;
}

export function quickIsFinished(position: number): boolean {
    return position >= QUICK_BOARD.TOTAL_PATH_LENGTH;
}

export function quickIsSafePosition(globalPos: number): boolean {
    return QUICK_BOARD.SAFE_POSITIONS.has(globalPos);
}

// ─── Token Queries ──────────────────────────────────────────────

export function quickGetTokensAtGlobalPosition(
    tokens: Record<string, Token>,
    globalPos: number,
): Token[] {
    return Object.values(tokens).filter(
        t => t.state === 'active' && t.globalPosition === globalPos,
    );
}

export function quickCanCapture(
    attacker: Token,
    targetGlobalPos: number,
    tokens: Record<string, Token>,
): boolean {
    if (quickIsSafePosition(targetGlobalPos)) return false;
    const occupants = quickGetTokensAtGlobalPosition(tokens, targetGlobalPos);
    return occupants.some(t => t.color !== attacker.color);
}

// ─── Board Config Helper ────────────────────────────────────────

/**
 * Returns the appropriate board constants based on game mode.
 */
export function getBoardConfig(mode: string) {
    if (mode === 'quick') {
        return {
            trackLength: QUICK_BOARD.TRACK_LENGTH,
            homeColumnLength: QUICK_BOARD.HOME_COLUMN_LENGTH,
            totalPathLength: QUICK_BOARD.TOTAL_PATH_LENGTH,
            tokensPerPlayer: QUICK_BOARD.TOKENS_PER_PLAYER,
            startPositions: QUICK_BOARD.START_POSITIONS,
            safePositions: QUICK_BOARD.SAFE_POSITIONS,
            timeLimitMs: QUICK_BOARD.TIME_LIMIT_MS,
            autoSpawn: QUICK_BOARD.AUTO_SPAWN,
        };
    }
    // Standard board
    return {
        trackLength: BOARD.TRACK_LENGTH,
        homeColumnLength: BOARD.HOME_COLUMN_LENGTH,
        totalPathLength: BOARD.TOTAL_PATH_LENGTH,
        tokensPerPlayer: BOARD.TOKENS_PER_PLAYER,
        startPositions: BOARD.START_POSITIONS,
        safePositions: BOARD.SAFE_POSITIONS,
        timeLimitMs: 0, // No time limit
        autoSpawn: false,
    };
}
