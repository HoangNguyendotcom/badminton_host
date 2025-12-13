import { useState } from "react";
import type { Player, MatchType, TournamentData } from "@/types";
import { createTournament, detectMatchType } from "@/lib/tournament";

interface Props {
  players: Player[];
  onStart: (tournament: TournamentData) => void;
  onCancel: () => void;
}

const matchTypeLabels: Record<MatchType, string> = {
  MS: "Đơn Nam",
  WS: "Đơn Nữ",
  XD: "Đôi Nam Nữ",
  MD: "Đôi Nam",
  WD: "Đôi Nữ",
};

export function TournamentSetup({ players, onStart, onCancel }: Props) {
  const activePlayers = players.filter((p) => p.isActive);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(activePlayers.map((p) => p.id))
  );

  const selectedPlayers = activePlayers.filter((p) => selectedIds.has(p.id));
  const detectedType = detectMatchType(selectedPlayers);
  const [matchType, setMatchType] = useState<MatchType>(detectedType);

  const numPlayers = selectedPlayers.length;
  const numMatches = numPlayers > 1 ? (numPlayers * (numPlayers - 1)) / 2 : 0;
  const numRounds = numPlayers > 1 ? (numPlayers % 2 === 0 ? numPlayers - 1 : numPlayers) : 0;

  const togglePlayer = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(activePlayers.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleStart = () => {
    if (numPlayers < 2) return;
    const tournament = createTournament(selectedPlayers, matchType);
    onStart(tournament);
  };

  const canStart = numPlayers >= 2;

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
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: 24,
          borderRadius: 12,
          maxWidth: 500,
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ margin: "0 0 16px 0" }}>Tạo giải đấu vòng tròn</h2>

        {/* Match Type Selection */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Loại trận
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["MS", "WS"] as MatchType[]).map((type) => (
              <button
                key={type}
                onClick={() => setMatchType(type)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: matchType === type ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                  background: matchType === type ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                }}
              >
                {matchTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Player Selection */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontWeight: 500 }}>Chọn người chơi ({selectedIds.size})</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={selectAll}
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Chọn tất cả
              </button>
              <button
                onClick={deselectAll}
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Bỏ chọn
              </button>
            </div>
          </div>
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {activePlayers.map((player) => (
              <label
                key={player.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderBottom: "1px solid #f1f5f9",
                  cursor: "pointer",
                  background: selectedIds.has(player.id) ? "#f0fdf4" : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(player.id)}
                  onChange={() => togglePlayer(player.id)}
                />
                <span style={{ color: player.gender === "male" ? "#2563eb" : "#db2777" }}>
                  {player.gender === "male" ? "♂" : "♀"}
                </span>
                <span style={{ flex: 1 }}>{player.name}</span>
                <span className="muted">({player.skillLevel})</span>
              </label>
            ))}
            {activePlayers.length === 0 && (
              <div className="muted" style={{ padding: 16, textAlign: "center" }}>
                Không có người chơi nào
              </div>
            )}
          </div>
        </div>

        {/* Tournament Info */}
        {numPlayers >= 2 && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#f0fdf4",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#16a34a" }}>{numPlayers}</div>
                <div className="muted" style={{ fontSize: 12 }}>Người chơi</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#16a34a" }}>{numMatches}</div>
                <div className="muted" style={{ fontSize: 12 }}>Trận đấu</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#16a34a" }}>{numRounds}</div>
                <div className="muted" style={{ fontSize: 12 }}>Vòng đấu</div>
              </div>
            </div>
          </div>
        )}

        {numPlayers < 2 && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#fef3c7",
              marginBottom: 16,
              color: "#92400e",
            }}
          >
            Cần ít nhất 2 người chơi để tạo giải đấu
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: canStart ? "#16a34a" : "#cbd5e1",
              color: "white",
              cursor: canStart ? "pointer" : "not-allowed",
              fontWeight: 600,
            }}
          >
            Bắt đầu giải đấu
          </button>
        </div>
      </div>
    </div>
  );
}
