import type { Player, MatchPlayer, TournamentMatch, TournamentStanding, TournamentData, MatchType, MatchSide } from "@/types";

/**
 * Generate a round robin schedule using the circle method
 * For N players: N-1 rounds if N is even, N rounds if N is odd (with bye)
 */
export function generateRoundRobinSchedule(players: MatchPlayer[]): TournamentMatch[][] {
  const n = players.length;
  if (n < 2) return [];

  // Add a "bye" player if odd number
  const participants = [...players];
  if (n % 2 === 1) {
    participants.push({ id: "bye", name: "BYE", gender: "male", skillLevel: 0 });
  }

  const numRounds = participants.length - 1;
  const halfSize = participants.length / 2;
  const schedule: TournamentMatch[][] = [];

  // Create initial array of indices
  const indices = participants.map((_, i) => i);

  for (let round = 0; round < numRounds; round++) {
    const roundMatches: TournamentMatch[] = [];

    for (let i = 0; i < halfSize; i++) {
      const homeIdx = indices[i];
      const awayIdx = indices[participants.length - 1 - i];
      const playerA = participants[homeIdx];
      const playerB = participants[awayIdx];

      // Skip matches with BYE
      if (playerA.id === "bye" || playerB.id === "bye") continue;

      roundMatches.push({
        id: `r${round + 1}-m${i + 1}`,
        round: round + 1,
        playerA,
        playerB,
        scoreA: null,
        scoreB: null,
        winner: null,
        status: "pending",
      });
    }

    schedule.push(roundMatches);

    // Rotate indices (keep first fixed, rotate rest)
    const last = indices.pop()!;
    indices.splice(1, 0, last);
  }

  return schedule;
}

/**
 * Calculate standings from tournament schedule
 */
export function calculateStandings(
  players: MatchPlayer[],
  schedule: TournamentMatch[][]
): TournamentStanding[] {
  // Initialize standings for each player
  const standingsMap = new Map<string, TournamentStanding>();

  for (const player of players) {
    standingsMap.set(player.id, {
      player,
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      rank: 0,
    });
  }

  // Process all completed matches
  for (const round of schedule) {
    for (const match of round) {
      if (match.status !== "completed" || match.winner === null) continue;

      const standingA = standingsMap.get(match.playerA.id);
      const standingB = standingsMap.get(match.playerB.id);

      if (standingA) {
        standingA.played++;
        if (match.winner === "a") {
          standingA.wins++;
          standingA.points += 2;
        } else {
          standingA.losses++;
        }
      }

      if (standingB) {
        standingB.played++;
        if (match.winner === "b") {
          standingB.wins++;
          standingB.points += 2;
        } else {
          standingB.losses++;
        }
      }
    }
  }

  // Sort standings by points (desc), then by wins (desc)
  const standings = Array.from(standingsMap.values());
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });

  // Assign ranks
  let currentRank = 1;
  for (let i = 0; i < standings.length; i++) {
    if (i > 0 && standings[i].points === standings[i - 1].points) {
      standings[i].rank = standings[i - 1].rank;
    } else {
      standings[i].rank = currentRank;
    }
    currentRank++;
  }

  return standings;
}

/**
 * Create a new tournament from selected players
 */
export function createTournament(
  players: Player[],
  matchType: MatchType
): TournamentData {
  // Convert to MatchPlayer format
  const matchPlayers: MatchPlayer[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    skillLevel: p.skillLevel,
  }));

  const schedule = generateRoundRobinSchedule(matchPlayers);
  const standings = calculateStandings(matchPlayers, schedule);

  return {
    format: "round_robin",
    matchType,
    schedule,
    standings,
    currentRound: 1,
    isComplete: false,
  };
}

/**
 * Record a match result and update tournament state
 */
export function recordTournamentMatchResult(
  tournament: TournamentData,
  matchId: string,
  scoreA: number,
  scoreB: number
): TournamentData {
  // Find and update the match
  const newSchedule = tournament.schedule.map((round) =>
    round.map((match) => {
      if (match.id === matchId) {
        const winner: MatchSide = scoreA > scoreB ? "a" : "b";
        return {
          ...match,
          scoreA,
          scoreB,
          winner,
          status: "completed" as const,
        };
      }
      return match;
    })
  );

  // Get all players from schedule
  const playersMap = new Map<string, MatchPlayer>();
  for (const round of tournament.schedule) {
    for (const match of round) {
      playersMap.set(match.playerA.id, match.playerA);
      playersMap.set(match.playerB.id, match.playerB);
    }
  }
  const players = Array.from(playersMap.values());

  // Recalculate standings
  const standings = calculateStandings(players, newSchedule);

  // Check if tournament is complete
  const totalMatches = newSchedule.flat().length;
  const completedMatches = newSchedule.flat().filter((m) => m.status === "completed").length;
  const isComplete = completedMatches === totalMatches;

  // Determine current round (first round with pending matches)
  let currentRound = tournament.currentRound;
  for (let i = 0; i < newSchedule.length; i++) {
    if (newSchedule[i].some((m) => m.status === "pending")) {
      currentRound = i + 1;
      break;
    }
    if (i === newSchedule.length - 1) {
      currentRound = newSchedule.length;
    }
  }

  return {
    ...tournament,
    schedule: newSchedule,
    standings,
    currentRound,
    isComplete,
  };
}

/**
 * Detect appropriate match type based on player genders
 */
export function detectMatchType(players: Player[]): MatchType {
  const hasMale = players.some((p) => p.gender === "male");
  const hasFemale = players.some((p) => p.gender === "female");

  if (hasMale && !hasFemale) return "MS";
  if (hasFemale && !hasMale) return "WS";
  // Mixed genders - default to MS (user can change)
  return "MS";
}
