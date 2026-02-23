/**
 * Ludo: Legends — Core Type Definitions
 * 
 * Pure TypeScript types with zero UI dependencies.
 * Shared across client, server, and AI.
 */

// ─── Player & Color ─────────────────────────────────────────────
export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export const PLAYER_COLORS: readonly PlayerColor[] = ['red', 'green', 'yellow', 'blue'] as const;

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
}

export type AIDifficulty = 'casual' | 'intermediate' | 'expert' | 'grandmaster';

// ─── Token ──────────────────────────────────────────────────────
export type TokenId = `${PlayerColor}-${0 | 1 | 2 | 3}`;

export type TokenState = 'home' | 'active' | 'finished';

export interface Token {
  id: TokenId;
  color: PlayerColor;
  index: number;             // 0-3 within the player's set
  state: TokenState;
  position: number;          // 0-56 on the player's relative path (0 = home yard)
  globalPosition: number;    // 0-51 on the shared track, or -1 if home/finished/in home column
}

// ─── Board Constants ────────────────────────────────────────────
export const BOARD = {
  /** Total cells on the shared outer track */
  TRACK_LENGTH: 52,
  /** Number of cells in each player's home column (final stretch) */
  HOME_COLUMN_LENGTH: 6,
  /** Starting positions on the global track per color */
  START_POSITIONS: {
    red: 0,
    green: 13,
    yellow: 26,
    blue: 39,
  } as Record<PlayerColor, number>,
  /** Safe zone positions on the global track */
  SAFE_POSITIONS: new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]),
  /** Total cells a token travels from start to finish (track + home column) */
  TOTAL_PATH_LENGTH: 57,  // 51 track cells + 6 home column cells
  /** Tokens per player */
  TOKENS_PER_PLAYER: 4,
} as const;

// ─── Dice ───────────────────────────────────────────────────────
export interface DiceRoll {
  value: 1 | 2 | 3 | 4 | 5 | 6;
  timestamp: number;
  seed?: string;           // For transparency / anti-cheat proof
}

// ─── Move ───────────────────────────────────────────────────────
export interface Move {
  tokenId: TokenId;
  from: number;
  to: number;
  diceValue: number;
  type: MoveType;
  capturedToken?: TokenId;
}

export type MoveType = 
  | 'spawn'       // Token leaves home yard onto start position
  | 'advance'     // Normal move along the track
  | 'capture'     // Lands on opponent token
  | 'enter_home'  // Enters the home column final stretch
  | 'finish'      // Reaches the center / finish cell
  | 'blocked';    // Cannot move (occupied safe zone)

// ─── Game State ─────────────────────────────────────────────────
export type GamePhase = 'waiting' | 'rolling' | 'moving' | 'animating' | 'finished';

export type GameMode = 'classic' | 'speed' | 'pro' | 'casual';

export type MatchType = '1v1' | '2v2' | 'vs_ai';

export interface GameState {
  id: string;
  mode: GameMode;
  matchType: MatchType;
  phase: GamePhase;
  players: Player[];
  tokens: Record<TokenId, Token>;
  currentPlayerIndex: number;
  currentDice: DiceRoll | null;
  consecutiveSixes: number;
  validMoves: Move[];
  moveHistory: Move[];
  turnNumber: number;
  winner: PlayerColor | null;
  startedAt: number;
  lastMoveAt: number;
}

// ─── Events (for multiplayer sync) ──────────────────────────────
export type GameEvent =
  | { type: 'ROLL_DICE'; playerId: string }
  | { type: 'DICE_RESULT'; roll: DiceRoll }
  | { type: 'SELECT_MOVE'; move: Move }
  | { type: 'MOVE_EXECUTED'; move: Move; newState: Partial<GameState> }
  | { type: 'TURN_SKIPPED'; playerId: string; reason: string }
  | { type: 'GAME_OVER'; winner: PlayerColor; stats: MatchStats }
  | { type: 'REMATCH_REQUEST'; playerId: string }
  | { type: 'PLAYER_CONNECTED'; playerId: string }
  | { type: 'PLAYER_DISCONNECTED'; playerId: string };

// ─── Stats ──────────────────────────────────────────────────────
export interface MatchStats {
  duration: number;
  totalMoves: number;
  captures: Record<PlayerColor, number>;
  distanceTraveled: Record<PlayerColor, number>;
  tokensFinished: Record<PlayerColor, number>;
  sixesRolled: Record<PlayerColor, number>;
  comebackWin: boolean;
}

// ─── Ranking ────────────────────────────────────────────────────
export interface PlayerRating {
  elo: number;
  tier: RankTier;
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
  clutchIndex: number;     // % of wins when trailing
}

export type RankTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'legend';
