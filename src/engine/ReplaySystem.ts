/**
 * Ludo: Legends — Replay System
 * 
 * Record matches and play them back move-by-move.
 * Supports saving, loading, and spectator viewing.
 */

import { GameState, Move, DiceRoll, GameMode, MatchType, PlayerColor } from './types';

// ─── Types ──────────────────────────────────────────────────────

export interface ReplayFrame {
    turnNumber: number;
    playerColor: PlayerColor;
    diceRoll: DiceRoll;
    move: Move | null; // null = skipped turn
    timestamp: number;
    capturedToken?: string;
    isClutch?: boolean;
}

export interface ReplayData {
    id: string;
    version: number;
    mode: GameMode;
    matchType: MatchType;
    players: Array<{
        color: PlayerColor;
        name: string;
        isAI: boolean;
    }>;
    frames: ReplayFrame[];
    winner: PlayerColor | null;
    startedAt: number;
    endedAt: number;
    totalDuration: number;
    totalCaptures: number;
    clutchFrameIndex: number | null; // Index of the highlight frame
}

export interface ReplayPlayer {
    currentFrame: number;
    totalFrames: number;
    isPlaying: boolean;
    playbackSpeed: number; // 1 = normal, 2 = 2x, 0.5 = half speed
}

// ─── Recording ──────────────────────────────────────────────────

/**
 * Start recording a replay from a game state.
 */
export function startRecording(state: GameState): ReplayData {
    return {
        id: `replay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        version: 1,
        mode: state.mode,
        matchType: state.matchType,
        players: state.players.map(p => ({
            color: p.color,
            name: p.name,
            isAI: p.isAI,
        })),
        frames: [],
        winner: null,
        startedAt: Date.now(),
        endedAt: 0,
        totalDuration: 0,
        totalCaptures: 0,
        clutchFrameIndex: null,
    };
}

/**
 * Add a frame to the replay.
 */
export function addFrame(
    replay: ReplayData,
    playerColor: PlayerColor,
    diceRoll: DiceRoll,
    move: Move | null,
): ReplayData {
    // A move is considered "Clutch" if it's a capture or a finishing move
    const isClutch = move?.type === 'capture' || move?.type === 'finish';

    const frame: ReplayFrame = {
        turnNumber: replay.frames.length + 1,
        playerColor,
        diceRoll,
        move,
        timestamp: Date.now(),
        capturedToken: move?.capturedToken ?? undefined,
        isClutch,
    };

    const newFrames = [...replay.frames, frame];

    // Update clutchFrameIndex if this is the most exciting move yet
    // Prefer captures over finishes, and newer moves over older ones
    let newClutchIndex = replay.clutchFrameIndex;
    if (isClutch) {
        if (newClutchIndex === null) {
            newClutchIndex = newFrames.length - 1;
        } else {
            const existingClutch = newFrames[newClutchIndex];
            if (move?.type === 'capture' && existingClutch.move?.type !== 'capture') {
                newClutchIndex = newFrames.length - 1;
            } else if (move?.type === 'capture') {
                // Latest capture wins
                newClutchIndex = newFrames.length - 1;
            }
        }
    }

    return {
        ...replay,
        frames: newFrames,
        totalCaptures: replay.totalCaptures + (move?.type === 'capture' ? 1 : 0),
        clutchFrameIndex: newClutchIndex,
    };
}

/**
 * Finalize a replay when the match ends.
 */
export function finalizeReplay(
    replay: ReplayData,
    winner: PlayerColor | null,
): ReplayData {
    const endedAt = Date.now();
    return {
        ...replay,
        winner,
        endedAt,
        totalDuration: endedAt - replay.startedAt,
    };
}

// ─── Playback ───────────────────────────────────────────────────

/**
 * Create a replay player for playback.
 */
export function createReplayPlayer(replay: ReplayData): ReplayPlayer {
    return {
        currentFrame: 0,
        totalFrames: replay.frames.length,
        isPlaying: false,
        playbackSpeed: 1,
    };
}

/**
 * Advance to the next frame.
 */
export function nextFrame(player: ReplayPlayer): ReplayPlayer {
    if (player.currentFrame >= player.totalFrames - 1) {
        return { ...player, isPlaying: false };
    }
    return { ...player, currentFrame: player.currentFrame + 1 };
}

/**
 * Go back one frame.
 */
export function prevFrame(player: ReplayPlayer): ReplayPlayer {
    if (player.currentFrame <= 0) return player;
    return { ...player, currentFrame: player.currentFrame - 1 };
}

/**
 * Jump to a specific frame.
 */
export function seekFrame(player: ReplayPlayer, frame: number): ReplayPlayer {
    const clamped = Math.max(0, Math.min(frame, player.totalFrames - 1));
    return { ...player, currentFrame: clamped };
}

/**
 * Toggle playback.
 */
export function togglePlay(player: ReplayPlayer): ReplayPlayer {
    return { ...player, isPlaying: !player.isPlaying };
}

/**
 * Change playback speed.
 */
export function setSpeed(player: ReplayPlayer, speed: number): ReplayPlayer {
    return { ...player, playbackSpeed: speed };
}

/**
 * Get the current frame from a replay.
 */
export function getCurrentFrame(
    replay: ReplayData,
    player: ReplayPlayer,
): ReplayFrame | null {
    if (player.currentFrame >= replay.frames.length) return null;
    return replay.frames[player.currentFrame];
}

/**
 * Get playback delay (ms) between frames based on speed.
 */
export function getFrameDelay(player: ReplayPlayer): number {
    const baseDelay = 1000; // 1 second per move at 1x
    return baseDelay / player.playbackSpeed;
}

/**
 * Get replay progress percentage.
 */
export function getProgress(player: ReplayPlayer): number {
    if (player.totalFrames === 0) return 0;
    return Math.round((player.currentFrame / (player.totalFrames - 1)) * 100);
}

// ─── Serialization ──────────────────────────────────────────────

/**
 * Serialize a replay to JSON string for storage/sharing.
 */
export function serializeReplay(replay: ReplayData): string {
    return JSON.stringify(replay);
}

/**
 * Deserialize a replay from JSON string.
 */
export function deserializeReplay(json: string): ReplayData | null {
    try {
        const parsed = JSON.parse(json);
        if (parsed.version !== 1) return null;
        return parsed as ReplayData;
    } catch {
        return null;
    }
}

/**
 * Get a shareable replay summary.
 */
export function getReplaySummary(replay: ReplayData): string {
    const mins = Math.floor(replay.totalDuration / 60_000);
    const secs = Math.floor((replay.totalDuration % 60_000) / 1000);
    const winnerName = replay.players.find(p => p.color === replay.winner)?.name ?? 'Unknown';

    return [
        `🎲 Ludo: Legends Replay`,
        `Mode: ${replay.mode.toUpperCase()} | ${replay.matchType}`,
        `Winner: ${winnerName} (${replay.winner})`,
        `Turns: ${replay.frames.length} | Captures: ${replay.totalCaptures}`,
        `Duration: ${mins}m ${secs}s`,
    ].join('\n');
}
