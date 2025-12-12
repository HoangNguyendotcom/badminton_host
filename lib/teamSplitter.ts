import type { Player, SplitResult, TeamStats } from "@/types";

function summarize(team: Player[]): TeamStats {
  const male = team.filter((p) => p.gender === "male").length;
  const female = team.filter((p) => p.gender === "female").length;
  const totalSkill = team.reduce((sum, p) => sum + p.skillLevel, 0);
  return { count: team.length, male, female, totalSkill };
}

function clonePlayer(p: Player): Player {
  return { ...p };
}

export function splitTeams(players: Player[]): SplitResult {
  const activePlayers = players.filter((p) => p.isActive);

  const males = activePlayers
    .filter((p) => p.gender === "male")
    .sort((a, b) => b.skillLevel - a.skillLevel);
  const females = activePlayers
    .filter((p) => p.gender === "female")
    .sort((a, b) => b.skillLevel - a.skillLevel);

  const total = activePlayers.length;
  const maleTotal = males.length;
  const femaleTotal = females.length;

  const teamACount = Math.floor(total / 2);
  const teamBCount = total - teamACount;

  const teamAMaleQuota = Math.floor(maleTotal / 2);
  const teamBMaleQuota = maleTotal - teamAMaleQuota;
  const teamAFemaleQuota = Math.floor(femaleTotal / 2);
  const teamBFemaleQuota = femaleTotal - teamAFemaleQuota;

  const teamA: Player[] = [];
  const teamB: Player[] = [];

  const pushPlayer = (player: Player, target: Player[]) => {
    const copy = clonePlayer(player);
    copy.team = target === teamA ? "A" : "B";
    target.push(copy);
  };

  const distribute = (pool: Player[], quotaA: number, quotaB: number) => {
    for (const player of pool) {
      const statsA = summarize(teamA);
      const statsB = summarize(teamB);
      const needA = statsA.count < teamACount;
      const needB = statsB.count < teamBCount;
      const needGenderA =
        player.gender === "male" ? statsA.male < quotaA : statsA.female < quotaA;
      const needGenderB =
        player.gender === "male" ? statsB.male < quotaB : statsB.female < quotaB;

      if (needGenderA && (!needGenderB || statsA.totalSkill <= statsB.totalSkill)) {
        pushPlayer(player, teamA);
      } else if (needGenderB) {
        pushPlayer(player, teamB);
      } else if (needA && (!needB || statsA.totalSkill <= statsB.totalSkill)) {
        pushPlayer(player, teamA);
      } else if (needB) {
        pushPlayer(player, teamB);
      } else {
        // If both quotas are full, push to lower total skill team
        if (statsA.totalSkill <= statsB.totalSkill) {
          pushPlayer(player, teamA);
        } else {
          pushPlayer(player, teamB);
        }
      }
    }
  };

  distribute(males, teamAMaleQuota, teamBMaleQuota);
  distribute(females, teamAFemaleQuota, teamBFemaleQuota);

  // Bench: inactive or not assigned
  const bench = players.filter((p) => !p.isActive).map(clonePlayer);

  const statsA = summarize(teamA);
  const statsB = summarize(teamB);
  const diffs = {
    count: Math.abs(statsA.count - statsB.count),
    male: Math.abs(statsA.male - statsB.male),
    female: Math.abs(statsA.female - statsB.female),
    skill: Math.abs(statsA.totalSkill - statsB.totalSkill)
  };

  const warnings: string[] = [];
  if (diffs.count > 1) warnings.push("Chênh lệch số người > 1");
  if (diffs.male > 1) warnings.push("Chênh lệch số nam > 1");
  if (diffs.female > 1) warnings.push("Chênh lệch số nữ > 1");
  if (diffs.skill > 5) warnings.push("Chênh lệch tổng điểm > 5");

  return {
    teamA,
    teamB,
    bench,
    stats: { teamA: statsA, teamB: statsB, diffs, warnings }
  };
}

