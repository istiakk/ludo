/**
 * Ludo: Legends — Game State Manager
 * 
 * Orchestrates the full game lifecycle: initialization, dice rolls,
 * move execution, turn management, and win detection.
 * Pure functions — no side effects, no UI dependencies.
 * Runs identically on client (preview) and server (authoritative).
 * 
 * SME Agent: game-development, senior-architect
 */

import {
    GameState,
    GameMode,
    MatchType,
    GamePhase,
    Player,
    PlayerColor,
    Token,
    TokenId,
    DiceRoll,
    Move,
    MatchStats,
    AIDifficulty,
    BOARD,
    PLAYER_COLORS,
} from './types';
import { rollDice, isSix, isTripleSixPenalty } from './Dice';
import { getValidMoves, getsExtraTurn, getNextPlayerIndex, checkWinner, getPlayerTokens } from './Rules';
import { relativeToGlobal } from './Board';

// ─── Game Initialization ────────────────────────────────────────

/**
 * Creates a fresh game state with all tokens in home yards.
 */
export function createGameState(
    players: Player[],
    mode: GameMode = 'classic',
    matchType: MatchType = '1v1',
): GameState {
    const tokens = {} as Record<TokenId, Token>;

    for (const player of players) {
        for (let i = 0; i < BOARD.TOKENS_PER_PLAYER; i++) {
            const tokenId: TokenId = `${player.color}-${i as 0 | 1 | 2 | 3}`;
            tokens[tokenId] = {
                id: tokenId,
                color: player.color,
                index: i,
                state: 'home',
                position: 0,
                globalPosition: -1,
            };
        }
    }

    return {
        id: generateGameId(),
        mode,
        matchType,
        phase: 'rolling',
        players,
        tokens,
        currentPlayerIndex: 0,
        currentDice: null,
        consecutiveSixes: 0,
        validMoves: [],
        moveHistory: [],
        turnNumber: 1,
        winner: null,
        startedAt: Date.now(),
        lastMoveAt: Date.now(),
    };
}

/**
 * Creates default players for a given match configuration.
 */
export function createPlayers(
    matchType: MatchType,
    humanName: string = 'You',
    aiDifficulty: AIDifficulty = 'intermediate',
): Player[] {
    const colors: PlayerColor[] = matchType === '1v1'
        ? ['red', 'green']
        : ['red', 'green', 'yellow', 'blue'];

    return colors.map((color, i) => ({
        id: `player-${i}`,
        name: i === 0 ? humanName : (matchType === 'vs_ai' ? `AI ${i}` : `Player ${i + 1}`),
        color,
        isAI: matchType === 'vs_ai' ? i > 0 : false,
        aiDifficulty: matchType === 'vs_ai' && i > 0 ? aiDifficulty : undefined,
    }));
}

// ─── Dice Rolling ───────────────────────────────────────────────

/**
 * Processes a dice roll and computes valid moves.
 * Returns a new game state (immutable update).
 */
export function processDiceRoll(state: GameState, roll?: DiceRoll): GameState {
    const diceRoll = roll ?? rollDice();
    const consecutiveSixes = isSix(diceRoll)
        ? state.consecutiveSixes + 1
        : 0;

    // Triple-six penalty: last-moved active token goes home
    if (isTripleSixPenalty(consecutiveSixes)) {
        const currentColor = state.players[state.currentPlayerIndex].color;
        const newTokens = { ...state.tokens };

        // Find the last-moved active token and send it home
        const lastMove = state.moveHistory.length > 0
            ? state.moveHistory[state.moveHistory.length - 1]
            : null;
        if (lastMove && newTokens[lastMove.tokenId]?.state === 'active') {
            newTokens[lastMove.tokenId] = {
                ...newTokens[lastMove.tokenId],
                state: 'home',
                position: 0,
                globalPosition: -1,
            };
        }

        return {
            ...state,
            tokens: newTokens,
            currentDice: diceRoll,
            consecutiveSixes: 0,
            validMoves: [],
            phase: 'moving', // Will auto-skip to next player
        };
    }

    const validMoves = getValidMoves(state, diceRoll.value);

    return {
        ...state,
        currentDice: diceRoll,
        consecutiveSixes,
        validMoves,
        phase: validMoves.length > 0 ? 'moving' : 'moving', // Even if no moves, transition to moving phase
    };
}

// ─── Move Execution ─────────────────────────────────────────────

/**
 * Executes a move and returns the updated game state.
 * This is the most critical function — it mutates tokens, handles captures,
 * checks for wins, and manages turn order.
 */
export function executeMove(state: GameState, move: Move): GameState {
    const newTokens = { ...state.tokens };
    const movingToken = { ...newTokens[move.tokenId] };

    // Update the moving token
    movingToken.position = move.to;
    movingToken.globalPosition = move.type === 'enter_home' || move.type === 'finish'
        ? -1
        : relativeToGlobal(move.to, movingToken.color);

    if (move.type === 'spawn') {
        movingToken.state = 'active';
    } else if (move.type === 'finish') {
        movingToken.state = 'finished';
    }

    newTokens[move.tokenId] = movingToken;

    // Handle capture — send opponent token back to home
    if (move.capturedToken) {
        const capturedToken = { ...newTokens[move.capturedToken] };
        capturedToken.state = 'home';
        capturedToken.position = 0;
        capturedToken.globalPosition = -1;
        newTokens[move.capturedToken] = capturedToken;
    }

    const newMoveHistory = [...state.moveHistory, move];

    // Check for winner
    const newState: GameState = {
        ...state,
        tokens: newTokens,
        moveHistory: newMoveHistory,
        lastMoveAt: Date.now(),
        phase: 'animating', // Transition to animation phase
    };

    const winner = checkWinner(newState);
    if (winner) {
        return {
            ...newState,
            winner,
            phase: 'finished',
        };
    }

    // Determine next turn
    const extraTurn = getsExtraTurn(
        move,
        state.currentDice?.value ?? 0,
        state.consecutiveSixes,
        state.mode,
    );

    if (extraTurn) {
        return {
            ...newState,
            phase: 'rolling',
            currentDice: null,
            validMoves: [],
        };
    }

    return advanceTurn(newState);
}

/**
 * Skips the current player's turn (when no valid moves are available).
 */
export function skipTurn(state: GameState): GameState {
    const extraTurn = state.currentDice && isSix(state.currentDice)
        && state.consecutiveSixes < 3;

    if (extraTurn) {
        return {
            ...state,
            phase: 'rolling',
            currentDice: null,
            validMoves: [],
        };
    }

    return advanceTurn(state);
}

/**
 * Advances to the next player's turn.
 */
function advanceTurn(state: GameState): GameState {
    const nextPlayerIndex = getNextPlayerIndex(
        state.currentPlayerIndex,
        state.players.length,
    );

    return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        currentDice: null,
        consecutiveSixes: 0,
        validMoves: [],
        turnNumber: state.turnNumber + 1,
        phase: 'rolling',
    };
}

// ─── Match Statistics ───────────────────────────────────────────

/**
 * Computes end-of-match statistics for the scorecard.
 */
export function computeMatchStats(state: GameState): MatchStats {
    const captures: Record<PlayerColor, number> = { red: 0, green: 0, yellow: 0, blue: 0 };
    const distanceTraveled: Record<PlayerColor, number> = { red: 0, green: 0, yellow: 0, blue: 0 };
    const sixesRolled: Record<PlayerColor, number> = { red: 0, green: 0, yellow: 0, blue: 0 };
    const tokensFinished: Record<PlayerColor, number> = { red: 0, green: 0, yellow: 0, blue: 0 };

    for (const move of state.moveHistory) {
        const token = state.tokens[move.tokenId];
        if (token) {
            distanceTraveled[token.color] += move.diceValue;
            if (move.type === 'capture') captures[token.color]++;
            if (move.diceValue === 6) sixesRolled[token.color]++;
        }
    }

    for (const token of Object.values(state.tokens)) {
        if (token.state === 'finished') {
            tokensFinished[token.color]++;
        }
    }

    // Detect comeback: winner had fewer finished tokens than an opponent at midpoint
    const midpoint = Math.floor(state.moveHistory.length / 2);
    let comebackWin = false;
    if (state.winner) {
        const winnerFinished = tokensFinished[state.winner];
        for (const color of Object.keys(tokensFinished) as PlayerColor[]) {
            if (color !== state.winner && tokensFinished[color] > 0) {
                // If any opponent had more tokens finished, it's a comeback
                if (winnerFinished > tokensFinished[color]) {
                    // Simplified: check if winner had fewer active tokens early
                    const earlyMoves = state.moveHistory.slice(0, midpoint);
                    const winnerEarlyCaptures = earlyMoves.filter(
                        m => m.capturedToken && state.tokens[m.tokenId]?.color !== state.winner
                    ).length;
                    if (winnerEarlyCaptures > 0) comebackWin = true;
                }
            }
        }
    }

    return {
        duration: Date.now() - state.startedAt,
        totalMoves: state.moveHistory.length,
        captures,
        distanceTraveled,
        tokensFinished,
        sixesRolled,
        comebackWin,
    };
}

// ─── Utilities ──────────────────────────────────────────────────

function generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Gets the current player from the game state.
 */
export function getCurrentPlayer(state: GameState): Player {
    return state.players[state.currentPlayerIndex];
}

/**
 * Checks if it's a specific player's turn.
 */
export function isPlayerTurn(state: GameState, playerId: string): boolean {
    return getCurrentPlayer(state).id === playerId;
}
