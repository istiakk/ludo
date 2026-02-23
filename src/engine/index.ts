/**
 * Ludo: Legends — Engine Barrel Export
 * 
 * Clean public API for the entire game engine.
 */

// Types
export * from './types';

// Board geometry & queries
export {
    relativeToGlobal,
    globalToRelative,
    isOnTrack,
    isInHomeColumn,
    isFinished,
    isTokenSafe,
    isSafePosition,
    getTokenCoord,
    getTrackCoords,
    getHomeColumnCoords,
    getHomeYardCoords,
    findThreats,
} from './Board';

// Dice system
export {
    rollDice,
    createServerDiceRoll,
    isValidDiceValue,
    isSix,
    isTripleSixPenalty,
    calculateDiceStats,
} from './Dice';

// Rules engine
export {
    getValidMoves,
    getPlayerTokens,
    getsExtraTurn,
    getNextPlayerIndex,
    checkWinner,
} from './Rules';

// Game state management
export {
    createGameState,
    createPlayers,
    processDiceRoll,
    executeMove,
    skipTurn,
    computeMatchStats,
    getCurrentPlayer,
    isPlayerTurn,
} from './GameState';

// AI
export {
    selectAIMove,
    getCoachingAdvice,
} from './AI';
