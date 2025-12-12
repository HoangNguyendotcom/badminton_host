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

function skillSpread(teams: Player[][]) {
  const totals = teams.map((t) => t.reduce((s, p) => s + p.skillLevel, 0));
  return Math.max(...totals) - Math.min(...totals);
}

function splitTwoTeamsExact(
  players: Player[],
  countQuotas: number[],
  maleQuotas: number[],
  femaleQuotas: number[]
): [Player[], Player[]] {
  const n = players.length;
  const targetCountA = countQuotas[0];
  const targetMaleA = maleQuotas[0];
  const targetFemaleA = femaleQuotas[0];

  // Giới hạn số người để tránh vấn đề bitwise và hiệu năng
  const MAX_PLAYERS_FOR_EXACT = 25;

  if (n > MAX_PLAYERS_FOR_EXACT) {
    // Sử dụng thuật toán greedy cho trường hợp nhiều người
    return splitTwoTeamsGreedy(players, countQuotas, maleQuotas, femaleQuotas);
  }

  let bestDiff = Number.POSITIVE_INFINITY;
  let bestMask = -1; // Đổi từ 0 thành -1 để phân biệt "chưa tìm thấy" với "mask = 0"
  const totalSkill = players.reduce((s, p) => s + p.skillLevel, 0);

  function dfs(idx: number, mask: number, countA: number, maleA: number, skillA: number) {
    const femaleA = countA - maleA;
    if (countA > targetCountA || maleA > targetMaleA || femaleA > targetFemaleA) return;
    if (idx === n) {
      if (countA !== targetCountA) return;
      // Kiểm tra thêm điều kiện số nam và số nữ đạt quota
      if (maleA !== targetMaleA || femaleA !== targetFemaleA) return;
      const diff = Math.abs(skillA - (totalSkill - skillA));
      if (diff < bestDiff) {
        bestDiff = diff;
        bestMask = mask;
      }
      return;
    }

    const remaining = n - idx;
    if (countA + remaining < targetCountA) return;

    const p = players[idx];
    // Thử đưa vào đội A
    dfs(idx + 1, mask | (1 << idx), countA + 1, maleA + (p.gender === "male" ? 1 : 0), skillA + p.skillLevel);
    // Thử đưa vào đội B
    dfs(idx + 1, mask, countA, maleA, skillA);
  }

  dfs(0, 0, 0, 0, 0);

  // Nếu không tìm được kết quả thỏa mãn chính xác, nới lỏng điều kiện giới tính
  if (bestMask === -1) {
    bestDiff = Number.POSITIVE_INFINITY;

    function dfsRelaxed(idx: number, mask: number, countA: number, maleA: number, skillA: number) {
      if (countA > targetCountA) return;
      if (idx === n) {
        if (countA !== targetCountA) return;
        const femaleA = countA - maleA;
        const maleB = players.filter(p => p.gender === "male").length - maleA;
        const femaleB = players.length - countA - maleB;
        
        // Chỉ yêu cầu chênh lệch giới tính không quá 1
        if (Math.abs(maleA - maleB) > 1) return;
        if (Math.abs(femaleA - femaleB) > 1) return;
        
        const diff = Math.abs(skillA - (totalSkill - skillA));
        if (diff < bestDiff) {
          bestDiff = diff;
          bestMask = mask;
        }
        return;
      }

      const remaining = n - idx;
      if (countA + remaining < targetCountA) return;

      const p = players[idx];
      dfsRelaxed(idx + 1, mask | (1 << idx), countA + 1, maleA + (p.gender === "male" ? 1 : 0), skillA + p.skillLevel);
      dfsRelaxed(idx + 1, mask, countA, maleA, skillA);
    }

    dfsRelaxed(0, 0, 0, 0, 0);
  }

  // Nếu vẫn không tìm được, sử dụng greedy
  if (bestMask === -1) {
    return splitTwoTeamsGreedy(players, countQuotas, maleQuotas, femaleQuotas);
  }

  const teamA: Player[] = [];
  const teamB: Player[] = [];
  players.forEach((p, idx) => {
    const copy = clonePlayer(p);
    if (bestMask & (1 << idx)) {
      copy.team = "Đội 1";
      teamA.push(copy);
    } else {
      copy.team = "Đội 2";
      teamB.push(copy);
    }
  });

  return [teamA, teamB];
}

function splitTwoTeamsGreedy(
  players: Player[],
  countQuotas: number[],
  maleQuotas: number[],
  femaleQuotas: number[]
): [Player[], Player[]] {
  const targetCountA = countQuotas[0];
  const targetCountB = countQuotas[1];

  // Tách nam và nữ, sắp xếp theo điểm giảm dần
  const males = players.filter((p) => p.gender === "male").sort((a, b) => b.skillLevel - a.skillLevel);
  const females = players.filter((p) => p.gender === "female").sort((a, b) => b.skillLevel - a.skillLevel);

  const teamA: Player[] = [];
  const teamB: Player[] = [];
  let skillA = 0;
  let skillB = 0;

  // Phân bổ nam theo kiểu zigzag để cân bằng điểm
  males.forEach((p, idx) => {
    const copy = clonePlayer(p);
    // Ưu tiên đội có điểm thấp hơn, nhưng phải đảm bảo quota
    const maleInA = teamA.filter(x => x.gender === "male").length;
    const maleInB = teamB.filter(x => x.gender === "male").length;
    
    let goToA: boolean;
    if (maleInA >= maleQuotas[0]) {
      goToA = false;
    } else if (maleInB >= maleQuotas[1]) {
      goToA = true;
    } else {
      goToA = skillA <= skillB;
    }

    if (goToA) {
      copy.team = "Đội 1";
      teamA.push(copy);
      skillA += p.skillLevel;
    } else {
      copy.team = "Đội 2";
      teamB.push(copy);
      skillB += p.skillLevel;
    }
  });

  // Phân bổ nữ tương tự
  females.forEach((p, idx) => {
    const copy = clonePlayer(p);
    const femaleInA = teamA.filter(x => x.gender === "female").length;
    const femaleInB = teamB.filter(x => x.gender === "female").length;
    
    let goToA: boolean;
    if (femaleInA >= femaleQuotas[0]) {
      goToA = false;
    } else if (femaleInB >= femaleQuotas[1]) {
      goToA = true;
    } else {
      goToA = skillA <= skillB;
    }

    if (goToA) {
      copy.team = "Đội 1";
      teamA.push(copy);
      skillA += p.skillLevel;
    } else {
      copy.team = "Đội 2";
      teamB.push(copy);
      skillB += p.skillLevel;
    }
  });

  return [teamA, teamB];
}

export function splitTeams(players: Player[], teamCount = 2): SplitResult {
  const safeTeamCount = Math.max(2, Math.floor(teamCount));
  const activePlayers = players.filter((p) => p.isActive);
  const bench = players.filter((p) => !p.isActive).map(clonePlayer);

  // Kiểm tra đầu vào
  if (activePlayers.length < safeTeamCount) {
    return {
      teams: Array.from({ length: safeTeamCount }, (_, idx) => ({
        name: `Đội ${idx + 1}`,
        players: [],
        stats: { count: 0, male: 0, female: 0, totalSkill: 0 }
      })),
      bench,
      warnings: [`Cần ít nhất ${safeTeamCount} người để chia ${safeTeamCount} đội.`]
    };
  }

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

  if (safeTeamCount === 2) {
    const [teamA, teamB] = splitTwoTeamsExact(activePlayers, countQuotas, maleQuotas, femaleQuotas);
    teams[0] = teamA;
    teams[1] = teamB;
  } else {
    // Logic cho nhiều hơn 2 đội giữ nguyên như cũ
    const pushPlayer = (player: Player, teamIdx: number) => {
      const copy = clonePlayer(player);
      copy.team = `Đội ${teamIdx + 1}`;
      teams[teamIdx].push(copy);
    };

    const canPlace = (idx: number, player: Player) => {
      const stats = summarize(teams[idx]);
      const totalQuota = countQuotas[idx];
      const genderQuota = player.gender === "male" ? maleQuotas[idx] : femaleQuotas[idx];
      const genderCount = player.gender === "male" ? stats.male : stats.female;
      return stats.count < totalQuota && genderCount < genderQuota;
    };

    const sortedAll = [...activePlayers].sort((a, b) => b.skillLevel - a.skillLevel);
    for (const player of sortedAll) {
      let bestIdx = 0;
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
          bestIdx = idx;
        }
      });

      if (!canPlace(bestIdx, player)) {
        const fallbackIdx = teams
          .map((t, i) => ({ i, stats: summarize(t) }))
          .filter(({ stats }, i) => stats.count < countQuotas[i])
          .sort((a, b) => a.stats.totalSkill - b.stats.totalSkill)[0]?.i;
        pushPlayer(player, fallbackIdx ?? bestIdx);
      } else {
        pushPlayer(player, bestIdx);
      }
    }
  }

  // Local search với kiểm tra chênh lệch giới tính
  const MAX_ITERS = 200;
  let improved = true;
  let iter = 0;
  while (improved && iter < MAX_ITERS) {
    improved = false;
    iter += 1;
    let bestGain = 0;
    let bestSwap: [number, number, number, number] | null = null;
    const currentSpread = skillSpread(teams);
    
    for (let i = 0; i < teams.length; i += 1) {
      for (let j = i + 1; j < teams.length; j += 1) {
        for (let a = 0; a < teams[i].length; a += 1) {
          for (let b = 0; b < teams[j].length; b += 1) {
            const pi = teams[i][a];
            const pj = teams[j][b];
            
            const ti = summarize(teams[i]);
            const tj = summarize(teams[j]);
            
            const tiMaleAfter = ti.male - (pi.gender === "male" ? 1 : 0) + (pj.gender === "male" ? 1 : 0);
            const tjMaleAfter = tj.male - (pj.gender === "male" ? 1 : 0) + (pi.gender === "male" ? 1 : 0);
            const tiFemaleAfter = ti.female - (pi.gender === "female" ? 1 : 0) + (pj.gender === "female" ? 1 : 0);
            const tjFemaleAfter = tj.female - (pj.gender === "female" ? 1 : 0) + (pi.gender === "female" ? 1 : 0);
            
            // Kiểm tra không âm
            if (tiMaleAfter < 0 || tjMaleAfter < 0 || tiFemaleAfter < 0 || tjFemaleAfter < 0) {
              continue;
            }
            
            // Kiểm tra chênh lệch giới tính giữa các đội không quá 1
            // Cần tính lại cho tất cả các đội
            const allMales = teams.map((t, idx) => {
              if (idx === i) return tiMaleAfter;
              if (idx === j) return tjMaleAfter;
              return summarize(t).male;
            });
            const allFemales = teams.map((t, idx) => {
              if (idx === i) return tiFemaleAfter;
              if (idx === j) return tjFemaleAfter;
              return summarize(t).female;
            });
            
            const maleDiff = Math.max(...allMales) - Math.min(...allMales);
            const femaleDiff = Math.max(...allFemales) - Math.min(...allFemales);
            
            if (maleDiff > 1 || femaleDiff > 1) {
              continue;
            }
            
            const tiSkillAfter = ti.totalSkill - pi.skillLevel + pj.skillLevel;
            const tjSkillAfter = tj.totalSkill - pj.skillLevel + pi.skillLevel;
            
            const totals = teams.map((t, idx) => {
              if (idx === i) return tiSkillAfter;
              if (idx === j) return tjSkillAfter;
              return summarize(t).totalSkill;
            });
            const spreadAfter = Math.max(...totals) - Math.min(...totals);
            const gain = currentSpread - spreadAfter;
            if (gain > bestGain) {
              bestGain = gain;
              bestSwap = [i, a, j, b];
            }
          }
        }
      }
    }

    if (bestSwap) {
      const [i, a, j, b] = bestSwap;
      const pi = teams[i][a];
      const pj = teams[j][b];
      teams[i][a] = { ...pj, team: `Đội ${i + 1}` };
      teams[j][b] = { ...pi, team: `Đội ${j + 1}` };
      improved = true;
    }
  }

  const splitTeamsResult = teams.map((team, idx) => ({
    name: `Đội ${idx + 1}`,
    players: team,
    stats: summarize(team)
  }));

  const warnings: string[] = [];
  if (activePlayers.length < safeTeamCount * 2) {
    warnings.push(`Cần ít nhất ${safeTeamCount * 2} người cho ${safeTeamCount} đội.`);
  }
  
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