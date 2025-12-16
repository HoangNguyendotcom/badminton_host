'use client';

import { useEffect, useMemo, useState } from "react";
import { PlayerForm } from "@/components/PlayerForm";
import { PairForm } from "@/components/PairForm";
import { PlayerList } from "@/components/PlayerList";
import { PairList } from "@/components/PairList";
import { TeamPanel } from "@/components/TeamPanel";
import { ModeSelector } from "@/components/ModeSelector";
import { MatchCreator } from "@/components/MatchCreator";
import { MatchList } from "@/components/MatchList";
import { MatchScoreModal } from "@/components/MatchScoreModal";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { TournamentSetup } from "@/components/TournamentSetup";
import { TournamentBracket } from "@/components/TournamentBracket";
import { TournamentStandings } from "@/components/TournamentStandings";
import { TournamentScoreModal } from "@/components/TournamentScoreModal";
import {
  generateSessionCode,
  generateUniqueSessionCode,
  loadSession,
  saveSession,
  saveMatchesOnly,
  loadSessionSync,
  saveSessionSync,
  clearSessionData
} from "@/lib/sessionStore";
import { splitTeams } from "@/lib/teamSplitter";
import { recordTournamentMatchResult, isDoublesType } from "@/lib/tournament";
import type { Player, SplitResult, GameMode, TournamentFormat, MatchType, Match, MatchPlayer, MatchSide, TournamentData, TournamentMatch, TournamentPair } from "@/types";

const LAST_SESSION_KEY = "badminton-last-session";

type ViewSplit = SplitResult;

function buildViewFromPlayers(players: Player[], teamCount: number): ViewSplit {
  const names = Array.from({ length: Math.max(2, teamCount) }, (_, i) => `Đội ${i + 1}`);
  const teams = names.map((name) => {
    const members = players.filter((p) => p.team === name && p.isActive);
    const male = members.filter((p) => p.gender === "male").length;
    const female = members.filter((p) => p.gender === "female").length;
    const totalSkill = members.reduce((sum, p) => sum + p.skillLevel, 0);
    return { name, players: members, stats: { count: members.length, male, female, totalSkill } };
  });

  const bench = players.filter((p) => p.isActive && p.team === null);
  const warnings: string[] = [];
  const activeCount = players.filter((p) => p.isActive).length;
  if (activeCount < teamCount * 2) {
    warnings.push(`Cần ít nhất ${teamCount * 2} người cho ${teamCount} đội.`);
  }
  const diff = (arr: number[]) => (arr.length ? Math.max(...arr) - Math.min(...arr) : 0);
  const counts = teams.map((t) => t.stats.count);
  const males = teams.map((t) => t.stats.male);
  const females = teams.map((t) => t.stats.female);
  const skills = teams.map((t) => t.stats.totalSkill);
  if (diff(counts) > 1) warnings.push("Chênh lệch số người giữa các đội > 1");
  if (diff(males) > 1) warnings.push("Chênh lệch số nam giữa các đội > 1");
  if (diff(females) > 1) warnings.push("Chênh lệch số nữ giữa các đội > 1");
  if (diff(skills) > 5) warnings.push("Chênh lệch tổng điểm giữa các đội > 5");

  return { teams, bench, warnings };
}

export default function Page() {
  const [sessionCode, setSessionCode] = useState<string>("");
  const [inputSession, setInputSession] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [split, setSplit] = useState<SplitResult | null>(null);
  const [teamCount, setTeamCount] = useState<number>(2);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    gender: "male" as "male" | "female",
    skill: 5,
    isActive: true,
    team: null as string | null
  });
  const [gameMode, setGameMode] = useState<GameMode>("team");
  const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat | undefined>();
  const [matchType, setMatchType] = useState<MatchType | undefined>();
  const [address, setAddress] = useState<string | undefined>();
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showMatchCreator, setShowMatchCreator] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // Tournament state
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [showTournamentSetup, setShowTournamentSetup] = useState(false);
  const [selectedTournamentMatch, setSelectedTournamentMatch] = useState<TournamentMatch | null>(null);
  const [pairs, setPairs] = useState<TournamentPair[]>([]);

  // Team points tracking - recalculated from matches
  const teamPoints = useMemo(() => {
    if (gameMode !== "team") return {};

    const points: Record<string, number> = {};

    // Calculate points from all completed matches
    matches.forEach((match) => {
      if (match.status === "completed" && match.winner) {
        const winningPlayers = match.winner === "a" ? match.teamA : match.teamB;
        const playerData = players.find((p) => p.id === winningPlayers[0]?.id);
        if (playerData?.team) {
          points[playerData.team] = (points[playerData.team] || 0) + 1;
        }
      }
    });

    return points;
  }, [gameMode, matches, players]);

  // Player match statistics - count completed matches with wins/losses
  const playerMatchStats = useMemo(() => {
    const stats: Record<string, { played: number; won: number; lost: number }> = {};

    const completedMatches = matches.filter(m => m.status === "completed");

    completedMatches.forEach(match => {
      const teamAIds = match.teamA.map(p => p.id);
      const teamBIds = match.teamB.map(p => p.id);

      [...teamAIds, ...teamBIds].forEach(playerId => {
        if (!stats[playerId]) {
          stats[playerId] = { played: 0, won: 0, lost: 0 };
        }
        stats[playerId].played++;

        const isTeamA = teamAIds.includes(playerId);
        if ((match.winner === "a" && isTeamA) || (match.winner === "b" && !isTeamA)) {
          stats[playerId].won++;
        } else {
          stats[playerId].lost++;
        }
      });
    });

    return stats;
  }, [matches]);

  // Load session on refresh (check sessionStorage for active session)
  useEffect(() => {
    const loadActiveSession = async () => {
      // Check if there's an active session (survives refresh, cleared on window close)
      const activeSession = typeof window !== "undefined"
        ? sessionStorage.getItem("badminton-active-session")
        : null;

      if (activeSession) {
        // Refresh case: load session data
        const localSession = loadSessionSync(activeSession);
        if (localSession) {
          setSessionCode(localSession.sessionCode);
          setInputSession(localSession.sessionCode);
          setPlayers(localSession.players);
          setPairs(localSession.pairs || []);
          setGameMode(localSession.gameMode || "team");
          setTournamentFormat(localSession.tournamentFormat);
          setMatchType(localSession.matchType);
          setAddress(localSession.address);
          setMatches(localSession.matches || []);
          setTournament(localSession.tournament || null);
          setShowWelcome(false);
        }
        // Also try async load from Supabase for latest data
        const existing = await loadSession(activeSession);
        if (existing) {
          setSessionCode(existing.sessionCode);
          setInputSession(existing.sessionCode);
          setPlayers(existing.players);
          setPairs(existing.pairs || []);
          setGameMode(existing.gameMode || "team");
          setTournamentFormat(existing.tournamentFormat);
          setMatchType(existing.matchType);
          setAddress(existing.address);
          setMatches(existing.matches || []);
          setTournament(existing.tournament || null);
          setShowWelcome(false);
        }
      }
      // else: showWelcome remains true, display welcome screen
    };
    loadActiveSession();
  }, []);

  useEffect(() => {
    // Save to localStorage immediately for fast access
    const sessionData = {
      sessionCode,
      players,
      pairs: pairs.length > 0 ? pairs : undefined,
      lastSplitAt: split ? new Date().toISOString() : undefined,
      gameMode,
      tournamentFormat,
      matchType,
      address,
      matches,
      tournament: tournament || undefined
    };
    saveSessionSync(sessionData);

    // Also save to Supabase in background
    saveSession(sessionData).catch(console.error);

    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_SESSION_KEY, sessionCode);
    }
  }, [sessionCode, players, pairs, split, gameMode, tournamentFormat, matchType, address, matches, tournament]);

  const computedSplit = useMemo(() => {
    if (split) return split;
    return buildViewFromPlayers(players, teamCount);
  }, [split, players, teamCount]);

  const handleAddPlayer = (payload: { name: string; gender: "male" | "female"; skillLevel: number }) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: payload.name,
      gender: payload.gender,
      skillLevel: Math.min(10, Math.max(1, payload.skillLevel)),
      team: null,
      isActive: true
    };
    setPlayers((prev) => [...prev, newPlayer]);
  };

  const handleAddPair = (payload: {
    name1: string;
    gender1: "male" | "female";
    skillLevel1: number;
    name2: string;
    gender2: "male" | "female";
    skillLevel2: number;
  }) => {
    const newPair: TournamentPair = {
      id: crypto.randomUUID(),
      player1: {
        id: crypto.randomUUID(),
        name: payload.name1,
        gender: payload.gender1,
        skillLevel: Math.min(10, Math.max(1, payload.skillLevel1)),
      },
      player2: {
        id: crypto.randomUUID(),
        name: payload.name2,
        gender: payload.gender2,
        skillLevel: Math.min(10, Math.max(1, payload.skillLevel2)),
      },
    };
    setPairs((prev) => [...prev, newPair]);
  };

  const handleToggleActive = (id: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive, team: p.isActive ? null : p.team } : p))
    );
  };

  const handleRemove = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRemovePair = (id: string) => {
    setPairs((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSplit = () => {
    const result = splitTeams(players, teamCount);
    const inactive = players.filter((p) => !p.isActive).map((p) => ({ ...p, team: null }));
    const mergedTeams = result.teams.flatMap((t) => t.players);
    setPlayers([...mergedTeams, ...inactive]);
    setSplit(result);
  };

  const handleNewSession = () => {
    // Clear input session to ensure new code is generated when creating a new session
    setInputSession("");
    setShowModeSelector(true);
  };

  const handleModeSelect = async (
    mode: GameMode,
    format?: TournamentFormat,
    type?: MatchType,
    sessionAddress?: string
  ) => {
    // Clear old session data from localStorage
    const oldSession = typeof window !== "undefined" ? localStorage.getItem(LAST_SESSION_KEY) : null;
    if (oldSession) {
      clearSessionData(oldSession);
      localStorage.removeItem(LAST_SESSION_KEY);
    }

    // Always generate a unique session code when creating a new session (not joining)
    const code = await generateUniqueSessionCode();

    // Set active session in sessionStorage (survives refresh, cleared on window close)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("badminton-active-session", code);
    }

    setSessionCode(code);
    setInputSession(code);
    setPlayers([]);
    setPairs([]);
    setSplit(null);
    setMatches([]);
    setTournament(null);
    setGameMode(mode);
    setTournamentFormat(format);
    setMatchType(type);
    setAddress(sessionAddress);
    setShowModeSelector(false);
    setShowWelcome(false);
  };

  const handleJoinSession = async (codeOverride?: string) => {
    const trimmed = (codeOverride || inputSession).trim().toUpperCase();
    if (!trimmed || trimmed.length !== 6) return;

    let foundSession = false;

    // First try sync load for instant feedback
    const localSession = loadSessionSync(trimmed);
    if (localSession) {
      setSessionCode(localSession.sessionCode);
      setPlayers(localSession.players);
      setPairs(localSession.pairs || []);
      setSplit(null);
      setGameMode(localSession.gameMode || "team");
      setTournamentFormat(localSession.tournamentFormat);
      setMatchType(localSession.matchType);
      setAddress(localSession.address);
      setMatches(localSession.matches || []);
      setTournament(localSession.tournament || null);
      foundSession = true;
    }

    // Then try async load from Supabase
    const existing = await loadSession(trimmed);
    if (existing) {
      setSessionCode(existing.sessionCode);
      setPlayers(existing.players);
      setPairs(existing.pairs || []);
      setSplit(null);
      setGameMode(existing.gameMode || "team");
      setTournamentFormat(existing.tournamentFormat);
      setMatchType(existing.matchType);
      setAddress(existing.address);
      setMatches(existing.matches || []);
      setTournament(existing.tournament || null);
      foundSession = true;
    }

    if (foundSession) {
      // Set active session in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("badminton-active-session", trimmed);
      }
      setShowWelcome(false);
    } else {
      // No session found anywhere - keep welcome screen and show an error instead of creating a new session
      if (typeof window !== "undefined") {
        alert("Không tìm thấy session với mã này. Vui lòng kiểm tra lại mã session.");
      }
    }
  };

  const canSplit = players.filter((p) => p.isActive).length >= teamCount * 2;
  const palette = ["#16a34a", "#2563eb", "#7c3aed", "#f59e0b", "#0ea5e9", "#ef4444"];

  const handleMovePlayer = (id: string, target: string | null) => {
    setPlayers((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, team: target } : p));
      setSplit(buildViewFromPlayers(updated, teamCount));
      return updated;
    });
  };

  const openEditPair = (pair: TournamentPair) => {
    // For now, just show an alert - full edit functionality can be added later
    alert("Chỉnh sửa cặp: Tính năng sẽ được thêm sau");
  };

  const openEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setEditForm({
      name: player.name,
      gender: player.gender,
      skill: player.skillLevel,
      isActive: player.isActive,
      team: player.team
    });
  };

  const submitEditPlayer = () => {
    if (!editingPlayer) return;
    const normalizedSkill = Math.min(10, Math.max(1, Number(editForm.skill) || 1));
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === editingPlayer.id
          ? {
              ...p,
              name: editForm.name.trim() || p.name,
              gender: editForm.gender,
              skillLevel: normalizedSkill,
              isActive: editForm.isActive,
              team: editForm.team
            }
          : p
      );
      setSplit(buildViewFromPlayers(updated, teamCount));
      return updated;
    });
    setEditingPlayer(null);
  };

  const closeEdit = () => setEditingPlayer(null);

  const handleCreateMatch = (teamA: MatchPlayer[], teamB: MatchPlayer[], type: MatchType) => {
    const newMatch: Match = {
      id: crypto.randomUUID(),
      matchType: type,
      status: "pending",
      teamA,
      teamB,
      scoreA: null,
      scoreB: null,
      winner: null,
      playedAt: null,
      createdAt: new Date().toISOString(),
    };
    setMatches((prev) => [newMatch, ...prev]);
    setShowMatchCreator(false);
  };

  const handleDeleteMatch = (matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
  };

  const handleSaveMatchScore = (matchId: string, scoreA: number, scoreB: number) => {
    // Update match with score and winner (points will be recalculated automatically)
    const winnerSide: MatchSide | null =
      scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : null;

    setMatches((prev) => {
      const updated = prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              scoreA,
              scoreB,
              status: "completed" as const,
              winner: winnerSide,
              playedAt: new Date().toISOString(),
            }
          : m
      );

      // Optimized: only sync matches to Supabase (no players/pairs) for score updates
      if (sessionCode) {
        void saveMatchesOnly(sessionCode, updated);
      }

      return updated;
    });

    setSelectedMatch(null);
  };

  // Tournament handlers
  const handleStartTournament = (tournamentData: TournamentData) => {
    setTournament(tournamentData);
    setShowTournamentSetup(false);
  };

  const handleSaveTournamentScore = (matchId: string, scoreA: number, scoreB: number) => {
    if (!tournament) return;
    const updated = recordTournamentMatchResult(tournament, matchId, scoreA, scoreB);
    setTournament(updated);
    setSelectedTournamentMatch(null);
  };

  const handleResetTournament = () => {
    setTournament(null);
  };

  if (showWelcome) {
    return (
      <>
        <WelcomeScreen
          onJoinSession={handleJoinSession}
          onCreateNew={handleNewSession}
        />
        {showModeSelector && (
          <ModeSelector
            onSelect={handleModeSelect}
            onCancel={() => setShowModeSelector(false)}
          />
        )}
      </>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 16 }}>
      <header className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="header-content">
          <div>
            <div className="muted">Mã session</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span className="session-code" style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>{sessionCode}</span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  background: gameMode === "team" ? "#dcfce7" : gameMode === "free_play" ? "#dbeafe" : "#fef3c7",
                  color: gameMode === "team" ? "#166534" : gameMode === "free_play" ? "#1e40af" : "#92400e"
                }}
              >
                {gameMode === "team" ? "Chia đội" : gameMode === "free_play" ? "Chơi tự do" : "Giải đấu"}
                {gameMode === "tournament" && tournamentFormat && (
                  <span style={{ marginLeft: 4 }}>
                    ({tournamentFormat === "round_robin" ? "Vòng tròn" : tournamentFormat === "single_elimination" ? "Loại trực tiếp" : "Loại kép"})
                  </span>
                )}
              </span>
            </div>
            {address && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>📍</span>
                <span style={{ fontSize: 14, color: "#64748b" }}>
                  <strong>Địa điểm:</strong> {address}
                </span>
              </div>
            )}
          </div>
          <div className="header-actions">
            <input
              value={inputSession}
              onChange={(e) => setInputSession(e.target.value.toUpperCase())}
              placeholder="Nhập mã 6 ký tự"
              maxLength={6}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", textTransform: "uppercase" }}
            />
            <button
              onClick={() => handleJoinSession()}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#edf2f7" }}
            >
              Vào session
            </button>
            <button
              onClick={handleNewSession}
              style={{ padding: "10px 12px", borderRadius: 10, border: "none", background: "#16a34a", color: "white" }}
            >
              Tạo mã mới
            </button>
          </div>
        </div>
        <div className="muted">
          Dữ liệu được lưu trên trình duyệt và đồng bộ với Supabase (nếu đã cấu hình).
        </div>
      </header>

      <div className="grid grid-2">
        {gameMode === "tournament" && matchType && isDoublesType(matchType) ? (
          <PairForm matchType={matchType} onAdd={handleAddPair} />
        ) : (
          <PlayerForm onAdd={handleAddPlayer} />
        )}

        {gameMode === "team" && (
          <div className="card" style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <strong>Chia đội tự động</strong>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label className="muted">Số đội</label>
                <select
                  value={teamCount}
                  onChange={(e) => {
                    setTeamCount(Number(e.target.value));
                    setSplit(null);
                  }}
                  style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, minWidth: 80 }}
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} đội</option>
                  ))}
                </select>
              </div>
              <div className="muted">
                Thuật toán cân bằng số người, giới tính, và chênh lệch điểm ≤ 5 nếu có thể. Cần tối thiểu{" "}
                {teamCount * 2} người cho {teamCount} đội.
              </div>
            </div>
            <button
              onClick={handleSplit}
              disabled={!canSplit}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "none",
                background: canSplit ? "#2563eb" : "#cbd5e1",
                color: canSplit ? "white" : "#475569",
                fontWeight: 600
              }}
            >
              {canSplit ? "Chia đội" : "Thiếu người chơi"}
            </button>
            {computedSplit.warnings.length > 0 && (
              <div
                style={{
                  border: "1px solid #fecdd3",
                  background: "#fff1f2",
                  padding: 12,
                  borderRadius: 10,
                  color: "#b91c1c"
                }}
              >
                <strong>Cảnh báo</strong>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  {computedSplit.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {gameMode === "free_play" && (
          <div className="card" style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <strong>Chơi tự do</strong>
            <p className="muted" style={{ margin: 0 }}>
              Người chơi tự do ghép cặp cho mỗi trận. Thêm người chơi bên trái, sau đó tạo trận đấu.
            </p>
            <button
              onClick={() => setShowMatchCreator(true)}
              disabled={players.filter(p => p.isActive).length < 2}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "none",
                background: players.filter(p => p.isActive).length >= 2 ? "#3b82f6" : "#cbd5e1",
                color: players.filter(p => p.isActive).length >= 2 ? "white" : "#475569",
                fontWeight: 600
              }}
            >
              Tạo trận đấu
            </button>
          </div>
        )}

        {gameMode === "tournament" && (
          <div className="card" style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <strong>Giải đấu</strong>
            <p className="muted" style={{ margin: 0 }}>
              Thể thức: {tournamentFormat === "round_robin" ? "Vòng tròn" : tournamentFormat === "single_elimination" ? "Loại trực tiếp" : "Loại kép"}
              {matchType && ` • ${
                matchType === "MS" ? "Đơn Nam" :
                matchType === "WS" ? "Đơn Nữ" :
                matchType === "XD" ? "Đôi Nam Nữ" :
                matchType === "MD" ? "Đôi Nam" :
                matchType === "WD" ? "Đôi Nữ" : matchType
              }`}
            </p>
            {tournament ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: tournament.isComplete ? "#dcfce7" : "#dbeafe",
                    color: tournament.isComplete ? "#16a34a" : "#2563eb",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {tournament.isComplete ? "Hoàn thành" : `Vòng ${tournament.currentRound}`}
                </span>
                <button
                  onClick={handleResetTournament}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Đặt lại giải đấu
                </button>
              </div>
            ) : (
              (() => {
                const isDoublesMode = matchType && isDoublesType(matchType);
                const canCreateTournament = isDoublesMode
                  ? pairs.length >= 2
                  : players.filter(p => p.isActive).length >= 2;

                return (
                  <button
                    onClick={() => setShowTournamentSetup(true)}
                    disabled={!canCreateTournament}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: canCreateTournament ? "#f59e0b" : "#cbd5e1",
                      color: canCreateTournament ? "white" : "#475569",
                      fontWeight: 600
                    }}
                  >
                    Tạo bảng đấu
                  </button>
                );
              })()
            )}
          </div>
        )}
      </div>

      {gameMode === "tournament" && matchType && isDoublesType(matchType) ? (
        <PairList
          pairs={pairs}
          onEdit={openEditPair}
          onRemove={handleRemovePair}
        />
      ) : (
        <PlayerList
          players={players}
          matchStats={playerMatchStats}
          moveOptions={computedSplit.teams.map((t) => t.name)}
          onAssign={handleMovePlayer}
          onToggleActive={handleToggleActive}
          onEdit={openEditPlayer}
          onRemove={handleRemove}
        />
      )}

      {gameMode === "free_play" && matches.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <strong>Danh sách trận đấu ({matches.length})</strong>
          </div>
          <MatchList
            matches={matches}
            onSelectMatch={setSelectedMatch}
            onDeleteMatch={handleDeleteMatch}
          />
        </div>
      )}

      {gameMode === "tournament" && tournament && (
        <div className="grid grid-2">
          <TournamentBracket
            tournament={tournament}
            onSelectMatch={setSelectedTournamentMatch}
          />
          <TournamentStandings standings={tournament.standings} />
        </div>
      )}

      {gameMode === "team" && (
        <div className="grid grid-2">
          {computedSplit.teams.map((team, idx) => (
            <TeamPanel
              key={team.name}
              title={team.name}
              color={palette[idx % palette.length]}
              players={team.players}
              stats={team.stats}
              points={teamPoints[team.name] || 0}
              moveOptions={computedSplit.teams.map((t) => t.name)}
              onMovePlayer={handleMovePlayer}
            />
          ))}
        </div>
      )}

      {gameMode === "team" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: matches.length > 0 ? 12 : 0 }}>
            <strong>Trận đấu {matches.length > 0 && `(${matches.length})`}</strong>
            <button
              onClick={() => setShowMatchCreator(true)}
              disabled={players.filter(p => p.isActive).length < 2}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: players.filter(p => p.isActive).length >= 2 ? "#3b82f6" : "#cbd5e1",
                color: players.filter(p => p.isActive).length >= 2 ? "white" : "#475569",
                fontWeight: 600,
                fontSize: 14
              }}
            >
              + Tạo trận đấu
            </button>
          </div>
          {matches.length > 0 ? (
            <MatchList
              matches={matches}
              onSelectMatch={setSelectedMatch}
              onDeleteMatch={handleDeleteMatch}
            />
          ) : (
            <p className="muted" style={{ margin: 0, textAlign: "center", padding: 16 }}>
              Chưa có trận đấu nào. Bấm "Tạo trận đấu" để bắt đầu.
            </p>
          )}
        </div>
      )}

      {editingPlayer && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <strong>Sửa người chơi</strong>
              <button onClick={closeEdit} style={{ border: "none", background: "transparent", fontSize: 18 }}>
                ×
              </button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label>Tên</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <label>Điểm trình độ</label>
                <select
                  value={editForm.skill}
                  onChange={(e) => setEditForm((f) => ({ ...f, skill: Number(e.target.value) }))}
                  style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <label>Giới tính</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value as "male" | "female" }))}
                    style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <label>Trạng thái</label>
                  <select
                    value={editForm.isActive ? "active" : "inactive"}
                    onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.value === "active" }))}
                    style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Nghỉ</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <label>Hành động</label>
                <select
                  value={editForm.team ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditForm((f) => ({ ...f, team: v === "" ? null : v }));
                  }}
                  style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                >
                  <option value="">Đang chờ</option>
                  {computedSplit.teams.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={closeEdit}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc" }}
                >
                  Hủy
                </button>
                <button
                  onClick={submitEditPlayer}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "none", background: "#2563eb", color: "white" }}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModeSelector && (
        <ModeSelector
          onSelect={handleModeSelect}
          onCancel={() => setShowModeSelector(false)}
        />
      )}

      {showMatchCreator && (
        <MatchCreator
          players={players}
          defaultMatchType="MD"
          gameMode={gameMode}
          onCreateMatch={handleCreateMatch}
          onCancel={() => setShowMatchCreator(false)}
        />
      )}

      {selectedMatch && (
        <MatchScoreModal
          match={selectedMatch}
          onSave={handleSaveMatchScore}
          onCancel={() => setSelectedMatch(null)}
        />
      )}

      {showTournamentSetup && matchType && (
        <TournamentSetup
          players={players}
          pairs={pairs}
          matchType={matchType}
          onStart={handleStartTournament}
          onCancel={() => setShowTournamentSetup(false)}
        />
      )}

      {selectedTournamentMatch && (
        <TournamentScoreModal
          match={selectedTournamentMatch}
          onSave={handleSaveTournamentScore}
          onCancel={() => setSelectedTournamentMatch(null)}
        />
      )}
    </main>
  );
}

