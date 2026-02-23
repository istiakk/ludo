/**
 * Ludo: Legends — ELO Rating Engine
 * 
 * Standard ELO calculation with configurable K-factor.
 * 
 * SME Agent: game-development/game-design, nodejs-backend-patterns
 */

interface RatedPlayer {
    playerId: string;
    color: string;
    elo: number;
}

interface EloChange {
    playerId: string;
    oldElo: number;
    newElo: number;
    change: number;
}

export class EloEngine {
    private readonly K_FACTOR_NEW = 40;       // New players (< 30 games)
    private readonly K_FACTOR_NORMAL = 20;    // Regular players
    private readonly K_FACTOR_VETERAN = 10;   // High-rated players (> 2400)

    /**
     * Calculate ELO changes after a match.
     */
    calculateChanges(
        players: Array<{ playerId: string; color: string; elo: number }>,
        winnerColor: string,
    ): EloChange[] {
        const changes: EloChange[] = [];

        for (const player of players) {
            const isWinner = player.color === winnerColor;
            const opponents = players.filter(p => p.playerId !== player.playerId);

            let totalChange = 0;
            for (const opponent of opponents) {
                const expected = this.expectedScore(player.elo, opponent.elo);
                const actual = isWinner ? 1 : 0;
                const k = this.getKFactor(player.elo);
                totalChange += Math.round(k * (actual - expected));
            }

            // Average the change across opponents
            totalChange = Math.round(totalChange / Math.max(opponents.length, 1));

            changes.push({
                playerId: player.playerId,
                oldElo: player.elo,
                newElo: Math.max(0, player.elo + totalChange),
                change: totalChange,
            });
        }

        return changes;
    }

    /**
     * Expected score based on ELO ratings.
     */
    private expectedScore(playerElo: number, opponentElo: number): number {
        return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    }

    /**
     * K-factor based on rating level.
     */
    private getKFactor(elo: number): number {
        if (elo >= 2400) return this.K_FACTOR_VETERAN;
        return this.K_FACTOR_NORMAL;
    }
}
