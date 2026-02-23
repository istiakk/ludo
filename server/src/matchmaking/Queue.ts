/**
 * Ludo: Legends — Matchmaking Queue
 * 
 * ELO-based matchmaking with expanding search radius.
 * 
 * SME Agent: nodejs-backend-patterns, performance-engineer
 */

interface QueuePlayer {
    socketId: string;
    playerId: string;
    playerName: string;
    mode: string;
    matchType: string;
    elo: number;
    joinedAt: number;
}

export class MatchmakingQueue {
    private queue: QueuePlayer[] = [];
    private readonly ELO_RANGE_INITIAL = 100;
    private readonly ELO_RANGE_EXPANSION = 50;
    private readonly EXPANSION_INTERVAL_MS = 5000; // Expand range every 5 seconds

    addPlayer(player: QueuePlayer): void {
        // Remove if already in queue
        this.removePlayer(player.socketId);
        this.queue.push(player);
    }

    removePlayer(socketId: string): void {
        this.queue = this.queue.filter(p => p.socketId !== socketId);
    }

    size(): number {
        return this.queue.length;
    }

    /**
     * Find a match for the given match type and mode.
     * Returns matched players or null if no match found.
     */
    findMatch(matchType: string, mode: string): QueuePlayer[] | null {
        const requiredPlayers = matchType === '2v2' ? 4 : 2;
        const candidates = this.queue.filter(
            p => p.matchType === matchType && p.mode === mode
        );

        if (candidates.length < requiredPlayers) return null;

        // Sort by ELO for closest matching
        candidates.sort((a, b) => a.elo - b.elo);

        // Find the tightest group
        let bestGroup: QueuePlayer[] | null = null;
        let bestSpread = Infinity;

        for (let i = 0; i <= candidates.length - requiredPlayers; i++) {
            const group = candidates.slice(i, i + requiredPlayers);
            const spread = group[group.length - 1].elo - group[0].elo;

            // Check if within acceptable ELO range (expands over time)
            const maxWaitTime = Math.max(
                ...group.map(p => Date.now() - p.joinedAt)
            );
            const expansions = Math.floor(maxWaitTime / this.EXPANSION_INTERVAL_MS);
            const allowedRange = this.ELO_RANGE_INITIAL + expansions * this.ELO_RANGE_EXPANSION;

            if (spread <= allowedRange && spread < bestSpread) {
                bestSpread = spread;
                bestGroup = group;
            }
        }

        if (bestGroup) {
            // Remove matched players from queue
            for (const player of bestGroup) {
                this.removePlayer(player.socketId);
            }
            return bestGroup;
        }

        return null;
    }
}
