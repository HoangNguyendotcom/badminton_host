import type { SessionData, Player, Match, MatchPlayer, GameMode, TournamentFormat, MatchType } from "@/types";
import { isSupabaseConfigured } from "./supabase";
import * as db from "./db";

const STORAGE_KEY_PREFIX = "badminton-session:";

// Generate a random 6-character session code
export function generateSessionCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    const idx = Math.floor(Math.random() * alphabet.length);
    code += alphabet[idx];
  }
  return code;
}

// ============ LocalStorage Functions ============

function loadSessionFromLocal(code: string): SessionData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY_PREFIX + code);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

function saveSessionToLocal(data: SessionData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_PREFIX + data.sessionCode, JSON.stringify(data));
}

// ============ Supabase Functions ============

async function loadSessionFromSupabase(code: string): Promise<SessionData | null> {
  const sessionWithPlayers = await db.getSessionWithPlayers(code);
  if (!sessionWithPlayers) return null;

  // Convert DB format to app format
  const players: Player[] = sessionWithPlayers.players.map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    skillLevel: p.skill_level,
    team: null, // Team assignments are not stored in DB yet
    isActive: p.is_active,
  }));

  // Load matches from Supabase
  const dbMatches = await db.getMatchesBySession(sessionWithPlayers.id);
  const matches: Match[] = dbMatches.map((m) => {
    const teamA: MatchPlayer[] = m.match_players
      .filter((mp) => mp.side === "a")
      .map((mp) => ({
        id: mp.player.id,
        name: mp.player.name,
        gender: mp.player.gender,
        skillLevel: mp.player.skill_level,
      }));
    const teamB: MatchPlayer[] = m.match_players
      .filter((mp) => mp.side === "b")
      .map((mp) => ({
        id: mp.player.id,
        name: mp.player.name,
        gender: mp.player.gender,
        skillLevel: mp.player.skill_level,
      }));

    return {
      id: m.id,
      matchType: m.match_type,
      status: m.status,
      teamA,
      teamB,
      scoreA: m.team_a_score,
      scoreB: m.team_b_score,
      winner: m.winner_side,
      playedAt: m.played_at,
      createdAt: m.created_at,
    };
  });

  return {
    sessionCode: sessionWithPlayers.code,
    players,
    matches,
    gameMode: sessionWithPlayers.game_mode,
    tournamentFormat: sessionWithPlayers.tournament_format || undefined,
    matchType: sessionWithPlayers.match_type_default || undefined,
    address: sessionWithPlayers.address || undefined,
  };
}

async function createSessionInSupabase(
  code: string,
  gameMode: GameMode,
  tournamentFormat?: TournamentFormat,
  matchType?: MatchType,
  address?: string
): Promise<string | null> {
  const session = await db.createSession({
    code,
    gameMode,
    tournamentFormat,
    matchType,
    address,
  });
  return session?.id || null;
}

async function syncPlayersToSupabase(sessionId: string, players: Player[]): Promise<void> {
  // Get existing players from Supabase
  const existingPlayers = await db.getPlayersBySession(sessionId);
  const existingIds = new Set(existingPlayers.map((p) => p.id));
  const currentIds = new Set(players.map((p) => p.id));

  // Find players to add, update, and delete
  const toAdd = players.filter((p) => !existingIds.has(p.id));
  const toUpdate = players.filter((p) => existingIds.has(p.id));
  const toDelete = existingPlayers.filter((p) => !currentIds.has(p.id));

  // Add new players
  for (const player of toAdd) {
    await db.createPlayer({
      sessionId,
      name: player.name,
      gender: player.gender,
      skillLevel: player.skillLevel,
      isActive: player.isActive,
    });
  }

  // Update existing players
  for (const player of toUpdate) {
    await db.updatePlayer(player.id, {
      name: player.name,
      gender: player.gender,
      skillLevel: player.skillLevel,
      isActive: player.isActive,
    });
  }

  // Delete removed players
  for (const player of toDelete) {
    await db.deletePlayer(player.id);
  }
}

async function syncMatchesToSupabase(sessionId: string, matches: Match[]): Promise<void> {
  // Get existing matches from Supabase
  const existingMatches = await db.getMatchesBySession(sessionId);
  const existingIds = new Set(existingMatches.map((m) => m.id));
  const currentIds = new Set(matches.map((m) => m.id));

  // Find matches to add, update, and delete
  const toAdd = matches.filter((m) => !existingIds.has(m.id));
  const toUpdate = matches.filter((m) => existingIds.has(m.id));
  const toDelete = existingMatches.filter((m) => !currentIds.has(m.id));

  // Add new matches
  for (const match of toAdd) {
    await db.createMatch({
      sessionId,
      matchType: match.matchType,
      playerIds: [
        ...match.teamA.map((p) => ({ playerId: p.id, side: "a" as const })),
        ...match.teamB.map((p) => ({ playerId: p.id, side: "b" as const })),
      ],
    });
  }

  // Update existing matches (scores)
  for (const match of toUpdate) {
    if (match.status === "completed" && match.scoreA !== null && match.scoreB !== null) {
      await db.recordMatchResult(match.id, match.scoreA, match.scoreB);
    }
  }

  // Delete removed matches
  for (const match of toDelete) {
    await db.deleteMatch(match.id);
  }
}

// ============ Unified API ============

/**
 * Load session data - tries Supabase first, falls back to localStorage
 */
export async function loadSession(code: string): Promise<SessionData | null> {
  if (isSupabaseConfigured) {
    const session = await loadSessionFromSupabase(code);
    if (session) return session;
  }
  // Fallback to localStorage
  return loadSessionFromLocal(code);
}

/**
 * Synchronous load from localStorage only (for initial render)
 */
export function loadSessionSync(code: string): SessionData | null {
  return loadSessionFromLocal(code);
}

/**
 * Save session data - saves to both Supabase and localStorage
 */
export async function saveSession(data: SessionData): Promise<void> {
  // Always save to localStorage for fast access
  saveSessionToLocal(data);

  // If Supabase is configured, sync there too
  if (isSupabaseConfigured) {
    try {
      // Check if session exists in Supabase
      const existingSession = await db.getSessionByCode(data.sessionCode);

      if (existingSession) {
        // Sync players
        await syncPlayersToSupabase(existingSession.id, data.players);
        // Sync matches
        await syncMatchesToSupabase(existingSession.id, data.matches || []);
      } else {
        // Create new session
        const sessionId = await createSessionInSupabase(
          data.sessionCode,
          data.gameMode,
          data.tournamentFormat,
          data.matchType,
          data.address
        );

        if (sessionId) {
          // Add all players
          if (data.players.length > 0) {
            await db.createPlayers(
              data.players.map((p) => ({
                sessionId,
                name: p.name,
                gender: p.gender,
                skillLevel: p.skillLevel,
                isActive: p.isActive,
              }))
            );
          }
          // Add all matches
          if (data.matches && data.matches.length > 0) {
            await syncMatchesToSupabase(sessionId, data.matches);
          }
        }
      }
    } catch (error) {
      console.error("Error syncing to Supabase:", error);
      // Continue anyway - localStorage is saved
    }
  }
}

/**
 * Synchronous save to localStorage only (for immediate updates)
 */
export function saveSessionSync(data: SessionData): void {
  saveSessionToLocal(data);
}

/**
 * Clear session data from localStorage
 */
export function clearSessionData(code: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_PREFIX + code);
}

/**
 * Check if a session code exists
 */
export async function sessionExists(code: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const session = await db.getSessionByCode(code);
    if (session) return true;
  }
  return loadSessionFromLocal(code) !== null;
}

/**
 * Create a new session with the specified game mode
 */
export async function createNewSession(
  code: string,
  gameMode: GameMode,
  tournamentFormat?: TournamentFormat,
  matchType?: MatchType,
  address?: string
): Promise<SessionData> {
  const sessionData: SessionData = {
    sessionCode: code,
    players: [],
    gameMode,
    tournamentFormat,
    matchType,
    address,
  };

  await saveSession(sessionData);
  return sessionData;
}


