export type Gender = "male" | "female";
export type Team = string | null;

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

