/**
 * Ludo: Legends — Dice System
 * 
 * Fair RNG with cryptographic seed support for anti-cheat transparency.
 * Zero UI dependencies — pure logic only.
 * 
 * SME Agent: game-development, mobile-security-coder
 */

import { DiceRoll } from './types';

// ─── Fair Dice Roll ─────────────────────────────────────────────

/**
 * Rolls a standard 6-sided die using Math.random().
 * For local / vs AI games.
 */
export function rollDice(): DiceRoll {
    const value = (Math.floor(Math.random() * 6) + 1) as DiceRoll['value'];
    return {
        value,
        timestamp: Date.now(),
    };
}

/**
 * Creates a dice roll from a server-provided value (for online multiplayer).
 * The server generates the roll with cryptographic RNG and sends it to clients.
 */
export function createServerDiceRoll(
    value: number,
    seed: string,
): DiceRoll {
    if (value < 1 || value > 6) {
        throw new Error(`Invalid dice value: ${value}. Must be 1-6.`);
    }
    return {
        value: value as DiceRoll['value'],
        timestamp: Date.now(),
        seed,
    };
}

// ─── Dice Fairness Utilities ────────────────────────────────────

/**
 * Validates that a dice value is within the legal range.
 */
export function isValidDiceValue(value: number): value is DiceRoll['value'] {
    return Number.isInteger(value) && value >= 1 && value <= 6;
}

/**
 * Checks if a roll is a six (which grants an extra turn in Ludo).
 */
export function isSix(roll: DiceRoll): boolean {
    return roll.value === 6;
}

/**
 * Checks if three consecutive sixes have been rolled (penalty in some rule variants).
 * In classic Ludo, three sixes in a row can forfeit the turn.
 */
export function isTripleSixPenalty(consecutiveSixes: number): boolean {
    return consecutiveSixes >= 3;
}

// ─── Dice Statistics (for fairness transparency UI) ─────────────

export interface DiceStats {
    totalRolls: number;
    distribution: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
    expectedFrequency: number;
    chiSquared: number;
    isFair: boolean;
}

/**
 * Calculates fairness statistics for a series of dice rolls.
 * Used in the "fair RNG transparency" UI to build player trust.
 */
export function calculateDiceStats(rolls: DiceRoll[]): DiceStats {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    for (const roll of rolls) {
        distribution[roll.value]++;
    }

    const totalRolls = rolls.length;
    const expectedFrequency = totalRolls / 6;

    // Chi-squared test for fairness
    let chiSquared = 0;
    for (let i = 1; i <= 6; i++) {
        const observed = distribution[i];
        chiSquared += Math.pow(observed - expectedFrequency, 2) / expectedFrequency;
    }

    // Critical value for chi-squared with 5 degrees of freedom at 95% confidence
    const criticalValue = 11.07;
    const isFair = chiSquared < criticalValue;

    return {
        totalRolls,
        distribution: distribution as DiceStats['distribution'],
        expectedFrequency,
        chiSquared,
        isFair,
    };
}
