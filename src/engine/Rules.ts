/**
 * Ludo: Legends — Rules Engine
 * 
 * Computes valid moves given a game state and dice roll.
 * Supports Classic, Speed, and Pro rule variants.
 * Zero UI dependencies.
 * 
 * SME Agent: game-development, game-development/game-design
 */

import {
    GameState,
    GameMode,
    Token,
    TokenId,
    Move,
    MoveType,
    PlayerColor,
    BOARD,
    PLAYER_COLORS,
} from './types';
import {
    relativeToGlobal,
    isOnTrack,
    isInHomeColumn,
    isFinished,
    isTokenSafe,
    isSafePosition,
} from './Board';

// ─── Valid Move Calculation ─────────────────────────────────────

/**
 * Computes all valid moves for the current player given a dice roll.
 * This is the core of Ludo logic.
 */
export function getValidMoves(state: GameState, diceValue: number): Move[] {
    const currentPlayer = state.players[state.currentPlayerIndex];
    const playerTokens = getPlayerTokens(state, currentPlayer.color);
    const moves: Move[] = [];

    for (const token of playerTokens) {
        const move = computeMove(token, diceValue, state);
        if (move !== null) {
            moves.push(move);
        }
    }

    return moves;
}

/**
 * Computes a single move for a token given a dice value.
 * Returns null if the move is illegal.
 */
function computeMove(
    token: Token,
    diceValue: number,
    state: GameState,
): Move | null {
    // ── Case 1: Token in home yard ──
    if (token.state === 'home') {
        // Speed mode: can spawn with 1 or 6
        if (state.mode === 'speed') {
            if (diceValue === 6 || diceValue === 1) {
                return createSpawnMove(token, state);
            }
        } else {
            if (diceValue === 6) {
                return createSpawnMove(token, state);
            }
        }
        return null;
    }

    // ── Case 2: Token already finished ──
    if (token.state === 'finished') {
        return null;
    }

    // ── Case 3: Token is active ──
    const newPosition = token.position + diceValue;

    // Can't overshoot the finish
    if (newPosition > BOARD.TOTAL_PATH_LENGTH) {
        return null;
    }

    // Check if entering home column
    if (isInHomeColumn(newPosition) || isFinished(newPosition)) {
        // Check the home column is clear (no friendly token blocking)
        if (isHomeColumnBlocked(token.color, token.position, newPosition, state)) {
            return null;
        }

        const moveType: MoveType = isFinished(newPosition) ? 'finish' : 'enter_home';
        return {
            tokenId: token.id,
            from: token.position,
            to: newPosition,
            diceValue,
            type: moveType,
        };
    }

    // Normal track movement
    const globalNewPos = relativeToGlobal(newPosition, token.color);

    // Casual mode: no captures allowed, just pass through
    if (state.mode === 'casual') {
        const moveType: MoveType = 'advance';
        return {
            tokenId: token.id,
            from: token.position,
            to: newPosition,
            diceValue,
            type: moveType,
        };
    }

    // Check for capture
    const capturedToken = findCaptureTarget(token.color, globalNewPos, state);

    // Check for blocking (friendly token on a safe zone)
    if (isFriendlyBlocking(token.color, globalNewPos, state)) {
        return null;
    }

    // Can't land on a safe zone occupied by enemy
    if (isSafePosition(globalNewPos) && isEnemyOnSafe(token.color, globalNewPos, state)) {
        return null;
    }

    const moveType: MoveType = capturedToken ? 'capture' : 'advance';
    return {
        tokenId: token.id,
        from: token.position,
        to: newPosition,
        diceValue,
        type: moveType,
        capturedToken: capturedToken?.id,
    };
}

/**
 * Creates a spawn move (token leaves home yard).
 */
function createSpawnMove(token: Token, state: GameState): Move | null {
    const startPosition = 1; // Player-relative start position
    const globalStart = relativeToGlobal(startPosition, token.color);

    // Check if own token is already on start (can't stack more than one in some variants)
    const friendlyOnStart = Object.values(state.tokens).find(
        t => t.color === token.color && t.state === 'active' &&
            relativeToGlobal(t.position, t.color) === globalStart
    );

    if (friendlyOnStart) {
        return null; // Can't spawn if own token is on start
    }

    // Check for capture on spawn
    const capturedToken = findCaptureTarget(token.color, globalStart, state);

    // Can't spawn onto safe zone occupied by enemy
    if (!capturedToken && isEnemyOnSafe(token.color, globalStart, state)) {
        return null;
    }

    return {
        tokenId: token.id,
        from: 0,
        to: startPosition,
        diceValue: 6,
        type: capturedToken ? 'capture' : 'spawn',
        capturedToken: capturedToken?.id,
    };
}

// ─── Helper Functions ───────────────────────────────────────────

/**
 * Gets all tokens belonging to a specific player.
 */
export function getPlayerTokens(state: GameState, color: PlayerColor): Token[] {
    return Object.values(state.tokens).filter(t => t.color === color);
}

/**
 * Finds an enemy token that would be captured at the given global position.
 * Returns null if no capture possible (safe zone, or no enemy present).
 */
function findCaptureTarget(
    attackerColor: PlayerColor,
    globalPos: number,
    state: GameState,
): Token | null {
    if (isSafePosition(globalPos)) return null; // Can't capture on safe zones

    for (const token of Object.values(state.tokens)) {
        if (token.color === attackerColor) continue;
        if (token.state !== 'active') continue;
        if (isInHomeColumn(token.position)) continue;

        const tokenGlobal = relativeToGlobal(token.position, token.color);
        if (tokenGlobal === globalPos) {
            return token;
        }
    }

    return null;
}

/**
 * Checks if a friendly token is blocking a global position.
 */
function isFriendlyBlocking(
    color: PlayerColor,
    globalPos: number,
    state: GameState,
): boolean {
    return Object.values(state.tokens).some(
        t => t.color === color && t.state === 'active' &&
            !isInHomeColumn(t.position) &&
            relativeToGlobal(t.position, t.color) === globalPos
    );
}

/**
 * Checks if an enemy token is sitting on a safe zone at the given position.
 */
function isEnemyOnSafe(
    myColor: PlayerColor,
    globalPos: number,
    state: GameState,
): boolean {
    if (!isSafePosition(globalPos)) return false;

    return Object.values(state.tokens).some(
        t => t.color !== myColor && t.state === 'active' &&
            !isInHomeColumn(t.position) &&
            relativeToGlobal(t.position, t.color) === globalPos
    );
}

/**
 * Checks if the home column path is blocked by a friendly token.
 */
function isHomeColumnBlocked(
    color: PlayerColor,
    fromPos: number,
    toPos: number,
    state: GameState,
): boolean {
    const friendlyTokens = Object.values(state.tokens).filter(
        t => t.color === color && t.state === 'active' && isInHomeColumn(t.position)
    );

    for (const t of friendlyTokens) {
        if (t.position >= Math.min(fromPos, toPos) + 1 && t.position <= toPos) {
            return true;
        }
    }

    return false;
}

// ─── Turn Management ────────────────────────────────────────────

/**
 * Determines if the current player gets another turn.
 * Extra turn conditions:
 * - Rolled a 6 (and not triple-six penalty)
 * - Captured an opponent token
 * - Token reached home (finish)
 */
export function getsExtraTurn(
    move: Move | null,
    diceValue: number,
    consecutiveSixes: number,
    mode: GameMode,
): boolean {
    // Triple-six penalty: lose the turn entirely (except Speed mode)
    if (diceValue === 6 && consecutiveSixes >= 2 && mode !== 'speed') {
        return false;
    }

    // Rolled a six → extra turn
    if (diceValue === 6) return true;

    // Captured an opponent → extra turn
    if (move && move.type === 'capture') return true;

    // Finished a token → extra turn
    if (move && move.type === 'finish') return true;

    // Speed mode: rolling a 1 also gives extra turn
    if (mode === 'speed' && diceValue === 1) return true;

    return false;
}

/**
 * Advances to the next player.
 */
export function getNextPlayerIndex(
    currentIndex: number,
    totalPlayers: number,
): number {
    return (currentIndex + 1) % totalPlayers;
}

// ─── Win Detection ──────────────────────────────────────────────

/**
 * Checks if a player has won (all 4 tokens finished).
 */
export function checkWinner(state: GameState): PlayerColor | null {
    for (const color of PLAYER_COLORS) {
        const tokens = getPlayerTokens(state, color);
        if (tokens.length > 0 && tokens.every(t => t.state === 'finished')) {
            return color;
        }
    }
    return null;
}
