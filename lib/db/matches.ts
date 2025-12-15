// @ts-nocheck - Supabase types require env vars at compile time
import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { MatchType } from "@/types";
import type { DbMatch, DbMatchPlayer } from "@/types/database";

export type MatchStatus = "pending" | "in_progress" | "completed";
export type MatchSide = "a" | "b";

export interface CreateMatchInput {
  id?: string;
  sessionId: string;
  matchType: MatchType;
  playerIds: { playerId: string; side: MatchSide }[];
}

export interface UpdateMatchInput {
  status?: MatchStatus;
  teamAScore?: number | null;
  teamBScore?: number | null;
  winnerSide?: MatchSide | null;
  playedAt?: string | null;
}

export interface MatchWithPlayers extends DbMatch {
  match_players: (DbMatchPlayer & {
    player: {
      id: string;
      name: string;
      gender: "male" | "female";
      skill_level: number;
    };
  })[];
}

// Create a new match with players
export async function createMatch(input: CreateMatchInput): Promise<DbMatch | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  // Start a transaction by creating the match first
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      id: input.id,
      session_id: input.sessionId,
      match_type: input.matchType,
      status: "pending" as const,
    })
    .select()
    .single();

  if (matchError || !match) {
    console.error("Error creating match:", matchError);
    return null;
  }

  // Add players to the match
  const { error: playersError } = await supabase
    .from("match_players")
    .insert(
      input.playerIds.map((p) => ({
        match_id: match.id,
        player_id: p.playerId,
        side: p.side,
      }))
    );

  if (playersError) {
    console.error("Error adding players to match:", playersError);
    // Clean up the match if players failed to add
    await supabase.from("matches").delete().eq("id", match.id);
    return null;
  }

  return match;
}

// Get matches by session
export async function getMatchesBySession(sessionId: string): Promise<MatchWithPlayers[]> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      match_players (
        *,
        player:players (
          id,
          name,
          gender,
          skill_level
        )
      )
    `)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching matches:", error);
    return [];
  }

  return (data || []) as unknown as MatchWithPlayers[];
}

// Get match by ID
export async function getMatchById(id: string): Promise<MatchWithPlayers | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      match_players (
        *,
        player:players (
          id,
          name,
          gender,
          skill_level
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching match:", error);
    }
    return null;
  }

  return data as unknown as MatchWithPlayers;
}

// Update match score and status
export async function updateMatch(id: string, updates: UpdateMatchInput): Promise<DbMatch | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const dbUpdates: {
    status?: MatchStatus;
    team_a_score?: number | null;
    team_b_score?: number | null;
    winner_side?: MatchSide | null;
    played_at?: string | null;
  } = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.teamAScore !== undefined) dbUpdates.team_a_score = updates.teamAScore;
  if (updates.teamBScore !== undefined) dbUpdates.team_b_score = updates.teamBScore;
  if (updates.winnerSide !== undefined) dbUpdates.winner_side = updates.winnerSide;
  if (updates.playedAt !== undefined) dbUpdates.played_at = updates.playedAt;

  const { data, error } = await supabase
    .from("matches")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating match:", error);
    return null;
  }

  return data;
}

// Record match result
export async function recordMatchResult(
  id: string,
  teamAScore: number,
  teamBScore: number
): Promise<DbMatch | null> {
  const winnerSide: MatchSide | null =
    teamAScore > teamBScore ? "a" :
    teamBScore > teamAScore ? "b" :
    null;

  return updateMatch(id, {
    status: "completed",
    teamAScore,
    teamBScore,
    winnerSide,
    playedAt: new Date().toISOString(),
  });
}

// Delete match
export async function deleteMatch(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting match:", error);
    return false;
  }

  return true;
}

// Get player match statistics
export async function getPlayerMatchStats(
  sessionId: string,
  playerId: string
): Promise<{ played: number; won: number; lost: number }> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return { played: 0, won: 0, lost: 0 };

  const { data, error } = await supabase
    .from("match_players")
    .select(`
      side,
      match:matches!inner (
        id,
        session_id,
        status,
        winner_side
      )
    `)
    .eq("player_id", playerId);

  if (error) {
    console.error("Error fetching player stats:", error);
    return { played: 0, won: 0, lost: 0 };
  }

  let won = 0;
  let lost = 0;
  let played = 0;

  for (const mp of data || []) {
    const matchData = mp.match as unknown as { session_id: string; status: string; winner_side: MatchSide | null };
    if (matchData.session_id !== sessionId || matchData.status !== "completed") continue;
    played++;
    if (matchData.winner_side === mp.side) {
      won++;
    } else if (matchData.winner_side !== null) {
      lost++;
    }
  }

  return { played, won, lost };
}
