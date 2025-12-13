import type { Match, MatchType } from "@/types";

interface Props {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
}

const matchTypeLabels: Record<MatchType, string> = {
  MS: "Đơn Nam",
  WS: "Đơn Nữ",
  XD: "Đôi Nam Nữ",
  MD: "Đôi Nam",
  WD: "Đôi Nữ",
};

const statusLabels: Record<Match["status"], { label: string; color: string; bg: string }> = {
  pending: { label: "Chờ", color: "#f59e0b", bg: "#fef3c7" },
  in_progress: { label: "Đang đấu", color: "#3b82f6", bg: "#dbeafe" },
  completed: { label: "Kết thúc", color: "#16a34a", bg: "#dcfce7" },
};

export function MatchList({ matches, onSelectMatch, onDeleteMatch }: Props) {
  if (matches.length === 0) {
    return (
      <div className="muted" style={{ textAlign: "center", padding: 24 }}>
        Chưa có trận đấu nào
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {matches.map((match) => {
        const status = statusLabels[match.status];
        const teamANames = match.teamA.map((p) => p.name).join(" & ");
        const teamBNames = match.teamB.map((p) => p.name).join(" & ");

        return (
          <div
            key={match.id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 12,
              background: "#fff",
            }}
          >
            {/* Header: Match Type + Status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>{matchTypeLabels[match.matchType]}</span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  color: status.color,
                  background: status.bg,
                }}
              >
                {status.label}
              </span>
            </div>

            {/* Teams and Score */}
            <div
              onClick={() => onSelectMatch(match)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 8,
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              {/* Team A */}
              <div
                style={{
                  padding: 8,
                  borderRadius: 6,
                  background: match.winner === "a" ? "#dcfce7" : "#f8fafc",
                  border: match.winner === "a" ? "2px solid #16a34a" : "1px solid transparent",
                }}
              >
                <div style={{ fontWeight: match.winner === "a" ? 600 : 400 }}>{teamANames}</div>
              </div>

              {/* Score */}
              <div style={{ textAlign: "center", minWidth: 60 }}>
                {match.status === "completed" ? (
                  <span style={{ fontSize: 18, fontWeight: 600 }}>
                    {match.scoreA} - {match.scoreB}
                  </span>
                ) : (
                  <span style={{ color: "#94a3b8" }}>vs</span>
                )}
              </div>

              {/* Team B */}
              <div
                style={{
                  padding: 8,
                  borderRadius: 6,
                  background: match.winner === "b" ? "#dcfce7" : "#f8fafc",
                  border: match.winner === "b" ? "2px solid #16a34a" : "1px solid transparent",
                  textAlign: "right",
                }}
              >
                <div style={{ fontWeight: match.winner === "b" ? 600 : 400 }}>{teamBNames}</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, gap: 8 }}>
              {match.status !== "completed" && (
                <button
                  onClick={() => onSelectMatch(match)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: "#3b82f6",
                    color: "white",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Nhập điểm
                </button>
              )}
              <button
                onClick={() => onDeleteMatch(match.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
