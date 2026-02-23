/**
 * Ludo: Legends — Board Logic
 * 
 * Pure functions for board geometry, path calculation, and position queries.
 * Zero UI dependencies — runs identically on client and server.
 * 
 * SME Agent: game-development
 */

import {
    PlayerColor,
    PLAYER_COLORS,
    BOARD,
    Token,
    TokenId,
} from './types';

// ─── Path Calculation ───────────────────────────────────────────

/**
 * Converts a player-relative position (0-56) to a global track position (0-51).
 * Returns -1 if the token is in the home yard (position 0) or in the home column (position 52-57).
 */
export function relativeToGlobal(position: number, color: PlayerColor): number {
    if (position <= 0 || position > BOARD.TRACK_LENGTH) {
        return -1; // Home yard or home column
    }
    return (BOARD.START_POSITIONS[color] + position - 1) % BOARD.TRACK_LENGTH;
}

/**
 * Converts a global track position (0-51) to a player-relative position (1-51).
 */
export function globalToRelative(globalPos: number, color: PlayerColor): number {
    const startPos = BOARD.START_POSITIONS[color];
    return ((globalPos - startPos + BOARD.TRACK_LENGTH) % BOARD.TRACK_LENGTH) + 1;
}

/**
 * Checks if a player-relative position is on the shared outer track.
 */
export function isOnTrack(position: number): boolean {
    return position >= 1 && position <= BOARD.TRACK_LENGTH;
}

/**
 * Checks if a player-relative position is in the home column (final stretch).
 */
export function isInHomeColumn(position: number): boolean {
    return position > BOARD.TRACK_LENGTH && position <= BOARD.TOTAL_PATH_LENGTH;
}

/**
 * Checks if the token has reached the finish cell.
 */
export function isFinished(position: number): boolean {
    return position >= BOARD.TOTAL_PATH_LENGTH;
}

/**
 * Returns the home column index (1-6) if the token is in the home column.
 */
export function homeColumnIndex(position: number): number {
    if (!isInHomeColumn(position)) return -1;
    return position - BOARD.TRACK_LENGTH;
}

// ─── Safety Checks ──────────────────────────────────────────────

/**
 * Checks if a global track position is a safe zone.
 */
export function isSafePosition(globalPos: number): boolean {
    return BOARD.SAFE_POSITIONS.has(globalPos);
}

/**
 * Checks if a token at a given relative position is safe from capture.
 * Tokens are safe when:
 * - In home yard (position 0)
 * - On a safe zone cell
 * - In the home column (position > 52)
 * - On the start position with another friendly token
 */
export function isTokenSafe(position: number, color: PlayerColor): boolean {
    if (position <= 0) return true;                    // Home yard
    if (isInHomeColumn(position)) return true;          // Home column
    if (isFinished(position)) return true;             // Finished

    const globalPos = relativeToGlobal(position, color);
    return globalPos >= 0 && isSafePosition(globalPos);
}

// ─── Board Coordinates (for rendering) ──────────────────────────

export interface CellCoord {
    row: number;
    col: number;
}

/**
 * The Ludo board is a 15×15 grid.
 * This maps global track positions (0-51) to grid coordinates.
 */
const GLOBAL_TRACK_COORDS: CellCoord[] = [
    // Bottom arm (Red start area) → going up
    { row: 6, col: 1 },  // 0 — Red start (safe)
    { row: 6, col: 2 },  // 1
    { row: 6, col: 3 },  // 2
    { row: 6, col: 4 },  // 3
    { row: 6, col: 5 },  // 4
    { row: 5, col: 6 },  // 5
    { row: 4, col: 6 },  // 6
    { row: 3, col: 6 },  // 7
    { row: 2, col: 6 },  // 8 — safe
    { row: 1, col: 6 },  // 9
    { row: 0, col: 6 },  // 10
    { row: 0, col: 7 },  // 11
    { row: 0, col: 8 },  // 12

    // Top arm (Green start area) → going right
    { row: 1, col: 8 },  // 13 — Green start (safe)
    { row: 2, col: 8 },  // 14
    { row: 3, col: 8 },  // 15
    { row: 4, col: 8 },  // 16
    { row: 5, col: 8 },  // 17
    { row: 6, col: 9 },  // 18
    { row: 6, col: 10 }, // 19
    { row: 6, col: 11 }, // 20
    { row: 6, col: 12 }, // 21 — safe
    { row: 6, col: 13 }, // 22
    { row: 6, col: 14 }, // 23
    { row: 7, col: 14 }, // 24
    { row: 8, col: 14 }, // 25

    // Right arm (Yellow start area) → going down
    { row: 8, col: 13 }, // 26 — Yellow start (safe)
    { row: 8, col: 12 }, // 27
    { row: 8, col: 11 }, // 28
    { row: 8, col: 10 }, // 29
    { row: 8, col: 9 },  // 30
    { row: 9, col: 8 },  // 31
    { row: 10, col: 8 }, // 32
    { row: 11, col: 8 }, // 33
    { row: 12, col: 8 }, // 34 — safe
    { row: 13, col: 8 }, // 35
    { row: 14, col: 8 }, // 36
    { row: 14, col: 7 }, // 37
    { row: 14, col: 6 }, // 38

    // Bottom arm (Blue start area) → going left
    { row: 13, col: 6 }, // 39 — Blue start (safe)
    { row: 12, col: 6 }, // 40
    { row: 11, col: 6 }, // 41
    { row: 10, col: 6 }, // 42
    { row: 9, col: 6 },  // 43
    { row: 8, col: 5 },  // 44
    { row: 8, col: 4 },  // 45
    { row: 8, col: 3 },  // 46
    { row: 8, col: 2 },  // 47 — safe
    { row: 8, col: 1 },  // 48
    { row: 8, col: 0 },  // 49
    { row: 7, col: 0 },  // 50
    { row: 6, col: 0 },  // 51 (wraps to 0 next)
];

/**
 * Home column coordinates for each color (6 cells leading to center).
 */
const HOME_COLUMN_COORDS: Record<PlayerColor, CellCoord[]> = {
    red: [
        { row: 7, col: 1 },
        { row: 7, col: 2 },
        { row: 7, col: 3 },
        { row: 7, col: 4 },
        { row: 7, col: 5 },
        { row: 7, col: 6 },  // Finish
    ],
    green: [
        { row: 1, col: 7 },
        { row: 2, col: 7 },
        { row: 3, col: 7 },
        { row: 4, col: 7 },
        { row: 5, col: 7 },
        { row: 6, col: 7 },  // Finish
    ],
    yellow: [
        { row: 7, col: 13 },
        { row: 7, col: 12 },
        { row: 7, col: 11 },
        { row: 7, col: 10 },
        { row: 7, col: 9 },
        { row: 7, col: 8 },  // Finish
    ],
    blue: [
        { row: 13, col: 7 },
        { row: 12, col: 7 },
        { row: 11, col: 7 },
        { row: 10, col: 7 },
        { row: 9, col: 7 },
        { row: 8, col: 7 },  // Finish
    ],
};

/**
 * Home yard positions for each color (where tokens wait before spawning).
 */
const HOME_YARD_COORDS: Record<PlayerColor, CellCoord[]> = {
    // Red starts at global 0 (row 6, col 1) → home yard in bottom-left quadrant
    red: [
        { row: 10, col: 1 }, { row: 10, col: 3 },
        { row: 12, col: 1 }, { row: 12, col: 3 },
    ],
    // Green starts at global 13 (row 1, col 8) → home yard in top-left quadrant
    green: [
        { row: 1, col: 1 }, { row: 1, col: 3 },
        { row: 3, col: 1 }, { row: 3, col: 3 },
    ],
    // Yellow starts at global 26 (row 8, col 13) → home yard in top-right quadrant
    yellow: [
        { row: 1, col: 10 }, { row: 1, col: 12 },
        { row: 3, col: 10 }, { row: 3, col: 12 },
    ],
    // Blue starts at global 39 (row 13, col 6) → home yard in bottom-right quadrant
    blue: [
        { row: 10, col: 10 }, { row: 10, col: 12 },
        { row: 12, col: 10 }, { row: 12, col: 12 },
    ],
};

/**
 * Gets the grid coordinate for a token based on its state and position.
 */
export function getTokenCoord(token: Token): CellCoord {
    if (token.state === 'home') {
        return HOME_YARD_COORDS[token.color][token.index];
    }

    if (token.state === 'finished') {
        // Place at the last home column cell (center)
        return HOME_COLUMN_COORDS[token.color][5];
    }

    // Active token
    if (isInHomeColumn(token.position)) {
        const idx = homeColumnIndex(token.position) - 1;
        return HOME_COLUMN_COORDS[token.color][idx];
    }

    const globalPos = relativeToGlobal(token.position, token.color);
    if (globalPos >= 0 && globalPos < GLOBAL_TRACK_COORDS.length) {
        return GLOBAL_TRACK_COORDS[globalPos];
    }

    // Fallback (should never reach here)
    return HOME_YARD_COORDS[token.color][token.index];
}

/**
 * Returns all global track coordinates.
 */
export function getTrackCoords(): readonly CellCoord[] {
    return GLOBAL_TRACK_COORDS;
}

/**
 * Returns home column coordinates for a given color.
 */
export function getHomeColumnCoords(color: PlayerColor): readonly CellCoord[] {
    return HOME_COLUMN_COORDS[color];
}

/**
 * Returns home yard coordinates for a given color.
 */
export function getHomeYardCoords(color: PlayerColor): readonly CellCoord[] {
    return HOME_YARD_COORDS[color];
}

// ─── Threat Detection ───────────────────────────────────────────

/**
 * Finds all opponent tokens that could capture the given token within `range` dice values.
 * Used for tactical readability (threat highlights on the board).
 */
export function findThreats(
    token: Token,
    allTokens: Record<TokenId, Token>,
    range: number = 6,
): Token[] {
    if (token.state !== 'active' || isInHomeColumn(token.position)) return [];
    if (isTokenSafe(token.position, token.color)) return [];

    const targetGlobal = relativeToGlobal(token.position, token.color);
    if (targetGlobal < 0) return [];

    const threats: Token[] = [];

    for (const t of Object.values(allTokens)) {
        if (t.color === token.color) continue;
        if (t.state !== 'active') continue;
        if (isInHomeColumn(t.position)) continue;

        const tGlobal = relativeToGlobal(t.position, t.color);
        if (tGlobal < 0) continue;

        // Check if the opponent can reach our token within 1-6 steps
        for (let dice = 1; dice <= range; dice++) {
            const potentialGlobal = (tGlobal + dice) % BOARD.TRACK_LENGTH;
            if (potentialGlobal === targetGlobal) {
                threats.push(t);
                break;
            }
        }
    }

    return threats;
}
