export type Gender = "male" | "female";
export type Team = string | null;
export type GameMode = "team" | "free_play" | "tournament";
export type TournamentFormat = "round_robin" | "single_elimination" | "double_elimination";
export type MatchType = "MS" | "WS" | "XD" | "MD" | "WD";

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  skillLevel: number;
  team: Team;
  isActive: boolean;
}

export interface SessionData {
  sessionCode: string;
  players: Player[];
  lastSplitAt?: string;
  gameMode: GameMode;
  tournamentFormat?: TournamentFormat;
  matchType?: MatchType;
  matches?: Match[];
}

export interface TeamStats {
  count: number;
  male: number;
  female: number;
  totalSkill: number;
}

export interface SplitTeam {
  name: string;
  players: Player[];
  stats: TeamStats;
}

export interface SplitResult {
  teams: SplitTeam[];
  bench: Player[];
  warnings: string[];
}

// Match types
export type MatchStatus = "pending" | "in_progress" | "completed";
export type MatchSide = "a" | "b";

export interface MatchPlayer {
  id: string;
  name: string;
  gender: Gender;
  skillLevel: number;
}

export interface Match {
  id: string;
  matchType: MatchType;
  status: MatchStatus;
  teamA: MatchPlayer[];
  teamB: MatchPlayer[];
  scoreA: number | null;
  scoreB: number | null;
  winner: MatchSide | null;
  playedAt: string | null;
  createdAt: string;
}

