/**
 * Ludo: Legends — Match Commentary
 *
 * Contextual play-by-play text banners for key game events.
 * Template-driven with player name injection and event-type coloring.
 */

// ─── Types ──────────────────────────────────────────────────────

export type CommentaryType = 'capture' | 'lucky' | 'danger' | 'finish' | 'comeback' | 'combo' | 'neutral' | 'first_blood';

export interface CommentaryLine {
    id: string;
    text: string;
    type: CommentaryType;
    timestamp: number;
}

// ─── Color Mapping ──────────────────────────────────────────────

export const COMMENTARY_COLORS: Record<CommentaryType, string> = {
    capture: '#FF4D6D',
    lucky: '#FFD700',
    danger: '#F85149',
    finish: '#3FB950',
    comeback: '#A855F7',
    combo: '#FF6B6B',
    neutral: '#58A6FF',
    first_blood: '#E63946',
};

// ─── Templates ──────────────────────────────────────────────────

const CAPTURE_LINES = [
    '{attacker} sends {victim}\'s token home! Brutal. 💀',
    '{attacker} captures {victim}! No mercy!',
    '{victim}\'s token is OUT! {attacker} strikes! ⚔️',
    'CAPTURED! {attacker} eliminates {victim}\'s token!',
    '{attacker} sends {victim} packing! 💥',
];

const LUCKY_ROLL_LINES = [
    'Back-to-back 6s! {player} is ON FIRE! 🔥🔥',
    'ANOTHER 6! {player} can\'t be stopped! 🎲',
    'Triple 6! {player} is UNSTOPPABLE! ⚡',
    '{player} rolls ANOTHER 6! Insane luck! 🍀',
];

const NEAR_MISS_LINES = [
    'Close call! {player}\'s token just dodged capture! 😰',
    'ONE cell away from disaster! {player} breathes easy. 💨',
    'Near miss! {player} got lucky this time! 😅',
];

const FINISH_LINES = [
    '{player}\'s token reaches home! 🏠',
    'HOME! {player} finishes a token! ⭐',
    '{player} brings one home! Only {remaining} left!',
];

const COMBO_LINES = [
    'DOUBLE KILL! {player} captures twice in a row! 💥💥',
    'TRIPLE! {player} is on a rampage! 🔥🔥🔥',
    'ULTRA COMBO! {player} is absolutely dominating! ⚡',
    'GODLIKE! {player} can\'t be stopped! 👑',
];

const COMEBACK_LINES = [
    'COMEBACK MODE! {player} is fighting back! 🔥',
    '{player} is down but not out! Momentum shifting! 💪',
    'Never count {player} out! Revival incoming! ⚡',
];

const FIRST_BLOOD_LINES = [
    'FIRST BLOOD! {attacker} draws first capture! 🩸',
    '{attacker} strikes first! The game is ON! ⚔️',
];

// ─── Commentary Generator ───────────────────────────────────────

let lineCounter = 0;

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
}

function createLine(text: string, type: CommentaryType): CommentaryLine {
    return {
        id: `commentary_${++lineCounter}_${Date.now()}`,
        text,
        type,
        timestamp: Date.now(),
    };
}

// ─── Public API ─────────────────────────────────────────────────

export function onCapture(attackerName: string, victimName: string): CommentaryLine {
    return createLine(
        fillTemplate(pickRandom(CAPTURE_LINES), { attacker: attackerName, victim: victimName }),
        'capture',
    );
}

export function onLuckyRoll(playerName: string, consecutiveSixes: number): CommentaryLine {
    const idx = Math.min(consecutiveSixes - 2, LUCKY_ROLL_LINES.length - 1);
    return createLine(
        fillTemplate(LUCKY_ROLL_LINES[Math.max(0, idx)], { player: playerName }),
        'lucky',
    );
}

export function onNearMiss(playerName: string): CommentaryLine {
    return createLine(
        fillTemplate(pickRandom(NEAR_MISS_LINES), { player: playerName }),
        'danger',
    );
}

export function onTokenFinish(playerName: string, remaining: number): CommentaryLine {
    return createLine(
        fillTemplate(pickRandom(FINISH_LINES), { player: playerName, remaining: String(remaining) }),
        'finish',
    );
}

export function onCombo(playerName: string, comboCount: number): CommentaryLine {
    const idx = Math.min(comboCount - 2, COMBO_LINES.length - 1);
    return createLine(
        fillTemplate(COMBO_LINES[Math.max(0, idx)], { player: playerName }),
        'combo',
    );
}

export function onComeback(playerName: string): CommentaryLine {
    return createLine(
        fillTemplate(pickRandom(COMEBACK_LINES), { player: playerName }),
        'comeback',
    );
}

export function onFirstBlood(attackerName: string): CommentaryLine {
    return createLine(
        fillTemplate(pickRandom(FIRST_BLOOD_LINES), { attacker: attackerName }),
        'first_blood',
    );
}
