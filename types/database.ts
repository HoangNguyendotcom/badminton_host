import type { GameMode, TournamentFormat, MatchType, Gender } from "./index";

// Database row types (what you get back from SELECT)
export interface DbSession {
  id: string;
  code: string;
  game_mode: GameMode;
  tournament_format: TournamentFormat | null;
  match_type_default: MatchType | null;
  skill_diff_threshold: number;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPlayer {
  id: string;
  session_id: string;
  name: string;
  gender: Gender;
  skill_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbMatch {
  id: string;
  session_id: string;
  match_type: MatchType;
  status: "pending" | "in_progress" | "completed";
  team_a_score: number | null;
  team_b_score: number | null;
  winner_side: "a" | "b" | null;
  played_at: string | null;
  created_at: string;
}

export interface DbMatchPlayer {
  id: string;
  match_id: string;
  player_id: string;
  side: "a" | "b";
}

export interface DbTournamentPair {
  id: string;
  session_id: string;
  player_one_id: string;
  player_two_id: string;
  pair_name: string | null;
  total_skill: number;
  seed_number: number | null;
  created_at: string;
}

export interface DbTournamentBracket {
  id: string;
  session_id: string;
  bracket_type: "winners" | "losers";
  round_number: number;
  position_in_round: number;
  participant_one_id: string | null;
  participant_two_id: string | null;
  winner_id: string | null;
  match_id: string | null;
  created_at: string;
}

export interface DbTournamentStanding {
  id: string;
  session_id: string;
  participant_id: string;
  participant_type: "player" | "pair";
  wins: number;
  losses: number;
  points: number;
  game_difference: number;
  rank: number | null;
  created_at: string;
  updated_at: string;
}

// Supabase Database schema type
export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: DbSession;
        Insert: {
          id?: string;
          code: string;
          game_mode: GameMode;
          tournament_format?: TournamentFormat | null;
          match_type_default?: MatchType | null;
          skill_diff_threshold?: number;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          game_mode?: GameMode;
          tournament_format?: TournamentFormat | null;
          match_type_default?: MatchType | null;
          skill_diff_threshold?: number;
          address?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: DbPlayer;
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          gender: Gender;
          skill_level: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          gender?: Gender;
          skill_level?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "players_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      matches: {
        Row: DbMatch;
        Insert: {
          id?: string;
          session_id: string;
          match_type: MatchType;
          status?: "pending" | "in_progress" | "completed";
          team_a_score?: number | null;
          team_b_score?: number | null;
          winner_side?: "a" | "b" | null;
          played_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          match_type?: MatchType;
          status?: "pending" | "in_progress" | "completed";
          team_a_score?: number | null;
          team_b_score?: number | null;
          winner_side?: "a" | "b" | null;
          played_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      match_players: {
        Row: DbMatchPlayer;
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          side: "a" | "b";
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          side?: "a" | "b";
        };
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_players_player_id_fkey";
            columns: ["player_id"];
            referencedRelation: "players";
            referencedColumns: ["id"];
          }
        ];
      };
      tournament_pairs: {
        Row: DbTournamentPair;
        Insert: {
          id?: string;
          session_id: string;
          player_one_id: string;
          player_two_id: string;
          pair_name?: string | null;
          total_skill: number;
          seed_number?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          player_one_id?: string;
          player_two_id?: string;
          pair_name?: string | null;
          total_skill?: number;
          seed_number?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_pairs_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_pairs_player_one_id_fkey";
            columns: ["player_one_id"];
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_pairs_player_two_id_fkey";
            columns: ["player_two_id"];
            referencedRelation: "players";
            referencedColumns: ["id"];
          }
        ];
      };
      tournament_brackets: {
        Row: DbTournamentBracket;
        Insert: {
          id?: string;
          session_id: string;
          bracket_type?: "winners" | "losers";
          round_number: number;
          position_in_round: number;
          participant_one_id?: string | null;
          participant_two_id?: string | null;
          winner_id?: string | null;
          match_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          bracket_type?: "winners" | "losers";
          round_number?: number;
          position_in_round?: number;
          participant_one_id?: string | null;
          participant_two_id?: string | null;
          winner_id?: string | null;
          match_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_brackets_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_brackets_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          }
        ];
      };
      tournament_standings: {
        Row: DbTournamentStanding;
        Insert: {
          id?: string;
          session_id: string;
          participant_id: string;
          participant_type: "player" | "pair";
          wins?: number;
          losses?: number;
          points?: number;
          game_difference?: number;
          rank?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          participant_id?: string;
          participant_type?: "player" | "pair";
          wins?: number;
          losses?: number;
          points?: number;
          game_difference?: number;
          rank?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_standings_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      game_mode: GameMode;
      tournament_format: TournamentFormat;
      match_type: MatchType;
      gender: Gender;
      match_status: "pending" | "in_progress" | "completed";
      match_side: "a" | "b";
      bracket_type: "winners" | "losers";
      participant_type: "player" | "pair";
    };
    CompositeTypes: {};
  };
};
