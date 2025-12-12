export type Gender = "male" | "female";
export type Team = "A" | "B" | null;

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

export interface SplitResult {
  teamA: Player[];
  teamB: Player[];
  bench: Player[];
  stats: {
    teamA: TeamStats;
    teamB: TeamStats;
    diffs: {
      count: number;
      male: number;
      female: number;
      skill: number;
    };
    warnings: string[];
  };
}

