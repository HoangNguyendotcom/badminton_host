import type { SessionData, Player, Match, MatchPlayer, GameMode, TournamentFormat, MatchType, TournamentPair } from "@/types";
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
    team: p.team || null,
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

  // Load pairs from Supabase
  const dbPairs = await db.getPairsBySession(sessionWithPlayers.id);
  const pairs: TournamentPair[] = dbPairs.map((p) => {
    // Find player data from the players array we already loaded
    const player1Data = players.find((pl) => pl.id === p.player_one_id);
    const player2Data = players.find((pl) => pl.id === p.player_two_id);
    
    if (!player1Data || !player2Data) {
      // If player data not found, skip this pair
      return null;
    }

    return {
      id: p.id,
      player1: {
        id: player1Data.id,
        name: player1Data.name,
        gender: player1Data.gender,
        skillLevel: player1Data.skillLevel,
      },
      player2: {
        id: player2Data.id,
        name: player2Data.name,
        gender: player2Data.gender,
        skillLevel: player2Data.skillLevel,
      },
    };
  }).filter((p): p is TournamentPair => p !== null);

  return {
    sessionCode: sessionWithPlayers.code,
    players,
    pairs: pairs.length > 0 ? pairs : undefined,
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
      id: player.id,
      sessionId,
      name: player.name,
      gender: player.gender,
      skillLevel: player.skillLevel,
      isActive: player.isActive,
      team: player.team || null,
    });
  }

  // Update existing players
  for (const player of toUpdate) {
    await db.updatePlayer(player.id, {
      name: player.name,
      gender: player.gender,
      skillLevel: player.skillLevel,
      isActive: player.isActive,
      team: player.team || null,
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
      id: match.id,
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

/**
 * Save only matches (scores, status) to Supabase for an existing session.
 * Does NOT touch players, pairs or localStorage.
 */
export async function saveMatchesOnly(sessionCode: string, matches: Match[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const existingSession = await db.getSessionByCode(sessionCode);
    if (!existingSession) return;

    await syncMatchesToSupabase(existingSession.id, matches);
  } catch (error) {
    console.error("Error syncing matches to Supabase:", error);
  }
}

async function syncPairsToSupabase(sessionId: string, pairs: TournamentPair[]): Promise<void> {
  // Get existing pairs from Supabase
  const existingPairs = await db.getPairsBySession(sessionId);
  const existingIds = new Set(existingPairs.map((p) => p.id));
  const currentIds = new Set(pairs.map((p) => p.id));

  // Find pairs to add, update, and delete
  const toAdd = pairs.filter((p) => !existingIds.has(p.id));
  const toDelete = existingPairs.filter((p) => !currentIds.has(p.id));

  // Add new pairs
  for (const pair of toAdd) {
    await db.createTournamentPair({
      sessionId,
      playerOneId: pair.player1.id,
      playerTwoId: pair.player2.id,
      totalSkill: pair.player1.skillLevel + pair.player2.skillLevel,
    });
  }

  // Delete removed pairs
  for (const pair of toDelete) {
    await db.deleteTournamentPair(pair.id);
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
 * Cleanup old sessions from localStorage, keeping only the active session
 */
function cleanupOldSessions(activeSessionCode: string): void {
  if (typeof window === "undefined") return;
  
  // Get all localStorage keys with our prefix
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      keys.push(key);
    }
  }

  // Remove all sessions except the active one
  for (const key of keys) {
    const sessionCode = key.replace(STORAGE_KEY_PREFIX, "");
    if (sessionCode !== activeSessionCode) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Save session data - saves to both Supabase and localStorage
 * LocalStorage only keeps the active session for performance
 */
export async function saveSession(data: SessionData): Promise<void> {
  // Cleanup old sessions, keep only active one
  cleanupOldSessions(data.sessionCode);
  
  // Save active session to localStorage for fast access
  saveSessionToLocal(data);

  // If Supabase is configured, sync there too
  if (isSupabaseConfigured) {
    try {
      // Check if session exists in Supabase
      const existingSession = await db.getSessionByCode(data.sessionCode);

      if (existingSession) {
        // Update session address if changed
        if (existingSession.address !== (data.address || null)) {
          await db.updateSession(existingSession.id, {
            address: data.address || null,
          });
        }

        // Sync players
        await syncPlayersToSupabase(existingSession.id, data.players);
        // Sync matches
        await syncMatchesToSupabase(existingSession.id, data.matches || []);
        // Sync pairs
        if (data.pairs) {
          await syncPairsToSupabase(existingSession.id, data.pairs);
        }
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
                id: p.id,
                sessionId,
                name: p.name,
                gender: p.gender,
                skillLevel: p.skillLevel,
                isActive: p.isActive,
                team: p.team || null,
              }))
            );
          }
          // Add all matches
          if (data.matches && data.matches.length > 0) {
            await syncMatchesToSupabase(sessionId, data.matches);
          }
          // Add all pairs
          if (data.pairs && data.pairs.length > 0) {
            await syncPairsToSupabase(sessionId, data.pairs);
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
 * Generate a session code that does not already exist in Supabase or localStorage
 */
export async function generateUniqueSessionCode(): Promise<string> {
  // Try a reasonable number of times to avoid an infinite loop
  for (let i = 0; i < 20; i += 1) {
    const code = generateSessionCode();
    // sessionExists checks both Supabase (if configured) and localStorage
    // eslint-disable-next-line no-await-in-loop
    const exists = await sessionExists(code);
    if (!exists) {
      return code;
    }
  }
  throw new Error("Unable to generate a unique session code after multiple attempts");
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


