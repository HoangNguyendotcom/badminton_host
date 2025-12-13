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

function canPlayMatchType(type: MatchType, maleCount: number, femaleCount: number): boolean {
  switch (type) {
    case "MS": return maleCount >= 2;
    case "WS": return femaleCount >= 2;
    case "XD": return maleCount >= 2 && femaleCount >= 2;
    case "MD": return maleCount >= 4;
    case "WD": return femaleCount >= 4;
  }
}

// Player Selection Modal Component
interface PlayerSelectionModalProps {
  players: Player[];
  onSelect: (player: Player) => void;
  onClose: () => void;
  title: string;
  teamColor: string;
}

function PlayerSelectionModal({ players, onSelect, onClose, title, teamColor }: PlayerSelectionModalProps) {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // Group players by team
  const groupedPlayers = players.reduce((acc, player) => {
    const teamName = player.team || "Không có đội";
    if (!acc[teamName]) acc[teamName] = [];
    acc[teamName].push(player);
    return acc;
  }, {} as Record<string, Player[]>);

  const toggleTeam = (teamName: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamName)) {
      newExpanded.delete(teamName);
    } else {
      newExpanded.add(teamName);
    }
    setExpandedTeams(newExpanded);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          maxWidth: 600,
          width: "90%",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          animation: "scaleIn 0.3s ease-out",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: "20px 24px", 
          borderBottom: "2px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f8fafc"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>
              Chọn người chơi từ danh sách bên dưới
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#e2e8f0",
              width: 32,
              height: 32,
              borderRadius: "50%",
              fontSize: 20,
              cursor: "pointer",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ×
          </button>
        </div>

        {/* Player List */}
        <div style={{ 
          overflowY: "auto", 
          padding: "16px 24px 24px",
          flex: 1
        }}>
          {Object.entries(groupedPlayers).length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "40px 20px",
              color: "#94a3b8"
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
              <p style={{ margin: 0, fontSize: 15 }}>Không có người chơi khả dụng</p>
            </div>
          ) : (
            Object.entries(groupedPlayers).map(([teamName, teamPlayers]) => (
              <div key={teamName} style={{ marginBottom: 12 }}>
                {/* Team Header */}
                <button
                  onClick={() => toggleTeam(teamName)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 600,
                    fontSize: 15,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                  }}
                >
                  <span>
                    {teamName} 
                    <span style={{ 
                      marginLeft: 8, 
                      color: "#64748b",
                      fontSize: 13,
                      fontWeight: 500
                    }}>
                      ({teamPlayers.length} người)
                    </span>
                  </span>
                  <span style={{ 
                    fontSize: 18,
                    color: "#64748b",
                    transition: "transform 0.2s",
                    transform: expandedTeams.has(teamName) ? "rotate(180deg)" : "rotate(0deg)"
                  }}>
                    ▼
                  </span>
                </button>

                {/* Team Players */}
                {expandedTeams.has(teamName) && (
                  <div style={{ marginTop: 8, paddingLeft: 4 }}>
                    {teamPlayers.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => onSelect(player)}
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          background: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f8fafc";
                          e.currentTarget.style.borderColor = teamColor;
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ 
                            color: player.gender === "male" ? "#2563eb" : "#db2777",
                            fontSize: 20
                          }}>
                            {player.gender === "male" ? "♂" : "♀"}
                          </span>
                          <span style={{ fontWeight: 500, fontSize: 15 }}>{player.name}</span>
                        </div>
                        <span style={{ 
                          color: "#64748b", 
                          fontSize: 14,
                          background: "#f1f5f9",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontWeight: 500
                        }}>
                          Điểm: {player.skillLevel}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Player Slot Component
interface PlayerSlotProps {
  player: Player | null;
  slotNumber: number;
  teamColor: string;
  teamLabel: string;
  onAdd: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

function PlayerSlot({ player, slotNumber, teamColor, teamLabel, onAdd, onRemove, disabled }: PlayerSlotProps) {
  return (
    <div style={{
      border: `2px dashed ${player ? teamColor : "#cbd5e1"}`,
      borderRadius: 12,
      padding: 16,
      background: player ? `${teamColor}10` : "#f8fafc",
      minHeight: 80,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      transition: "all 0.2s"
    }}>
      {player ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
              {teamLabel} - Người chơi {slotNumber}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ 
                color: player.gender === "male" ? "#2563eb" : "#db2777",
                fontSize: 18
              }}>
                {player.gender === "male" ? "♂" : "♀"}
              </span>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{player.name}</span>
              <span style={{ 
                color: "#64748b",
                fontSize: 13,
                background: "#fff",
                padding: "2px 8px",
                borderRadius: 4
              }}>
                {player.skillLevel} điểm
              </span>
            </div>
            {player.team && (
              <div style={{ 
                fontSize: 12, 
                color: "#64748b", 
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}>
                <span>👥</span>
                <span>{player.team}</span>
              </div>
            )}
          </div>
          <button
            onClick={onRemove}
            style={{
              border: "none",
              background: "#fee2e2",
              color: "#dc2626",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fecaca";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fee2e2";
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={onAdd}
          disabled={disabled}
          style={{
            border: "none",
            background: "transparent",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: disabled ? 0.5 : 1,
            width: "100%"
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: disabled ? "#e2e8f0" : teamColor,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 300
          }}>
            +
          </div>
          <span style={{ 
            fontSize: 14, 
            color: "#64748b",
            fontWeight: 500
          }}>
            {disabled ? "Chọn người chơi trước" : `Thêm người chơi ${slotNumber}`}
          </span>
        </button>
      )}
    </div>
  );
}

export function MatchCreator({ players, defaultMatchType = "MD", gameMode = "free_play", onCreateMatch, onCancel }: Props) {
  const activePlayers = players.filter((p) => p.isActive);
  const maleCount = activePlayers.filter((p) => p.gender === "male").length;
  const femaleCount = activePlayers.filter((p) => p.gender === "female").length;
  const isTeamMode = gameMode === "team";

  const getFirstAvailableType = (): MatchType => {
    const order: MatchType[] = ["MD", "WD", "XD", "MS", "WS"];
    for (const type of order) {
      if (canPlayMatchType(type, maleCount, femaleCount)) return type;
    }
    return "MD";
  };

  const initialType = canPlayMatchType(defaultMatchType, maleCount, femaleCount)
    ? defaultMatchType
    : getFirstAvailableType();

  const [matchType, setMatchType] = useState<MatchType>(initialType);
  const [blueTeam, setBlueTeam] = useState<(Player | null)[]>([null, null]);
  const [redTeam, setRedTeam] = useState<(Player | null)[]>([null, null]);
  const [showModal, setShowModal] = useState<{ team: "blue" | "red", slot: number } | null>(null);

  const config = matchTypeConfig[matchType];
  const playersPerTeam = config.playersPerTeam;

  // Get available players for a specific slot
  const getAvailablePlayersForSlot = (team: "blue" | "red", slotIndex: number): Player[] => {
    const currentTeam = team === "blue" ? blueTeam : redTeam;
    const otherTeam = team === "blue" ? redTeam : blueTeam;
    
    // Get all selected player IDs
    const selectedIds = new Set([
      ...blueTeam.filter(p => p !== null).map(p => p!.id),
      ...redTeam.filter(p => p !== null).map(p => p!.id)
    ]);

    let filtered = activePlayers.filter(p => !selectedIds.has(p.id));

    // Apply gender filter based on match type
    if (config.genderFilter === "male") {
      filtered = filtered.filter(p => p.gender === "male");
    } else if (config.genderFilter === "female") {
      filtered = filtered.filter(p => p.gender === "female");
    } else if (config.genderFilter === "mixed") {
      // For mixed doubles, need opposite gender for the second player
      if (slotIndex === 1 && currentTeam[0]) {
        const firstPlayerGender = currentTeam[0].gender;
        filtered = filtered.filter(p => p.gender !== firstPlayerGender);
      }
    }

    // TEAM MODE ENFORCEMENT
    if (isTeamMode && playersPerTeam === 2) {
      // For the second slot, must be from same team as first player
      if (slotIndex === 1 && currentTeam[0]) {
        const firstPlayerTeam = currentTeam[0].team;
        if (firstPlayerTeam) {
          filtered = filtered.filter(p => p.team === firstPlayerTeam);
        }
      }

      // For red team, exclude the entire blue team
      if (team === "red") {
        const bluePlayerWithTeam = blueTeam.find(p => p && p.team);
        if (bluePlayerWithTeam && bluePlayerWithTeam.team) {
          filtered = filtered.filter(p => p.team !== bluePlayerWithTeam.team);
        }
      }

      // For blue team second slot, if red team has players, ensure different teams
      if (team === "blue" && slotIndex === 1) {
        const redPlayerWithTeam = redTeam.find(p => p && p.team);
        if (redPlayerWithTeam && redPlayerWithTeam.team && currentTeam[0]) {
          // Already filtered by first player's team above
        }
      }
    }

    return filtered;
  };

  const handleAddPlayer = (team: "blue" | "red", slotIndex: number) => {
    setShowModal({ team, slot: slotIndex });
  };

  const handleSelectPlayer = (player: Player) => {
    if (!showModal) return;

    const { team, slot } = showModal;
    
    if (team === "blue") {
      const newTeam = [...blueTeam];
      newTeam[slot] = player;
      setBlueTeam(newTeam);
    } else {
      const newTeam = [...redTeam];
      newTeam[slot] = player;
      setRedTeam(newTeam);
    }

    setShowModal(null);
  };

  const handleRemovePlayer = (team: "blue" | "red", slotIndex: number) => {
    if (team === "blue") {
      const newTeam = [...blueTeam];
      // If removing first player, clear both slots
      if (slotIndex === 0 && playersPerTeam === 2) {
        newTeam[0] = null;
        newTeam[1] = null;
      } else {
        newTeam[slotIndex] = null;
      }
      setBlueTeam(newTeam);
    } else {
      const newTeam = [...redTeam];
      // If removing first player, clear both slots
      if (slotIndex === 0 && playersPerTeam === 2) {
        newTeam[0] = null;
        newTeam[1] = null;
      } else {
        newTeam[slotIndex] = null;
      }
      setRedTeam(newTeam);
    }
  };

  const handleMatchTypeChange = (type: MatchType) => {
    setMatchType(type);
    setBlueTeam([null, null]);
    setRedTeam([null, null]);
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

        setBlueTeam([selected.teamA[0], selected.teamA[1]]);
        setRedTeam([selected.teamB[0], selected.teamB[1]]);
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

        setBlueTeam([selected.teamA[0], selected.teamA[1]]);
        setRedTeam([selected.teamB[0], selected.teamB[1]]);
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

        setBlueTeam([selected.teamA, null]);
        setRedTeam([selected.teamB, null]);
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

        setBlueTeam([selected.teamA[0], selected.teamA[1]]);
        setRedTeam([selected.teamB[0], selected.teamB[1]]);
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

        setBlueTeam([selected.teamA[0], selected.teamA[1]]);
        setRedTeam([selected.teamB[0], selected.teamB[1]]);
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

        setBlueTeam([selected.teamA, null]);
        setRedTeam([selected.teamB, null]);
      }
    }
  };

  const handleCreate = () => {
    const bluePlayers = blueTeam.slice(0, playersPerTeam).filter((p): p is Player => p !== null);
    const redPlayers = redTeam.slice(0, playersPerTeam).filter((p): p is Player => p !== null);

    if (bluePlayers.length !== playersPerTeam || redPlayers.length !== playersPerTeam) return;

    const blueMatchPlayers: MatchPlayer[] = bluePlayers.map(p => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      skillLevel: p.skillLevel
    }));

    const redMatchPlayers: MatchPlayer[] = redPlayers.map(p => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      skillLevel: p.skillLevel
    }));

    onCreateMatch(blueMatchPlayers, redMatchPlayers, matchType);
  };

  const blueSkill = blueTeam.reduce((sum, p) => sum + (p?.skillLevel || 0), 0);
  const redSkill = redTeam.reduce((sum, p) => sum + (p?.skillLevel || 0), 0);
  const blueComplete = blueTeam.slice(0, playersPerTeam).every(p => p !== null);
  const redComplete = redTeam.slice(0, playersPerTeam).every(p => p !== null);
  const canCreate = blueComplete && redComplete;

  return (
    <>
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
            padding: 32,
            borderRadius: 16,
            maxWidth: 700,
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}
        >
          <h2 style={{ margin: "0 0 24px 0", fontSize: 24, fontWeight: 700 }}>Tạo trận đấu</h2>

          {/* Match Type Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 12, fontWeight: 600, fontSize: 15 }}>
              Loại trận đấu
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {(Object.keys(matchTypeConfig) as MatchType[]).map((type) => {
                const isAvailable = canPlayMatchType(type, maleCount, femaleCount);
                const isSelected = matchType === type;
                return (
                  <button
                    key={type}
                    onClick={() => isAvailable && handleMatchTypeChange(type)}
                    disabled={!isAvailable}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: isSelected ? "2px solid #3b82f6" : "2px solid #e2e8f0",
                      background: !isAvailable ? "#f1f5f9" : isSelected ? "#dbeafe" : "#fff",
                      color: !isAvailable ? "#94a3b8" : isSelected ? "#1e40af" : "#1e293b",
                      cursor: isAvailable ? "pointer" : "not-allowed",
                      opacity: isAvailable ? 1 : 0.5,
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: 14,
                      transition: "all 0.2s"
                    }}
                  >
                    {matchTypeConfig[type].label}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: "#64748b" }}>
              👥 Nam: {maleCount} • Nữ: {femaleCount}
              {isTeamMode && " • Chế độ đội"}
            </div>
          </div>

          {/* Matching Method Selection */}
          <div style={{ 
            marginBottom: 24, 
            padding: 12, 
            background: "#f8fafc", 
            borderRadius: 10,
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", minWidth: "fit-content" }}>
                Phương thức:
              </span>
              <button
                onClick={handleAutoBalance}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #16a34a",
                  background: "#16a34a",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#15803d";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#16a34a";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <span>⚡</span>
                <span>Tự động ghép trận</span>
              </button>
              <div style={{
                flex: 1,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "white",
                color: "#64748b",
                fontWeight: 500,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}>
                <span>✋</span>
                <span>Chọn thủ công</span>
              </div>
            </div>
          </div>

          {/* Team Selection Area */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* Blue Team */}
            <div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 12
              }}>
                <h3 style={{ 
                  margin: 0, 
                  color: "#1e40af",
                  fontSize: 16,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <span style={{ fontSize: 20 }}>🔵</span>
                  Đội Xanh
                </h3>
                <span style={{ 
                  fontSize: 14,
                  color: "#64748b",
                  background: "#f1f5f9",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontWeight: 600
                }}>
                  {blueSkill} điểm
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Array.from({ length: playersPerTeam }).map((_, idx) => (
                  <PlayerSlot
                    key={idx}
                    player={blueTeam[idx]}
                    slotNumber={idx + 1}
                    teamColor="#3b82f6"
                    teamLabel="Đội Xanh"
                    onAdd={() => handleAddPlayer("blue", idx)}
                    onRemove={() => handleRemovePlayer("blue", idx)}
                    disabled={idx === 1 && !blueTeam[0]}
                  />
                ))}
              </div>
            </div>

            {/* Red Team */}
            <div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 12
              }}>
                <h3 style={{ 
                  margin: 0, 
                  color: "#dc2626",
                  fontSize: 16,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <span style={{ fontSize: 20 }}>🔴</span>
                  Đội Đỏ
                </h3>
                <span style={{ 
                  fontSize: 14,
                  color: "#64748b",
                  background: "#f1f5f9",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontWeight: 600
                }}>
                  {redSkill} điểm
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Array.from({ length: playersPerTeam }).map((_, idx) => (
                  <PlayerSlot
                    key={idx}
                    player={redTeam[idx]}
                    slotNumber={idx + 1}
                    teamColor="#ef4444"
                    teamLabel="Đội Đỏ"
                    onAdd={() => handleAddPlayer("red", idx)}
                    onRemove={() => handleRemovePlayer("red", idx)}
                    disabled={idx === 1 && !redTeam[0]}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Balance Indicator */}
          {blueComplete && redComplete && (
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: Math.abs(blueSkill - redSkill) <= 2 ? "#dcfce7" : "#fef3c7",
                marginBottom: 24,
                textAlign: "center",
                border: `2px solid ${Math.abs(blueSkill - redSkill) <= 2 ? "#86efac" : "#fde047"}`,
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {Math.abs(blueSkill - redSkill) <= 2 ? "✓" : "⚠"} Chênh lệch điểm: {Math.abs(blueSkill - redSkill)}
              {Math.abs(blueSkill - redSkill) <= 2 ? " - Cân bằng tốt!" : " - Chưa cân bằng"}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              onClick={onCancel}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "2px solid #e2e8f0",
                background: "white",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 15,
                color: "#64748b",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
              }}
            >
              Hủy
            </button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              style={{
                padding: "12px 32px",
                borderRadius: 10,
                border: "none",
                background: canCreate ? "#3b82f6" : "#cbd5e1",
                color: "white",
                cursor: canCreate ? "pointer" : "not-allowed",
                fontWeight: 700,
                fontSize: 15,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (canCreate) {
                  e.currentTarget.style.background = "#2563eb";
                }
              }}
              onMouseLeave={(e) => {
                if (canCreate) {
                  e.currentTarget.style.background = "#3b82f6";
                }
              }}
            >
              Tạo trận đấu
            </button>
          </div>
        </div>
      </div>

      {/* Player Selection Modal */}
      {showModal && (
        <PlayerSelectionModal
          players={getAvailablePlayersForSlot(showModal.team, showModal.slot)}
          onSelect={handleSelectPlayer}
          onClose={() => setShowModal(null)}
          title={`Chọn người chơi cho ${showModal.team === "blue" ? "Đội Xanh" : "Đội Đỏ"} - Vị trí ${showModal.slot + 1}`}
          teamColor={showModal.team === "blue" ? "#3b82f6" : "#ef4444"}
        />
      )}
    </>
  );
}