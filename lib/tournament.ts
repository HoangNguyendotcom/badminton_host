import type { Player, MatchPlayer, TournamentMatch, TournamentStanding, TournamentData, MatchType, MatchSide, TournamentCompetitor, TournamentPair } from "@/types";

/**
 * Check if a match type is doubles
 */
export function isDoublesType(matchType: MatchType): boolean {
  return ["XD", "MD", "WD"].includes(matchType);
}

/**
 * Helper to get a unique ID for a competitor (player or pair)
 */
function getCompetitorId(competitor: TournamentCompetitor): string {
  if ("player1" in competitor) {
    return competitor.id;
  }
  return competitor.id;
}

/**
 * Generate a round robin schedule using the circle method
 * For N competitors: N-1 rounds if N is even, N rounds if N is odd (with bye)
 */
export function generateRoundRobinSchedule(competitors: TournamentCompetitor[]): TournamentMatch[][] {
  const n = competitors.length;
  if (n < 2) return [];

  // Add a "bye" competitor if odd number
  const participants = [...competitors];
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
      const teamA = participants[homeIdx];
      const teamB = participants[awayIdx];

      // Skip matches with BYE
      const teamAId = getCompetitorId(teamA);
      const teamBId = getCompetitorId(teamB);
      if (teamAId === "bye" || teamBId === "bye") continue;

      roundMatches.push({
        id: `r${round + 1}-m${i + 1}`,
        round: round + 1,
        teamA,
        teamB,
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
  competitors: TournamentCompetitor[],
  schedule: TournamentMatch[][]
): TournamentStanding[] {
  // Initialize standings for each competitor
  const standingsMap = new Map<string, TournamentStanding>();

  for (const competitor of competitors) {
    standingsMap.set(getCompetitorId(competitor), {
      competitor,
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

      const standingA = standingsMap.get(getCompetitorId(match.teamA));
      const standingB = standingsMap.get(getCompetitorId(match.teamB));

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
 * Create a new tournament from competitors (players for singles, pairs for doubles)
 */
export function createTournament(
  competitors: TournamentCompetitor[],
  matchType: MatchType
): TournamentData {
  const schedule = generateRoundRobinSchedule(competitors);
  const standings = calculateStandings(competitors, schedule);

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

  // Get all competitors from schedule
  const competitorsMap = new Map<string, TournamentCompetitor>();
  for (const round of tournament.schedule) {
    for (const match of round) {
      competitorsMap.set(getCompetitorId(match.teamA), match.teamA);
      competitorsMap.set(getCompetitorId(match.teamB), match.teamB);
    }
  }
  const competitors = Array.from(competitorsMap.values());

  // Recalculate standings
  const standings = calculateStandings(competitors, newSchedule);

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
