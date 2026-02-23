/**
 * Ludo: Legends — 2v2 Team Engine
 * 
 * Team mechanics for 2v2 matches:
 * - Red+Yellow vs Green+Blue
 * - Shared win condition (both partners must finish all tokens)
 * - Teammates can't capture each other
 * - Team chat support
 */

import { PlayerColor } from './types';

// ─── Types ──────────────────────────────────────────────────────

export interface Team {
    id: 'team_a' | 'team_b';
    name: string;
    colors: [PlayerColor, PlayerColor];
}

export interface TeamConfig {
    teams: [Team, Team];
    colorToTeam: Record<PlayerColor, 'team_a' | 'team_b'>;
}

export interface TeamChatMessage {
    id: string;
    teamId: 'team_a' | 'team_b';
    senderColor: PlayerColor;
    senderName: string;
    message: string;
    timestamp: number;
}

// ─── Preset Quick Messages ─────────────────────────────────────

export const QUICK_MESSAGES = [
    '👍 Nice move!',
    '🎯 Go for it!',
    '🛡️ Play safe!',
    '⚔️ Attack!',
    '😅 Oops!',
    '🔥 Let\'s gooo!',
    '🤔 Hmm...',
    '💪 We got this!',
] as const;

// ─── Team Configuration ─────────────────────────────────────────

/**
 * Standard 2v2 team setup: Red+Yellow vs Green+Blue.
 * Diagonal partners (opposite corners).
 */
export function createTeamConfig(): TeamConfig {
    return {
        teams: [
            { id: 'team_a', name: 'Team Fire', colors: ['red', 'yellow'] },
            { id: 'team_b', name: 'Team Ocean', colors: ['green', 'blue'] },
        ],
        colorToTeam: {
            red: 'team_a',
            yellow: 'team_a',
            green: 'team_b',
            blue: 'team_b',
        },
    };
}

// ─── Team Logic ─────────────────────────────────────────────────

/**
 * Check if two players are teammates.
 */
export function areTeammates(
    color1: PlayerColor,
    color2: PlayerColor,
    config: TeamConfig,
): boolean {
    return config.colorToTeam[color1] === config.colorToTeam[color2];
}

/**
 * Check if a capture is allowed (can't capture teammates).
 */
export function canCapture(
    attackerColor: PlayerColor,
    targetColor: PlayerColor,
    config: TeamConfig,
): boolean {
    return !areTeammates(attackerColor, targetColor, config);
}

/**
 * Check if a team has won (both partners finished all tokens).
 */
export function isTeamVictory(
    finishedTokens: Record<PlayerColor, number>,
    config: TeamConfig,
): 'team_a' | 'team_b' | null {
    for (const team of config.teams) {
        const [color1, color2] = team.colors;
        if (finishedTokens[color1] >= 4 && finishedTokens[color2] >= 4) {
            return team.id;
        }
    }
    return null;
}

/**
 * Get the partner color for a given player.
 */
export function getPartnerColor(
    color: PlayerColor,
    config: TeamConfig,
): PlayerColor {
    const teamId = config.colorToTeam[color];
    const team = config.teams.find(t => t.id === teamId)!;
    return team.colors[0] === color ? team.colors[1] : team.colors[0];
}

/**
 * Get team progress (tokens finished by both partners).
 */
export function getTeamProgress(
    finishedTokens: Record<PlayerColor, number>,
    teamId: 'team_a' | 'team_b',
    config: TeamConfig,
): { finished: number; total: number; percent: number } {
    const team = config.teams.find(t => t.id === teamId)!;
    const finished = finishedTokens[team.colors[0]] + finishedTokens[team.colors[1]];
    const total = 8; // 4 tokens per player × 2 players
    return {
        finished,
        total,
        percent: Math.round((finished / total) * 100),
    };
}

/**
 * Create a team chat message.
 */
export function createTeamMessage(
    teamId: 'team_a' | 'team_b',
    senderColor: PlayerColor,
    senderName: string,
    message: string,
): TeamChatMessage {
    return {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
        teamId,
        senderColor,
        senderName,
        message,
        timestamp: Date.now(),
    };
}

/**
 * Get the team name and colors for display.
 */
export function getTeamDisplay(
    teamId: 'team_a' | 'team_b',
    config: TeamConfig,
): { name: string; colors: [PlayerColor, PlayerColor]; emoji: string } {
    const team = config.teams.find(t => t.id === teamId)!;
    return {
        name: team.name,
        colors: team.colors,
        emoji: teamId === 'team_a' ? '🔥' : '🌊',
    };
}
