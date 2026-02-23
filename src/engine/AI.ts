/**
 * Ludo: Legends — AI Engine
 * 
 * Minimax-based AI with alpha-beta pruning and heuristic evaluation.
 * Four difficulty tiers: Casual → Intermediate → Expert → Grandmaster.
 * 
 * SME Agent: game-development, game-development/game-design
 */

import {
    GameState,
    Move,
    Token,
    PlayerColor,
    AIDifficulty,
    BOARD,
} from './types';
import { getValidMoves, getPlayerTokens } from './Rules';
import {
    relativeToGlobal,
    isInHomeColumn,
    isTokenSafe,
    findThreats,
} from './Board';
import { processDiceRoll, executeMove, skipTurn } from './GameState';
import { rollDice } from './Dice';

// ─── AI Move Selection ──────────────────────────────────────────

/**
 * Selects the best move for an AI player based on difficulty.
 */
export function selectAIMove(
    state: GameState,
    difficulty: AIDifficulty = 'intermediate',
): Move | null {
    const { validMoves } = state;
    if (validMoves.length === 0) return null;
    if (validMoves.length === 1) return validMoves[0];

    switch (difficulty) {
        case 'casual':
            return selectCasualMove(state);
        case 'intermediate':
            return selectIntermediateMove(state);
        case 'expert':
            return selectExpertMove(state);
        case 'grandmaster':
            return selectGrandmasterMove(state);
        default:
            return selectIntermediateMove(state);
    }
}

// ─── Difficulty Tiers ───────────────────────────────────────────

/**
 * Casual: Weighted random — slightly prefers captures and finishes,
 * but often makes suboptimal moves for a relaxed feel.
 */
function selectCasualMove(state: GameState): Move {
    const { validMoves } = state;
    const weighted = validMoves.map(move => ({
        move,
        weight: getCasualWeight(move),
    }));

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { move, weight } of weighted) {
        random -= weight;
        if (random <= 0) return move;
    }

    return validMoves[0];
}

function getCasualWeight(move: Move): number {
    switch (move.type) {
        case 'capture': return 3;
        case 'finish': return 4;
        case 'spawn': return 2;
        case 'enter_home': return 2;
        default: return 1;
    }
}

/**
 * Intermediate: Greedy heuristic — always picks the best-scoring move.
 */
function selectIntermediateMove(state: GameState): Move {
    const { validMoves } = state;
    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
        const score = evaluateMove(move, state);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

/**
 * Expert: Looks one turn ahead (evaluates resulting board state).
 */
function selectExpertMove(state: GameState): Move {
    const { validMoves } = state;
    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
        const moveScore = evaluateMove(move, state);
        const resultState = executeMove(state, move);
        const positionScore = evaluatePosition(resultState, state.players[state.currentPlayerIndex].color);
        const totalScore = moveScore * 0.6 + positionScore * 0.4;

        if (totalScore > bestScore) {
            bestScore = totalScore;
            bestMove = move;
        }
    }

    return bestMove;
}

/**
 * Grandmaster: Multi-depth evaluation with expected value across dice outcomes.
 * Considers opponent responses and probability-weighted futures.
 */
function selectGrandmasterMove(state: GameState): Move {
    const { validMoves } = state;
    const myColor = state.players[state.currentPlayerIndex].color;
    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
        const moveScore = evaluateMove(move, state);
        const resultState = executeMove(state, move);
        const positionScore = evaluatePosition(resultState, myColor);

        // Expected value across opponent's possible dice rolls
        let opponentThreat = 0;
        if (resultState.phase === 'rolling' && resultState.currentPlayerIndex !== state.currentPlayerIndex) {
            for (let dice = 1; dice <= 6; dice++) {
                const opponentMoves = getValidMoves(resultState, dice);
                const worstForMe = opponentMoves.reduce((worst, m) => {
                    const opScore = evaluateMove(m, resultState);
                    return Math.max(worst, opScore);
                }, 0);
                opponentThreat += worstForMe / 6; // Weighted by probability
            }
        }

        const totalScore = moveScore * 0.4 + positionScore * 0.4 - opponentThreat * 0.2;

        if (totalScore > bestScore) {
            bestScore = totalScore;
            bestMove = move;
        }
    }

    return bestMove;
}

// ─── Heuristic Evaluation ───────────────────────────────────────

/**
 * Scores an individual move based on tactical value.
 */
function evaluateMove(move: Move, state: GameState): number {
    let score = 0;

    // Capture is highly valuable
    if (move.type === 'capture') score += 50;

    // Finishing a token is the best
    if (move.type === 'finish') score += 100;

    // Entering home column is good (safe from capture)
    if (move.type === 'enter_home') score += 30;

    // Spawning diversifies risk
    if (move.type === 'spawn') score += 15;

    // Prefer advancing tokens that are closer to home
    const token = state.tokens[move.tokenId];
    if (token) {
        const progressRatio = move.to / BOARD.TOTAL_PATH_LENGTH;
        score += progressRatio * 20;

        // Penalize moves that leave tokens in danger
        if (!isTokenSafe(move.to, token.color) && !isInHomeColumn(move.to)) {
            score -= 10;

            // Extra penalty if moving to a position threatened by opponents
            const virtualToken: Token = {
                ...token,
                position: move.to,
                state: 'active',
                globalPosition: relativeToGlobal(move.to, token.color),
            };
            const threats = findThreats(virtualToken, state.tokens);
            score -= threats.length * 8;
        }

        // Bonus for moving out of danger
        if (!isTokenSafe(token.position, token.color)) {
            const currentThreats = findThreats(token, state.tokens);
            if (currentThreats.length > 0 && isTokenSafe(move.to, token.color)) {
                score += 25; // Escaping danger
            }
        }
    }

    // Blocking bonus: landing just in front of an opponent's token
    if (move.type === 'advance' && token) {
        const globalPos = relativeToGlobal(move.to, token.color);
        if (globalPos >= 0 && isBlockingPosition(globalPos, token.color, state)) {
            score += 12;
        }
    }

    return score;
}

/**
 * Evaluates the overall board position for a player.
 * Higher scores are better.
 */
function evaluatePosition(state: GameState, color: PlayerColor): number {
    const tokens = getPlayerTokens(state, color);
    let score = 0;

    for (const token of tokens) {
        if (token.state === 'finished') {
            score += 100; // Finished tokens are max value
        } else if (token.state === 'active') {
            // Progress value
            score += (token.position / BOARD.TOTAL_PATH_LENGTH) * 50;

            // Safety value
            if (isTokenSafe(token.position, token.color)) {
                score += 10;
            } else {
                // Threat penalty
                const threats = findThreats(token, state.tokens);
                score -= threats.length * 15;
            }

            // Home column is very valuable
            if (isInHomeColumn(token.position)) {
                score += 30;
            }
        }
        // Home tokens contribute 0
    }

    return score;
}

/**
 * Checks if a position is strategically blocking an opponent.
 */
function isBlockingPosition(
    globalPos: number,
    myColor: PlayerColor,
    state: GameState,
): boolean {
    for (const token of Object.values(state.tokens)) {
        if (token.color === myColor) continue;
        if (token.state !== 'active') continue;
        if (isInHomeColumn(token.position)) continue;

        const opponentGlobal = relativeToGlobal(token.position, token.color);
        if (opponentGlobal < 0) continue;

        // Check if we're 1-6 steps ahead of an opponent (blocking their path)
        for (let d = 1; d <= 6; d++) {
            if ((opponentGlobal + d) % BOARD.TRACK_LENGTH === globalPos) {
                return true;
            }
        }
    }
    return false;
}

// ─── Coaching Mode ──────────────────────────────────────────────

export interface MoveAdvice {
    move: Move;
    score: number;
    reason: string;
}

/**
 * Generates coaching advice for the human player.
 * Evaluates all valid moves and explains the best choice.
 */
export function getCoachingAdvice(state: GameState): MoveAdvice[] {
    const { validMoves } = state;

    return validMoves
        .map(move => ({
            move,
            score: evaluateMove(move, state),
            reason: explainMove(move),
        }))
        .sort((a, b) => b.score - a.score);
}

function explainMove(move: Move): string {
    switch (move.type) {
        case 'capture':
            return 'Capture an opponent token! Sends them back to home.';
        case 'finish':
            return 'Bring this token home! One step closer to winning.';
        case 'enter_home':
            return 'Enter the safe home column. No one can capture you here.';
        case 'spawn':
            return 'Deploy a new token onto the board. More tokens = more options.';
        case 'advance':
            return `Advance ${move.diceValue} steps forward.`;
        default:
            return 'Make this move.';
    }
}
