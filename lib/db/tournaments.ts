// @ts-nocheck - Supabase types require env vars at compile time
import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { DbTournamentPair, DbTournamentBracket, DbTournamentStanding } from "@/types/database";

export type BracketType = "winners" | "losers";
export type ParticipantType = "player" | "pair";

// ============ Tournament Pairs ============

export interface CreatePairInput {
  sessionId: string;
  playerOneId: string;
  playerTwoId: string;
  pairName?: string;
  totalSkill: number;
  seedNumber?: number;
}

export async function createTournamentPair(input: CreatePairInput): Promise<DbTournamentPair | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("tournament_pairs")
    .insert({
      session_id: input.sessionId,
      player_one_id: input.playerOneId,
      player_two_id: input.playerTwoId,
      pair_name: input.pairName || null,
      total_skill: input.totalSkill,
      seed_number: input.seedNumber || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating tournament pair:", error);
    return null;
  }

  return data;
}

export async function getPairsBySession(sessionId: string): Promise<DbTournamentPair[]> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("tournament_pairs")
    .select("*")
    .eq("session_id", sessionId)
    .order("seed_number", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching tournament pairs:", error);
    return [];
  }

  return data || [];
}

export async function updatePairSeed(id: string, seedNumber: number | null): Promise<boolean> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from("tournament_pairs")
    .update({ seed_number: seedNumber })
    .eq("id", id);

  if (error) {
    console.error("Error updating pair seed:", error);
    return false;
  }

  return true;
}

export async function deleteTournamentPair(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from("tournament_pairs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting tournament pair:", error);
    return false;
  }

  return true;
}

// ============ Tournament Brackets ============

export interface CreateBracketInput {
  sessionId: string;
  bracketType: BracketType;
  roundNumber: number;
  positionInRound: number;
  participantOneId?: string;
  participantTwoId?: string;
}

export async function createBracketSlot(input: CreateBracketInput): Promise<DbTournamentBracket | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("tournament_brackets")
    .insert({
      session_id: input.sessionId,
      bracket_type: input.bracketType,
      round_number: input.roundNumber,
      position_in_round: input.positionInRound,
      participant_one_id: input.participantOneId || null,
      participant_two_id: input.participantTwoId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating bracket slot:", error);
    return null;
  }

  return data;
}

export async function getBracketsBySession(sessionId: string): Promise<DbTournamentBracket[]> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("tournament_brackets")
    .select("*")
    .eq("session_id", sessionId)
    .order("round_number", { ascending: true })
    .order("position_in_round", { ascending: true });

  if (error) {
    console.error("Error fetching brackets:", error);
    return [];
  }

  return data || [];
}

export async function updateBracketResult(
  id: string,
  winnerId: string,
  matchId?: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return false;

  const updates: { winner_id: string; match_id?: string } = { winner_id: winnerId };
  if (matchId) updates.match_id = matchId;

  const { error } = await supabase
    .from("tournament_brackets")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Error updating bracket result:", error);
    return false;
  }

  return true;
}

export async function advanceWinnerToNextRound(
  sessionId: string,
  currentRound: number,
  currentPosition: number,
  winnerId: string,
  bracketType: BracketType = "winners"
): Promise<boolean> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return false;

  const nextRound = currentRound + 1;
  const nextPosition = Math.floor(currentPosition / 2);
  const isFirstInPair = currentPosition % 2 === 0;

  // Find the next round slot
  const { data: nextSlot } = await supabase
    .from("tournament_brackets")
    .select("*")
    .eq("session_id", sessionId)
    .eq("bracket_type", bracketType)
    .eq("round_number", nextRound)
    .eq("position_in_round", nextPosition)
    .single();

  if (!nextSlot) return false;

  // Update the appropriate participant slot
  const updates: { participant_one_id?: string; participant_two_id?: string } = isFirstInPair
    ? { participant_one_id: winnerId }
    : { participant_two_id: winnerId };

  const { error } = await supabase
    .from("tournament_brackets")
    .update(updates)
    .eq("id", nextSlot.id);

  if (error) {
    console.error("Error advancing winner:", error);
    return false;
  }

  return true;
}

// ============ Tournament Standings ============

export interface CreateStandingInput {
  sessionId: string;
  participantId: string;
  participantType: ParticipantType;
}

export async function createStanding(input: CreateStandingInput): Promise<DbTournamentStanding | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("tournament_standings")
    .insert({
      session_id: input.sessionId,
      participant_id: input.participantId,
      participant_type: input.participantType,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating standing:", error);
    return null;
  }

  return data;
}

export async function getStandingsBySession(sessionId: string): Promise<DbTournamentStanding[]> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("tournament_standings")
    .select("*")
    .eq("session_id", sessionId)
    .order("points", { ascending: false })
    .order("game_difference", { ascending: false });

  if (error) {
    console.error("Error fetching standings:", error);
    return [];
  }

  return data || [];
}

export async function updateStanding(
  id: string,
  updates: {
    wins?: number;
    losses?: number;
    points?: number;
    gameDifference?: number;
    rank?: number | null;
  }
): Promise<boolean> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return false;

  const dbUpdates: {
    wins?: number;
    losses?: number;
    points?: number;
    game_difference?: number;
    rank?: number | null;
  } = {};
  if (updates.wins !== undefined) dbUpdates.wins = updates.wins;
  if (updates.losses !== undefined) dbUpdates.losses = updates.losses;
  if (updates.points !== undefined) dbUpdates.points = updates.points;
  if (updates.gameDifference !== undefined) dbUpdates.game_difference = updates.gameDifference;
  if (updates.rank !== undefined) dbUpdates.rank = updates.rank;

  const { error } = await supabase
    .from("tournament_standings")
    .update(dbUpdates)
    .eq("id", id);

  if (error) {
    console.error("Error updating standing:", error);
    return false;
  }

  return true;
}

export async function recordMatchResultInStandings(
  winnerStandingId: string,
  loserStandingId: string,
  winnerScoreDiff: number
): Promise<boolean> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return false;

  // Get current standings
  const { data: standings } = await supabase
    .from("tournament_standings")
    .select("*")
    .in("id", [winnerStandingId, loserStandingId]);

  if (!standings || standings.length !== 2) return false;

  const winner = standings.find((s) => s.id === winnerStandingId);
  const loser = standings.find((s) => s.id === loserStandingId);

  if (!winner || !loser) return false;

  // Update winner
  await updateStanding(winnerStandingId, {
    wins: winner.wins + 1,
    points: winner.points + 3,
    gameDifference: winner.game_difference + winnerScoreDiff,
  });

  // Update loser
  await updateStanding(loserStandingId, {
    losses: loser.losses + 1,
    gameDifference: loser.game_difference - winnerScoreDiff,
  });

  return true;
}

export async function recalculateRankings(sessionId: string): Promise<boolean> {
  const standings = await getStandingsBySession(sessionId);

  // Sort by points, then game difference
  const sorted = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.game_difference - a.game_difference;
  });

  // Update ranks
  for (let i = 0; i < sorted.length; i++) {
    await updateStanding(sorted[i].id, { rank: i + 1 });
  }

  return true;
}
