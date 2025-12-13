import { useState } from "react";
import type { Player, MatchType, TournamentData, TournamentPair, MatchPlayer, TournamentCompetitor } from "@/types";
import { createTournament, isDoublesType } from "@/lib/tournament";

interface Props {
  players: Player[];
  pairs?: TournamentPair[];
  matchType: MatchType;
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

export function TournamentSetup({ players, pairs = [], matchType, onStart, onCancel }: Props) {
  const activePlayers = players.filter((p) => p.isActive);

  // For singles: selected player IDs
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());

  // For doubles: selected pair IDs
  const [selectedPairIds, setSelectedPairIds] = useState<Set<string>>(new Set());

  const isDoubles = isDoublesType(matchType);

  // Filter players based on match type for doubles
  const getFilteredPlayers = () => {
    if (!isDoubles) return activePlayers;
    if (matchType === "MD") return activePlayers.filter((p) => p.gender === "male");
    if (matchType === "WD") return activePlayers.filter((p) => p.gender === "female");
    return activePlayers; // XD - all players
  };

  const filteredPlayers = getFilteredPlayers();

  // Singles handlers
  const togglePlayer = (id: string) => {
    const newSet = new Set(selectedPlayerIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPlayerIds(newSet);
  };

  const selectAllPlayers = () => {
    setSelectedPlayerIds(new Set(filteredPlayers.map((p) => p.id)));
  };

  const deselectAllPlayers = () => {
    setSelectedPlayerIds(new Set());
  };

  // Doubles handlers
  const togglePair = (id: string) => {
    const newSet = new Set(selectedPairIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPairIds(newSet);
  };

  const selectAllPairs = () => {
    setSelectedPairIds(new Set(pairs.map((p) => p.id)));
  };

  const deselectAllPairs = () => {
    setSelectedPairIds(new Set());
  };

  // Calculate stats
  const selectedPlayers = activePlayers.filter((p) => selectedPlayerIds.has(p.id));
  const selectedPairs = pairs.filter((p) => selectedPairIds.has(p.id));
  const numCompetitors = isDoubles ? selectedPairs.length : selectedPlayers.length;
  const numMatches = numCompetitors > 1 ? (numCompetitors * (numCompetitors - 1)) / 2 : 0;
  const numRounds = numCompetitors > 1 ? (numCompetitors % 2 === 0 ? numCompetitors - 1 : numCompetitors) : 0;

  const canStart = numCompetitors >= 2;

  const handleStart = () => {
    if (!canStart) return;

    const competitors: TournamentCompetitor[] = isDoubles
      ? selectedPairs
      : selectedPlayers.map((p): MatchPlayer => ({
          id: p.id,
          name: p.name,
          gender: p.gender,
          skillLevel: p.skillLevel,
        }));

    const tournament = createTournament(competitors, matchType);
    onStart(tournament);
  };

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
        <h2 style={{ margin: "0 0 16px 0" }}>Tạo giải đấu vòng tròn - {matchTypeLabels[matchType]}</h2>

        {/* Singles - Player Selection */}
        {!isDoubles && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontWeight: 500 }}>Chọn người chơi ({selectedPlayerIds.size})</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={selectAllPlayers}
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
                  onClick={deselectAllPlayers}
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
              {filteredPlayers.map((player) => (
                <label
                  key={player.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    background: selectedPlayerIds.has(player.id) ? "#f0fdf4" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayerIds.has(player.id)}
                    onChange={() => togglePlayer(player.id)}
                  />
                  <span style={{ color: player.gender === "male" ? "#2563eb" : "#db2777" }}>
                    {player.gender === "male" ? "♂" : "♀"}
                  </span>
                  <span style={{ flex: 1 }}>{player.name}</span>
                  <span className="muted">({player.skillLevel})</span>
                </label>
              ))}
              {filteredPlayers.length === 0 && (
                <div className="muted" style={{ padding: 16, textAlign: "center" }}>
                  Không có người chơi nào
                </div>
              )}
            </div>
          </div>
        )}

        {/* Doubles - Pair Selection */}
        {isDoubles && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontWeight: 500 }}>Chọn cặp ({selectedPairIds.size})</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={selectAllPairs}
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
                  onClick={deselectAllPairs}
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
              {pairs.map((pair) => (
                <label
                  key={pair.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    background: selectedPairIds.has(pair.id) ? "#f0fdf4" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedPairIds.has(pair.id)}
                    onChange={() => togglePair(pair.id)}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: pair.player1.gender === "male" ? "#2563eb" : "#db2777" }}>
                      {pair.player1.gender === "male" ? "♂" : "♀"}
                    </span>{" "}
                    {pair.player1.name} ({pair.player1.skillLevel}) +{" "}
                    <span style={{ color: pair.player2.gender === "male" ? "#2563eb" : "#db2777" }}>
                      {pair.player2.gender === "male" ? "♂" : "♀"}
                    </span>{" "}
                    {pair.player2.name} ({pair.player2.skillLevel})
                  </div>
                </label>
              ))}
              {pairs.length === 0 && (
                <div className="muted" style={{ padding: 16, textAlign: "center" }}>
                  Chưa có cặp nào. Vui lòng thêm cặp trước khi tạo giải đấu.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tournament Info */}
        {numCompetitors >= 2 && (
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
                <div style={{ fontSize: 24, fontWeight: 600, color: "#16a34a" }}>{numCompetitors}</div>
                <div className="muted" style={{ fontSize: 12 }}>{isDoubles ? "Cặp" : "Người chơi"}</div>
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

        {numCompetitors < 2 && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#fef3c7",
              marginBottom: 16,
              color: "#92400e",
            }}
          >
            Cần ít nhất 2 {isDoubles ? "cặp" : "người chơi"} để tạo giải đấu
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
