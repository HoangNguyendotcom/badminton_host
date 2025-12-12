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

function buildQuotas(total: number, teamCount: number) {
  const base = Math.floor(total / teamCount);
  const remainder = total % teamCount;
  return Array.from({ length: teamCount }, (_, idx) => base + (idx < remainder ? 1 : 0));
}

export function splitTeams(players: Player[], teamCount = 2): SplitResult {
  const safeTeamCount = Math.max(2, Math.floor(teamCount));
  const activePlayers = players.filter((p) => p.isActive);
  const bench = players.filter((p) => !p.isActive).map(clonePlayer);

  const males = activePlayers
    .filter((p) => p.gender === "male")
    .sort((a, b) => b.skillLevel - a.skillLevel);
  const females = activePlayers
    .filter((p) => p.gender === "female")
    .sort((a, b) => b.skillLevel - a.skillLevel);

  const countQuotas = buildQuotas(activePlayers.length, safeTeamCount);
  const maleQuotas = buildQuotas(males.length, safeTeamCount);
  const femaleQuotas = buildQuotas(females.length, safeTeamCount);

  const teams: Player[][] = Array.from({ length: safeTeamCount }, () => []);

  const pushPlayer = (player: Player, teamIdx: number) => {
    const copy = clonePlayer(player);
    copy.team = `Đội ${teamIdx + 1}`;
    teams[teamIdx].push(copy);
  };

  const distribute = (pool: Player[]) => {
    for (const player of pool) {
      let chosenIdx = 0;
      let bestScore: [number, number, number] | null = null;
      teams.forEach((team, idx) => {
        const stats = summarize(team);
        const totalQuota = countQuotas[idx];
        const genderQuota = player.gender === "male" ? maleQuotas[idx] : femaleQuotas[idx];
        const genderCount = player.gender === "male" ? stats.male : stats.female;
        const needGender = genderCount < genderQuota ? 0 : 1;
        const needTotal = stats.count < totalQuota ? 0 : 1;
        const score: [number, number, number] = [needGender, needTotal, stats.totalSkill];
        if (bestScore === null || score < bestScore) {
          bestScore = score;
          chosenIdx = idx;
        }
      });
      pushPlayer(player, chosenIdx);
    }
  };

  distribute(males);
  distribute(females);

  const splitTeamsResult = teams.map((team, idx) => ({
    name: `Đội ${idx + 1}`,
    players: team,
    stats: summarize(team)
  }));

  const warnings: string[] = [];
  if (activePlayers.length < safeTeamCount * 2) {
    warnings.push(`Cần ít nhất ${safeTeamCount * 2} người cho ${safeTeamCount} đội.`);
  }
  // Basic balance warnings: compare max/min among teams
  const counts = splitTeamsResult.map((t) => t.stats.count);
  const malesCount = splitTeamsResult.map((t) => t.stats.male);
  const femalesCount = splitTeamsResult.map((t) => t.stats.female);
  const skills = splitTeamsResult.map((t) => t.stats.totalSkill);

  const diff = (arr: number[]) => Math.max(...arr) - Math.min(...arr);
  if (diff(counts) > 1) warnings.push("Chênh lệch số người giữa các đội > 1");
  if (diff(malesCount) > 1) warnings.push("Chênh lệch số nam giữa các đội > 1");
  if (diff(femalesCount) > 1) warnings.push("Chênh lệch số nữ giữa các đội > 1");
  if (diff(skills) > 5) warnings.push("Chênh lệch tổng điểm giữa các đội > 5");

  return {
    teams: splitTeamsResult,
    bench,
    warnings
  };
}

