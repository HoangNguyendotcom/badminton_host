'use client';

import { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { PlayerForm } from "@/components/PlayerForm";
import { PlayerList } from "@/components/PlayerList";
import { TeamPanel } from "@/components/TeamPanel";
import { generateSessionCode, loadSession, saveSession } from "@/lib/sessionStore";
import { splitTeams } from "@/lib/teamSplitter";
import type { Player, SplitResult } from "@/types";

const LAST_SESSION_KEY = "badminton-last-session";

export default function Page() {
  const [sessionCode, setSessionCode] = useState<string>(generateSessionCode());
  const [inputSession, setInputSession] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [split, setSplit] = useState<SplitResult | null>(null);

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
    return splitTeams(players);
  }, [split, players]);

  const handleAddPlayer = (payload: { name: string; gender: "male" | "female"; skillLevel: number }) => {
    const newPlayer: Player = {
      id: uuid(),
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
    const result = splitTeams(players);
    // Merge bench back with updated team assignment
    const inactive = players.filter((p) => !p.isActive).map((p) => ({ ...p, team: null }));
    setPlayers([...result.teamA, ...result.teamB, ...inactive]);
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

  const bench = players.filter((p) => !p.isActive);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 16 }}>
      <header className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="muted">Mã session</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>{sessionCode}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
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
          <div className="muted">
            Thuật toán cân bằng số người, giới tính, và chênh lệch điểm ≤ 5 nếu có thể.
          </div>
          <button
            onClick={handleSplit}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: 600
            }}
          >
            Chia đội
          </button>
          {computedSplit.stats.warnings.length > 0 && (
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
                {computedSplit.stats.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <PlayerList players={players} onToggleActive={handleToggleActive} onRemove={handleRemove} />

      <div className="grid grid-2">
        <TeamPanel
          title="Đội A"
          color="#16a34a"
          players={computedSplit.teamA}
          stats={computedSplit.stats.teamA}
        />
        <TeamPanel
          title="Đội B"
          color="#2563eb"
          players={computedSplit.teamB}
          stats={computedSplit.stats.teamB}
        />
      </div>

      {bench.length > 0 && (
        <div className="card">
          <strong>Đang nghỉ</strong>
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0 0", display: "grid", gap: 8 }}>
            {bench.map((p) => (
              <li
                key={p.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <span>
                  {p.name} · {p.gender === "male" ? "Nam" : "Nữ"} · {p.skillLevel} điểm
                </span>
                <span className="muted">Đang nghỉ</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

