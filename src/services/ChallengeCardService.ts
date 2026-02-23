/**
 * Ludo: Legends — Challenge Card Service
 * 
 * Generate shareable "challenge cards" for social media.
 * Players post their match results to Facebook/Instagram/TikTok
 * with a deep link so viewers can challenge them directly.
 * 
 * Cards contain: match result, stats, rank badge, and challenge link.
 */

// ─── Types ──────────────────────────────────────────────────────

export type CardTemplate =
    | 'victory'         // Won a match — "I just destroyed [opponent] in Ludo!"
    | 'streak'          // Win streak milestone — "5 wins in a row! Can you stop me?"
    | 'comeback'        // Won from behind — "Down 3 tokens... still won 😤"
    | 'rank_up'         // Ranked up — "Just hit Gold! 🥇 Think you can beat me?"
    | 'perfect_game'    // Won without losing a token — "Flawless victory 💎"
    | 'speed_run'       // Won super fast — "Won in under 2 minutes ⚡"
    | 'capture_king'    // Most captures — "8 captures in one game 💀"
    | 'season_tier'     // Reached a season tier — "Tier 20 unlocked!"
    | 'custom';         // Custom challenge — "I dare you to beat my score"

export interface ChallengeCard {
    id: string;
    template: CardTemplate;
    headline: string;
    subheadline: string;
    stats: CardStat[];
    playerName: string;
    playerRank: string;
    playerAvatar: string | null;
    challengeLink: string;
    createdAt: number;
    expiresAt: number; // Challenge links expire in 7 days
}

export interface CardStat {
    label: string;
    value: string;
    icon: string;
}

export interface MatchResultInput {
    won: boolean;
    playerName: string;
    playerRank: string;
    playerAvatar: string | null;
    opponentName: string;
    captures: number;
    tokensFinished: number;
    durationMs: number;
    winStreak: number;
    comebackWin: boolean;
    mode: string;
}

export type SharePlatform = 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'clipboard' | 'other';

// ─── Card Generation ────────────────────────────────────────────

const CARD_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Auto-detect the best card template based on match results.
 */
export function detectBestTemplate(input: MatchResultInput): CardTemplate {
    if (!input.won) return 'custom'; // Only winners get challenge cards

    // Priority order: rarest achievements first
    if (input.tokensFinished === 4 && input.captures === 0 && input.durationMs < 120_000) {
        return 'speed_run';
    }
    if (input.tokensFinished === 4 && input.captures >= 6) {
        return 'capture_king';
    }
    if (input.comebackWin) return 'comeback';
    if (input.winStreak >= 5) return 'streak';
    if (input.durationMs < 150_000) return 'speed_run';
    if (input.captures >= 4) return 'capture_king';

    return 'victory';
}

/**
 * Generate a challenge card from match results.
 */
export function generateChallengeCard(
    input: MatchResultInput,
    template?: CardTemplate,
): ChallengeCard {
    const chosenTemplate = template ?? detectBestTemplate(input);
    const cardId = `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const challengeLink = `https://ludolegends.app/challenge/${cardId}`;
    const now = Date.now();
    const content = getTemplateContent(chosenTemplate, input);

    return {
        id: cardId,
        template: chosenTemplate,
        headline: content.headline,
        subheadline: content.subheadline,
        stats: content.stats,
        playerName: input.playerName,
        playerRank: input.playerRank,
        playerAvatar: input.playerAvatar,
        challengeLink,
        createdAt: now,
        expiresAt: now + CARD_EXPIRY_MS,
    };
}

/**
 * Get headline, subheadline, and stats for each template.
 */
function getTemplateContent(template: CardTemplate, input: MatchResultInput): {
    headline: string;
    subheadline: string;
    stats: CardStat[];
} {
    const durationMin = Math.floor(input.durationMs / 60_000);
    const durationSec = Math.floor((input.durationMs % 60_000) / 1000);
    const timeStr = durationMin > 0 ? `${durationMin}m ${durationSec}s` : `${durationSec}s`;

    switch (template) {
        case 'victory':
            return {
                headline: `Crushed ${input.opponentName}! 🏆`,
                subheadline: 'Think you can do better? Challenge me!',
                stats: [
                    { label: 'Captures', value: String(input.captures), icon: '⚔️' },
                    { label: 'Time', value: timeStr, icon: '⏱️' },
                    { label: 'Mode', value: input.mode.toUpperCase(), icon: '🎲' },
                ],
            };

        case 'streak':
            return {
                headline: `${input.winStreak} WINS IN A ROW! 🔥`,
                subheadline: 'Nobody can stop me. Prove me wrong.',
                stats: [
                    { label: 'Streak', value: `${input.winStreak}W`, icon: '🔥' },
                    { label: 'Last Win', value: timeStr, icon: '⏱️' },
                    { label: 'Captures', value: String(input.captures), icon: '⚔️' },
                ],
            };

        case 'comeback':
            return {
                headline: 'DOWN BAD. STILL WON. 😤',
                subheadline: `Beat ${input.opponentName} from behind!`,
                stats: [
                    { label: 'Comeback', value: 'YES', icon: '🔄' },
                    { label: 'Captures', value: String(input.captures), icon: '⚔️' },
                    { label: 'Time', value: timeStr, icon: '⏱️' },
                ],
            };

        case 'speed_run':
            return {
                headline: `WON IN ${timeStr.toUpperCase()}! ⚡`,
                subheadline: 'Can you beat my speed? I dare you.',
                stats: [
                    { label: 'Time', value: timeStr, icon: '⚡' },
                    { label: 'Captures', value: String(input.captures), icon: '⚔️' },
                    { label: 'Mode', value: input.mode.toUpperCase(), icon: '🎲' },
                ],
            };

        case 'capture_king':
            return {
                headline: `${input.captures} CAPTURES! 💀`,
                subheadline: 'Nobody\'s tokens are safe around me.',
                stats: [
                    { label: 'Captures', value: String(input.captures), icon: '💀' },
                    { label: 'Time', value: timeStr, icon: '⏱️' },
                    { label: 'Rank', value: input.playerRank, icon: '🏅' },
                ],
            };

        case 'rank_up':
            return {
                headline: `JUST HIT ${input.playerRank.toUpperCase()}! 🏅`,
                subheadline: 'Climbing the ladder. Try to catch me.',
                stats: [
                    { label: 'New Rank', value: input.playerRank, icon: '🏅' },
                    { label: 'Streak', value: `${input.winStreak}W`, icon: '🔥' },
                    { label: 'Mode', value: input.mode.toUpperCase(), icon: '🎲' },
                ],
            };

        case 'season_tier':
            return {
                headline: 'SEASON TIER UNLOCKED! ⭐',
                subheadline: 'Grinding through the season pass like a legend.',
                stats: [
                    { label: 'Wins', value: `${input.winStreak}+`, icon: '🏆' },
                    { label: 'Rank', value: input.playerRank, icon: '🏅' },
                    { label: 'Mode', value: input.mode.toUpperCase(), icon: '🎲' },
                ],
            };

        case 'perfect_game':
            return {
                headline: 'FLAWLESS VICTORY! 💎',
                subheadline: 'Won without losing a single token. Try me.',
                stats: [
                    { label: 'Tokens Lost', value: '0', icon: '🛡️' },
                    { label: 'Captures', value: String(input.captures), icon: '⚔️' },
                    { label: 'Time', value: timeStr, icon: '⏱️' },
                ],
            };

        default:
            return {
                headline: 'CHALLENGE ME! 🎲',
                subheadline: `I just played ${input.mode} mode. Think you can win?`,
                stats: [
                    { label: 'Mode', value: input.mode.toUpperCase(), icon: '🎲' },
                    { label: 'Rank', value: input.playerRank, icon: '🏅' },
                    { label: 'Time', value: timeStr, icon: '⏱️' },
                ],
            };
    }
}

// ─── Share Text Generation ──────────────────────────────────────

/**
 * Generate platform-optimized share text.
 */
export function generateShareText(
    card: ChallengeCard,
    platform: SharePlatform,
    creatorCode?: string,
): string {
    const codeTag = creatorCode ? `\nUse creator code "${creatorCode}" for a bonus! 🎁` : '';
    const link = card.challengeLink;

    switch (platform) {
        case 'twitter':
            return `${card.headline}\n\n${card.subheadline}${codeTag}\n\n🎲 ${link}\n\n#LudoLegends #MobileGaming`;

        case 'instagram':
            // Instagram doesn't allow links in captions, so focus on engagement
            return `${card.headline}\n\n${card.subheadline}\n\n🎲 ${card.stats.map(s => `${s.icon} ${s.label}: ${s.value}`).join(' | ')}${codeTag}\n\n#LudoLegends #MobileGaming #BoardGames #GamingCommunity`;

        case 'tiktok':
            return `${card.headline} ${card.subheadline}${codeTag} 🎲 Link in bio! #LudoLegends #Gaming`;

        case 'facebook':
            return `${card.headline}\n\n${card.subheadline}\n\n${card.stats.map(s => `${s.icon} ${s.label}: ${s.value}`).join('\n')}${codeTag}\n\nChallenge me: ${link}`;

        default:
            return `${card.headline}\n${card.subheadline}${codeTag}\n${link}`;
    }
}

/**
 * Track share events for analytics.
 */
export function trackShare(cardId: string, platform: SharePlatform): ShareEvent {
    return {
        cardId,
        platform,
        sharedAt: Date.now(),
    };
}

export interface ShareEvent {
    cardId: string;
    platform: SharePlatform;
    sharedAt: number;
}
