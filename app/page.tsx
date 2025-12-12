'use client';

import { useEffect, useMemo, useState } from "react";
import { PlayerForm } from "@/components/PlayerForm";
import { PlayerList } from "@/components/PlayerList";
import { TeamPanel } from "@/components/TeamPanel";
import { generateSessionCode, loadSession, saveSession } from "@/lib/sessionStore";
import { splitTeams } from "@/lib/teamSplitter";
import type { Player, SplitResult } from "@/types";

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
  const [sessionCode, setSessionCode] = useState<string>(generateSessionCode());
  const [inputSession, setInputSession] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [split, setSplit] = useState<SplitResult | null>(null);
  const [teamCount, setTeamCount] = useState<number>(2);

  // Load last session if available
  useEffect(() => {
    const last = typeof window !== "undefined" ? localStorage.getItem(LAST_SESSION_KEY) : null;
    if (last) {
      const existing = loadSession(last);
      if (existing) {
        setSessionCode(existing.sessionCode);
        setInputSession(existing.sessionCode);
        setPlayers(existing.players);
        return;
      }
    }
    setInputSession(sessionCode);
  }, []);

  useEffect(() => {
    // Persist current session to localStorage; Supabase integration TBD
    saveSession({ sessionCode, players, lastSplitAt: split ? new Date().toISOString() : undefined });
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_SESSION_KEY, sessionCode);
    }
  }, [sessionCode, players, split]);

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

  const handleToggleActive = (id: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive, team: p.isActive ? null : p.team } : p))
    );
  };

  const handleRemove = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSplit = () => {
    const result = splitTeams(players, teamCount);
    const inactive = players.filter((p) => !p.isActive).map((p) => ({ ...p, team: null }));
    const mergedTeams = result.teams.flatMap((t) => t.players);
    setPlayers([...mergedTeams, ...inactive]);
    setSplit(result);
  };

  const handleNewSession = () => {
    const code = generateSessionCode();
    setSessionCode(code);
    setInputSession(code);
    setPlayers([]);
    setSplit(null);
  };

  const handleJoinSession = () => {
    const trimmed = inputSession.trim().toUpperCase();
    if (!trimmed || trimmed.length !== 6) return;
    const existing = loadSession(trimmed);
    if (existing) {
      setSessionCode(existing.sessionCode);
      setPlayers(existing.players);
      setSplit(null);
    } else {
      setSessionCode(trimmed);
      setPlayers([]);
      setSplit(null);
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

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 16 }}>
      <header className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="muted">Mã session</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>{sessionCode}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={inputSession}
              onChange={(e) => setInputSession(e.target.value.toUpperCase())}
              placeholder="Nhập mã 6 ký tự"
              maxLength={6}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", width: 140, textTransform: "uppercase" }}
            />
            <button
              onClick={handleJoinSession}
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
          Lưu ý: dữ liệu đang lưu tạm trên trình duyệt. Kết nối Supabase sẽ được bổ sung sau (TODO).
        </div>
      </header>

      <div className="grid grid-2">
        <PlayerForm onAdd={handleAddPlayer} />
        <div className="card" style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <strong>Chia đội tự động</strong>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label className="muted">Số đội</label>
              <input
                type="number"
                min={2}
                max={6}
                value={teamCount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTeamCount(Number.isFinite(v) ? Math.max(2, Math.min(6, v)) : 2);
                  setSplit(null);
                }}
                style={{ width: 90, padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
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
      </div>

      <PlayerList
        players={players}
        moveOptions={computedSplit.teams.map((t) => t.name)}
        onAssign={handleMovePlayer}
        onToggleActive={handleToggleActive}
        onRemove={handleRemove}
      />

      <div className="grid grid-2">
        {computedSplit.teams.map((team, idx) => (
          <TeamPanel
            key={team.name}
            title={team.name}
            color={palette[idx % palette.length]}
            players={team.players}
            stats={team.stats}
            moveOptions={computedSplit.teams.map((t) => t.name)}
            onMovePlayer={handleMovePlayer}
          />
        ))}
      </div>
    </main>
  );
}

