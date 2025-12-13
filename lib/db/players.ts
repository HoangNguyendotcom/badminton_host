// @ts-nocheck - Supabase types require env vars at compile time
import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { Gender } from "@/types";
import type { DbPlayer } from "@/types/database";

export interface CreatePlayerInput {
  sessionId: string;
  name: string;
  gender: Gender;
  skillLevel: number;
  isActive?: boolean;
}

export interface UpdatePlayerInput {
  name?: string;
  gender?: Gender;
  skillLevel?: number;
  isActive?: boolean;
}

// Create a new player
export async function createPlayer(input: CreatePlayerInput): Promise<DbPlayer | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("players")
    .insert({
      session_id: input.sessionId,
      name: input.name,
      gender: input.gender,
      skill_level: Math.min(10, Math.max(1, input.skillLevel)),
      is_active: input.isActive ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating player:", error);
    return null;
  }

  return data;
}

// Get players by session ID
export async function getPlayersBySession(sessionId: string): Promise<DbPlayer[]> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching players:", error);
    return [];
  }

  return data || [];
}

// Get player by ID
export async function getPlayerById(id: string): Promise<DbPlayer | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching player:", error);
    }
    return null;
  }

  return data;
}

// Update player
export async function updatePlayer(id: string, updates: UpdatePlayerInput): Promise<DbPlayer | null> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return null;

  const dbUpdates: {
    name?: string;
    gender?: Gender;
    skill_level?: number;
    is_active?: boolean;
  } = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.skillLevel !== undefined) dbUpdates.skill_level = Math.min(10, Math.max(1, updates.skillLevel));
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  const { data, error } = await supabase
    .from("players")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating player:", error);
    return null;
  }

  return data;
}

// Delete player
export async function deletePlayer(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting player:", error);
    return false;
  }

  return true;
}

// Batch create players
export async function createPlayers(inputs: CreatePlayerInput[]): Promise<DbPlayer[]> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase || inputs.length === 0) return [];

  const { data, error } = await supabase
    .from("players")
    .insert(
      inputs.map((input) => ({
        session_id: input.sessionId,
        name: input.name,
        gender: input.gender,
        skill_level: Math.min(10, Math.max(1, input.skillLevel)),
        is_active: input.isActive ?? true,
      }))
    )
    .select();

  if (error) {
    console.error("Error creating players:", error);
    return [];
  }

  return data || [];
}

// Batch update players active status
export async function updatePlayersActiveStatus(
  ids: string[],
  isActive: boolean
): Promise<boolean> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase || ids.length === 0) return false;

  const { error } = await supabase
    .from("players")
    .update({ is_active: isActive })
    .in("id", ids);

  if (error) {
    console.error("Error updating players active status:", error);
    return false;
  }

  return true;
}
