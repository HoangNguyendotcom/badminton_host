import { useState } from "react";
import type { Player, MatchType, MatchPlayer, GameMode } from "@/types";

interface Props {
  players: Player[];
  defaultMatchType?: MatchType;
  gameMode?: GameMode;
  onCreateMatch: (teamA: MatchPlayer[], teamB: MatchPlayer[], matchType: MatchType) => void;
  onCancel: () => void;
}

const matchTypeConfig: Record<MatchType, { label: string; playersPerTeam: number; genderFilter: "male" | "female" | "mixed" }> = {
  MS: { label: "Đơn Nam", playersPerTeam: 1, genderFilter: "male" },
  WS: { label: "Đơn Nữ", playersPerTeam: 1, genderFilter: "female" },
  XD: { label: "Đôi Nam Nữ", playersPerTeam: 2, genderFilter: "mixed" },
  MD: { label: "Đôi Nam", playersPerTeam: 2, genderFilter: "male" },
  WD: { label: "Đôi Nữ", playersPerTeam: 2, genderFilter: "female" },
};

// Check if a match type has enough players
function canPlayMatchType(type: MatchType, maleCount: number, femaleCount: number): boolean {
  switch (type) {
    case "MS": return maleCount >= 2;
    case "WS": return femaleCount >= 2;
    case "XD": return maleCount >= 2 && femaleCount >= 2;
    case "MD": return maleCount >= 4;
    case "WD": return femaleCount >= 4;
  }
}

export function MatchCreator({ players, defaultMatchType = "MD", gameMode = "free_play", onCreateMatch, onCancel }: Props) {
  const activePlayers = players.filter((p) => p.isActive);
  const maleCount = activePlayers.filter((p) => p.gender === "male").length;
  const femaleCount = activePlayers.filter((p) => p.gender === "female").length;
  const isTeamMode = gameMode === "team";

  // Find first available match type
  const getFirstAvailableType = (): MatchType => {
    const order: MatchType[] = ["MD", "WD", "XD", "MS", "WS"];
    for (const type of order) {
      if (canPlayMatchType(type, maleCount, femaleCount)) return type;
    }
    return "MD"; // fallback
  };

  const initialType = canPlayMatchType(defaultMatchType, maleCount, femaleCount)
    ? defaultMatchType
    : getFirstAvailableType();

  const [matchType, setMatchType] = useState<MatchType>(initialType);
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);

  const config = matchTypeConfig[matchType];
  const playersPerTeam = config.playersPerTeam;

  const selectedIds = new Set([...teamA, ...teamB]);

  // Get gender needs for a team in mixed doubles
  const getTeamGenderNeed = (team: string[]): "male" | "female" | "any" => {
    if (config.genderFilter !== "mixed") return "any";
    if (team.length === 0) return "any";
    const existingPlayer = players.find((p) => p.id === team[0]);
    if (!existingPlayer) return "any";
    // Need the opposite gender
    return existingPlayer.gender === "male" ? "female" : "male";
  };

  // Get the teams of players in a match side
  const getTeamsOfPlayers = (playerIds: string[]): Set<string> => {
    const teams = new Set<string>();
    for (const id of playerIds) {
      const player = players.find((p) => p.id === id);
      if (player?.team) teams.add(player.team);
    }
    return teams;
  };

  // Filter available players based on match type, team needs, and team mode restrictions
  const getAvailablePlayersForTeam = (thisTeam: string[], otherTeam: string[]) => {
    let filtered = activePlayers.filter((p) => !selectedIds.has(p.id));

    // Gender filter based on match type
    if (config.genderFilter === "male") {
      filtered = filtered.filter((p) => p.gender === "male");
    } else if (config.genderFilter === "female") {
      filtered = filtered.filter((p) => p.gender === "female");
    } else if (config.genderFilter === "mixed" && thisTeam.length === 1) {
      // For mixed doubles, need opposite gender
      const need = getTeamGenderNeed(thisTeam);
      if (need !== "any") {
        filtered = filtered.filter((p) => p.gender === need);
      }
    }

    // In team mode, players from the same team cannot be opponents
    if (isTeamMode && otherTeam.length > 0) {
      const opponentTeams = getTeamsOfPlayers(otherTeam);
      if (opponentTeams.size > 0) {
        // Filter out players who are in the same team as the opponents
        filtered = filtered.filter((p) => !p.team || !opponentTeams.has(p.team));
      }
    }

    return filtered;
  };

  const availablePlayersForA = getAvailablePlayersForTeam(teamA, teamB);
  const availablePlayersForB = getAvailablePlayersForTeam(teamB, teamA);
  const availablePlayers = activePlayers.filter((p) => !selectedIds.has(p.id));

  const canCreate = teamA.length === playersPerTeam && teamB.length === playersPerTeam;

  const handleAddToTeam = (playerId: string, team: "a" | "b") => {
    if (team === "a" && teamA.length < playersPerTeam) {
      setTeamA([...teamA, playerId]);
    } else if (team === "b" && teamB.length < playersPerTeam) {
      setTeamB([...teamB, playerId]);
    }
  };

  const handleRemoveFromTeam = (playerId: string, team: "a" | "b") => {
    if (team === "a") {
      setTeamA(teamA.filter((id) => id !== playerId));
    } else {
      setTeamB(teamB.filter((id) => id !== playerId));
    }
  };

  const handleCreate = () => {
    if (!canCreate) return;

    const teamAPlayers = teamA.map((id) => {
      const p = players.find((pl) => pl.id === id)!;
      return { id: p.id, name: p.name, gender: p.gender, skillLevel: p.skillLevel };
    });

    const teamBPlayers = teamB.map((id) => {
      const p = players.find((pl) => pl.id === id)!;
      return { id: p.id, name: p.name, gender: p.gender, skillLevel: p.skillLevel };
    });

    onCreateMatch(teamAPlayers, teamBPlayers, matchType);
  };

  const handleAutoBalance = () => {
    // Filter players by gender requirements
    let eligiblePlayers = [...activePlayers];

    if (config.genderFilter === "male") {
      eligiblePlayers = eligiblePlayers.filter((p) => p.gender === "male");
    } else if (config.genderFilter === "female") {
      eligiblePlayers = eligiblePlayers.filter((p) => p.gender === "female");
    }

    // Helper to calculate skill difference
    const getSkillDiff = (a: Player[], b: Player[]) => {
      const skillA = a.reduce((sum, p) => sum + p.skillLevel, 0);
      const skillB = b.reduce((sum, p) => sum + p.skillLevel, 0);
      return Math.abs(skillA - skillB);
    };

    // Helper to pick random element from array
    const randomPick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Max allowed skill difference for "balanced" matches
    const MAX_DIFF = 2;

    // In team mode, we need to pick players from different teams and balance skill
    if (isTeamMode) {
      // Group players by their team
      const teamGroups = new Map<string, Player[]>();
      for (const p of eligiblePlayers) {
        if (p.team) {
          const group = teamGroups.get(p.team) || [];
          group.push(p);
          teamGroups.set(p.team, group);
        }
      }

      // Need at least 2 different teams
      const teamNames = Array.from(teamGroups.keys());
      if (teamNames.length < 2) return;

      if (config.genderFilter === "mixed") {
        // For mixed doubles in team mode
        const validTeams: { name: string; males: Player[]; females: Player[] }[] = [];
        for (const [name, members] of teamGroups) {
          const males = members.filter((p) => p.gender === "male");
          const females = members.filter((p) => p.gender === "female");
          if (males.length >= 1 && females.length >= 1) {
            validTeams.push({ name, males, females });
          }
        }
        if (validTeams.length < 2) return;

        // Collect all balanced combinations
        const balancedPairs: { teamA: Player[]; teamB: Player[]; diff: number }[] = [];

        for (let i = 0; i < validTeams.length; i++) {
          for (let j = i + 1; j < validTeams.length; j++) {
            const t1 = validTeams[i];
            const t2 = validTeams[j];
            for (const m1 of t1.males) {
              for (const f1 of t1.females) {
                for (const m2 of t2.males) {
                  for (const f2 of t2.females) {
                    const diff = getSkillDiff([m1, f1], [m2, f2]);
                    balancedPairs.push({ teamA: [m1, f1], teamB: [m2, f2], diff });
                  }
                }
              }
            }
          }
        }

        if (balancedPairs.length === 0) return;

        // Find minimum difference and filter to balanced ones
        const minDiff = Math.min(...balancedPairs.map((p) => p.diff));
        const goodPairs = balancedPairs.filter((p) => p.diff <= Math.max(minDiff, MAX_DIFF));
        const selected = randomPick(goodPairs);

        setTeamA(selected.teamA.map((p) => p.id));
        setTeamB(selected.teamB.map((p) => p.id));
      } else if (playersPerTeam === 2) {
        // Doubles in team mode
        const validTeams: { name: string; players: Player[] }[] = [];
        for (const [name, members] of teamGroups) {
          if (members.length >= 2) {
            validTeams.push({ name, players: members });
          }
        }
        if (validTeams.length < 2) return;

        // Collect all balanced combinations
        const balancedPairs: { teamA: Player[]; teamB: Player[]; diff: number }[] = [];

        for (let i = 0; i < validTeams.length; i++) {
          for (let j = i + 1; j < validTeams.length; j++) {
            const t1Players = validTeams[i].players;
            const t2Players = validTeams[j].players;
            for (let a1 = 0; a1 < t1Players.length; a1++) {
              for (let a2 = a1 + 1; a2 < t1Players.length; a2++) {
                for (let b1 = 0; b1 < t2Players.length; b1++) {
                  for (let b2 = b1 + 1; b2 < t2Players.length; b2++) {
                    const pairA = [t1Players[a1], t1Players[a2]];
                    const pairB = [t2Players[b1], t2Players[b2]];
                    const diff = getSkillDiff(pairA, pairB);
                    balancedPairs.push({ teamA: pairA, teamB: pairB, diff });
                  }
                }
              }
            }
          }
        }

        if (balancedPairs.length === 0) return;

        const minDiff = Math.min(...balancedPairs.map((p) => p.diff));
        const goodPairs = balancedPairs.filter((p) => p.diff <= Math.max(minDiff, MAX_DIFF));
        const selected = randomPick(goodPairs);

        setTeamA(selected.teamA.map((p) => p.id));
        setTeamB(selected.teamB.map((p) => p.id));
      } else {
        // Singles in team mode
        const balancedPairs: { teamA: Player; teamB: Player; diff: number }[] = [];

        for (let i = 0; i < teamNames.length; i++) {
          for (let j = i + 1; j < teamNames.length; j++) {
            const t1Players = teamGroups.get(teamNames[i]) || [];
            const t2Players = teamGroups.get(teamNames[j]) || [];
            for (const p1 of t1Players) {
              for (const p2 of t2Players) {
                const diff = Math.abs(p1.skillLevel - p2.skillLevel);
                balancedPairs.push({ teamA: p1, teamB: p2, diff });
              }
            }
          }
        }

        if (balancedPairs.length === 0) return;

        const minDiff = Math.min(...balancedPairs.map((p) => p.diff));
        const goodPairs = balancedPairs.filter((p) => p.diff <= Math.max(minDiff, MAX_DIFF));
        const selected = randomPick(goodPairs);

        setTeamA([selected.teamA.id]);
        setTeamB([selected.teamB.id]);
      }
    } else {
      // Free play mode - random balanced selection
      if (config.genderFilter === "mixed") {
        const males = eligiblePlayers.filter((p) => p.gender === "male");
        const females = eligiblePlayers.filter((p) => p.gender === "female");

        if (males.length < 2 || females.length < 2) return;

        // Collect all balanced combinations
        const balancedPairs: { teamA: Player[]; teamB: Player[]; diff: number }[] = [];
        for (let m1 = 0; m1 < males.length; m1++) {
          for (let m2 = m1 + 1; m2 < males.length; m2++) {
            for (let f1 = 0; f1 < females.length; f1++) {
              for (let f2 = f1 + 1; f2 < females.length; f2++) {
                // Try both pairings
                const diff1 = getSkillDiff([males[m1], females[f1]], [males[m2], females[f2]]);
                const diff2 = getSkillDiff([males[m1], females[f2]], [males[m2], females[f1]]);
                balancedPairs.push({ teamA: [males[m1], females[f1]], teamB: [males[m2], females[f2]], diff: diff1 });
                balancedPairs.push({ teamA: [males[m1], females[f2]], teamB: [males[m2], females[f1]], diff: diff2 });
              }
            }
          }
        }

        if (balancedPairs.length === 0) return;

        const minDiff = Math.min(...balancedPairs.map((p) => p.diff));
        const goodPairs = balancedPairs.filter((p) => p.diff <= Math.max(minDiff, MAX_DIFF));
        const selected = randomPick(goodPairs);

        setTeamA(selected.teamA.map((p) => p.id));
        setTeamB(selected.teamB.map((p) => p.id));
      } else if (playersPerTeam === 2) {
        // Doubles (same gender)
        if (eligiblePlayers.length < 4) return;

        // Collect all balanced combinations
        const balancedPairs: { teamA: Player[]; teamB: Player[]; diff: number }[] = [];
        for (let a1 = 0; a1 < eligiblePlayers.length; a1++) {
          for (let a2 = a1 + 1; a2 < eligiblePlayers.length; a2++) {
            for (let b1 = 0; b1 < eligiblePlayers.length; b1++) {
              if (b1 === a1 || b1 === a2) continue;
              for (let b2 = b1 + 1; b2 < eligiblePlayers.length; b2++) {
                if (b2 === a1 || b2 === a2) continue;
                const pairA = [eligiblePlayers[a1], eligiblePlayers[a2]];
                const pairB = [eligiblePlayers[b1], eligiblePlayers[b2]];
                const diff = getSkillDiff(pairA, pairB);
                balancedPairs.push({ teamA: pairA, teamB: pairB, diff });
              }
            }
          }
        }

        if (balancedPairs.length === 0) return;

        const minDiff = Math.min(...balancedPairs.map((p) => p.diff));
        const goodPairs = balancedPairs.filter((p) => p.diff <= Math.max(minDiff, MAX_DIFF));
        const selected = randomPick(goodPairs);

        setTeamA(selected.teamA.map((p) => p.id));
        setTeamB(selected.teamB.map((p) => p.id));
      } else {
        // Singles
        if (eligiblePlayers.length < 2) return;

        // Collect all balanced combinations
        const balancedPairs: { teamA: Player; teamB: Player; diff: number }[] = [];
        for (let i = 0; i < eligiblePlayers.length; i++) {
          for (let j = i + 1; j < eligiblePlayers.length; j++) {
            const diff = Math.abs(eligiblePlayers[i].skillLevel - eligiblePlayers[j].skillLevel);
            balancedPairs.push({ teamA: eligiblePlayers[i], teamB: eligiblePlayers[j], diff });
          }
        }

        if (balancedPairs.length === 0) return;

        const minDiff = Math.min(...balancedPairs.map((p) => p.diff));
        const goodPairs = balancedPairs.filter((p) => p.diff <= Math.max(minDiff, MAX_DIFF));
        const selected = randomPick(goodPairs);

        setTeamA([selected.teamA.id]);
        setTeamB([selected.teamB.id]);
      }
    }
  };

  const getPlayerById = (id: string) => players.find((p) => p.id === id);

  const teamASkill = teamA.reduce((sum, id) => sum + (getPlayerById(id)?.skillLevel || 0), 0);
  const teamBSkill = teamB.reduce((sum, id) => sum + (getPlayerById(id)?.skillLevel || 0), 0);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
    >
      <div
        style={{
          background: "white",
          padding: 24,
          borderRadius: 12,
          maxWidth: 600,
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        <h2 style={{ margin: "0 0 16px 0" }}>Tạo trận đấu</h2>

        {/* Match Type Selection */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Loại trận</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(Object.keys(matchTypeConfig) as MatchType[]).map((type) => {
              const isAvailable = canPlayMatchType(type, maleCount, femaleCount);
              const isSelected = matchType === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    if (!isAvailable) return;
                    setMatchType(type);
                    setTeamA([]);
                    setTeamB([]);
                  }}
                  disabled={!isAvailable}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: isSelected ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                    background: !isAvailable ? "#f1f5f9" : isSelected ? "#eff6ff" : "#fff",
                    color: !isAvailable ? "#94a3b8" : "#1e293b",
                    cursor: isAvailable ? "pointer" : "not-allowed",
                    opacity: isAvailable ? 1 : 0.6
                  }}
                >
                  {matchTypeConfig[type].label}
                </button>
              );
            })}
          </div>
          <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            Nam: {maleCount} • Nữ: {femaleCount}
          </div>
        </div>

        {/* Teams Selection */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Team A */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <strong style={{ color: "#16a34a" }}>Đội A</strong>
              <span className="muted">Điểm: {teamASkill}</span>
            </div>
            <div style={{ minHeight: 60, marginBottom: 8 }}>
              {teamA.map((id) => {
                const p = getPlayerById(id);
                return p ? (
                  <div
                    key={id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 8px",
                      background: "#dcfce7",
                      borderRadius: 6,
                      marginBottom: 4
                    }}
                  >
                    <span>{p.name} ({p.skillLevel})</span>
                    <button
                      onClick={() => handleRemoveFromTeam(id, "a")}
                      style={{ border: "none", background: "transparent", cursor: "pointer", color: "#dc2626" }}
                    >
                      ×
                    </button>
                  </div>
                ) : null;
              })}
              {teamA.length === 0 && <div className="muted">Chọn {playersPerTeam} người chơi</div>}
            </div>
          </div>

          {/* Team B */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <strong style={{ color: "#2563eb" }}>Đội B</strong>
              <span className="muted">Điểm: {teamBSkill}</span>
            </div>
            <div style={{ minHeight: 60, marginBottom: 8 }}>
              {teamB.map((id) => {
                const p = getPlayerById(id);
                return p ? (
                  <div
                    key={id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 8px",
                      background: "#dbeafe",
                      borderRadius: 6,
                      marginBottom: 4
                    }}
                  >
                    <span>{p.name} ({p.skillLevel})</span>
                    <button
                      onClick={() => handleRemoveFromTeam(id, "b")}
                      style={{ border: "none", background: "transparent", cursor: "pointer", color: "#dc2626" }}
                    >
                      ×
                    </button>
                  </div>
                ) : null;
              })}
              {teamB.length === 0 && <div className="muted">Chọn {playersPerTeam} người chơi</div>}
            </div>
          </div>
        </div>

        {/* Skill Balance Indicator */}
        {teamA.length > 0 && teamB.length > 0 && (
          <div
            style={{
              padding: 8,
              borderRadius: 6,
              background: Math.abs(teamASkill - teamBSkill) <= 2 ? "#dcfce7" : "#fef3c7",
              marginBottom: 16,
              textAlign: "center"
            }}
          >
            Chênh lệch điểm: {Math.abs(teamASkill - teamBSkill)}
            {Math.abs(teamASkill - teamBSkill) <= 2 ? " (Cân bằng)" : " (Chưa cân bằng)"}
          </div>
        )}

        {/* Available Players */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontWeight: 500 }}>Người chơi ({availablePlayers.length})</label>
            <button
              onClick={handleAutoBalance}
              style={{
                padding: "12px 20px",
                borderRadius: 8,
                border: "none",
                background: "#16a34a",
                color: "white",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600
              }}
            >
              Tự động cân bằng
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {availablePlayers.map((p) => {
              const canAddToA = teamA.length < playersPerTeam && availablePlayersForA.some((ap) => ap.id === p.id);
              const canAddToB = teamB.length < playersPerTeam && availablePlayersForB.some((ap) => ap.id === p.id);

              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: "#fff"
                  }}
                >
                  <span style={{ color: p.gender === "male" ? "#2563eb" : "#db2777" }}>{p.gender === "male" ? "♂" : "♀"}</span>
                  <span>{p.name}</span>
                  <span className="muted">({p.skillLevel})</span>
                  <button
                    onClick={() => handleAddToTeam(p.id, "a")}
                    disabled={!canAddToA}
                    style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      border: "none",
                      background: canAddToA ? "#16a34a" : "#cbd5e1",
                      color: "white",
                      cursor: canAddToA ? "pointer" : "not-allowed",
                      fontSize: 12
                    }}
                  >
                    A
                  </button>
                  <button
                    onClick={() => handleAddToTeam(p.id, "b")}
                    disabled={!canAddToB}
                    style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      border: "none",
                      background: canAddToB ? "#2563eb" : "#cbd5e1",
                      color: "white",
                      cursor: canAddToB ? "pointer" : "not-allowed",
                      fontSize: 12
                    }}
                  >
                    B
                  </button>
                </div>
              );
            })}
            {availablePlayers.length === 0 && (
              <div className="muted">Không còn người chơi khả dụng</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              cursor: "pointer"
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: canCreate ? "#3b82f6" : "#cbd5e1",
              color: "white",
              cursor: canCreate ? "pointer" : "not-allowed"
            }}
          >
            Tạo trận
          </button>
        </div>
      </div>
    </div>
  );
}
