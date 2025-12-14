// @ts-nocheck - Supabase types require env vars at compile time
import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { GameMode, TournamentFormat, MatchType } from "@/types";
import type { DbSession } from "@/types/database";

export interface CreateSessionInput {
  code: string;
  gameMode: GameMode;
  tournamentFormat?: TournamentFormat;
  matchType?: MatchType;
  skillDiffThreshold?: number;
  address?: string;
}

export interface SessionWithPlayers extends DbSession {
  players: {
    id: string;
    name: string;
    gender: "male" | "female";
    skill_level: number;
    is_active: boolean;
  }[];
}

// Create a new session
export async function createSession(input: CreateSessionInput): Promise<DbSession | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      code: input.code,
      game_mode: input.gameMode,
      tournament_format: input.tournamentFormat || null,
      match_type_default: input.matchType || null,
      skill_diff_threshold: input.skillDiffThreshold ?? 5,
      address: input.address || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating session:", error);
    return null;
  }

  return data;
}

// Get session by code
export async function getSessionByCode(code: string): Promise<DbSession | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching session:", error);
    }
    return null;
  }

  return data;
}

// Get session with players
export async function getSessionWithPlayers(code: string): Promise<SessionWithPlayers | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      players (
        id,
        name,
        gender,
        skill_level,
        is_active
      )
    `)
    .eq("code", code.toUpperCase())
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching session with players:", error);
    }
    return null;
  }

  return data as unknown as SessionWithPlayers;
}

// Update session
export async function updateSession(
  id: string,
  updates: Partial<{
    gameMode: GameMode;
    tournamentFormat: TournamentFormat | null;
    matchType: MatchType | null;
    skillDiffThreshold: number;
  }>
): Promise<DbSession | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const dbUpdates: {
    game_mode?: GameMode;
    tournament_format?: TournamentFormat | null;
    match_type_default?: MatchType | null;
    skill_diff_threshold?: number;
  } = {};
  if (updates.gameMode !== undefined) dbUpdates.game_mode = updates.gameMode;
  if (updates.tournamentFormat !== undefined) dbUpdates.tournament_format = updates.tournamentFormat;
  if (updates.matchType !== undefined) dbUpdates.match_type_default = updates.matchType;
  if (updates.skillDiffThreshold !== undefined) dbUpdates.skill_diff_threshold = updates.skillDiffThreshold;

  const { data, error } = await supabase
    .from("sessions")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating session:", error);
    return null;
  }

  return data;
}

// Delete session
export async function deleteSession(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting session:", error);
    return false;
  }

  return true;
}
