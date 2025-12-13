import { useState } from "react";
import type { TournamentMatch, MatchSide } from "@/types";

interface Props {
  match: TournamentMatch;
  onSave: (matchId: string, scoreA: number, scoreB: number) => void;
  onCancel: () => void;
}

export function TournamentScoreModal({ match, onSave, onCancel }: Props) {
  const [scoreA, setScoreA] = useState<number>(match.scoreA ?? 0);
  const [scoreB, setScoreB] = useState<number>(match.scoreB ?? 0);

  const handleSubmit = () => {
    onSave(match.id, scoreA, scoreB);
  };

  const winner: MatchSide | null = scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : null;

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
          maxWidth: 400,
          width: "90%",
        }}
      >
        <h2 style={{ margin: "0 0 8px 0" }}>Nhập điểm</h2>
        <p className="muted" style={{ margin: "0 0 20px 0" }}>
          Vòng {match.round}
        </p>

        {/* Score Input */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center", marginBottom: 24 }}>
          {/* Player A */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: winner === "a" ? "#dcfce7" : "#f8fafc",
                border: winner === "a" ? "2px solid #16a34a" : "1px solid #e2e8f0",
                marginBottom: 12,
              }}
            >
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: match.playerA.gender === "male" ? "#2563eb" : "#db2777" }}>
                  {match.playerA.gender === "male" ? "♂" : "♀"}
                </span>
              </div>
              <strong>{match.playerA.name}</strong>
            </div>
            <select
              value={scoreA}
              onChange={(e) => setScoreA(Number(e.target.value))}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "2px solid #e2e8f0",
                fontSize: 24,
                fontWeight: 600,
                textAlign: "center",
                appearance: "none",
                background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\") no-repeat right 12px center",
              }}
            >
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {/* VS */}
          <div style={{ fontSize: 18, color: "#94a3b8", fontWeight: 500 }}>vs</div>

          {/* Player B */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: winner === "b" ? "#dcfce7" : "#f8fafc",
                border: winner === "b" ? "2px solid #16a34a" : "1px solid #e2e8f0",
                marginBottom: 12,
              }}
            >
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: match.playerB.gender === "male" ? "#2563eb" : "#db2777" }}>
                  {match.playerB.gender === "male" ? "♂" : "♀"}
                </span>
              </div>
              <strong>{match.playerB.name}</strong>
            </div>
            <select
              value={scoreB}
              onChange={(e) => setScoreB(Number(e.target.value))}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "2px solid #e2e8f0",
                fontSize: 24,
                fontWeight: 600,
                textAlign: "center",
                appearance: "none",
                background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\") no-repeat right 12px center",
              }}
            >
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Winner Indicator */}
        {winner && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#dcfce7",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            <strong>{winner === "a" ? match.playerA.name : match.playerB.name}</strong> thắng!
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
            onClick={handleSubmit}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
            }}
          >
            Lưu kết quả
          </button>
        </div>
      </div>
    </div>
  );
}
