import type { TournamentMatch, TournamentData, TournamentCompetitor } from "@/types";

interface Props {
  tournament: TournamentData;
  onSelectMatch: (match: TournamentMatch) => void;
}

// Helper to render competitor (single player or pair)
function renderCompetitor(competitor: TournamentCompetitor) {
  if ("player1" in competitor) {
    // It's a pair
    return (
      <div style={{ fontSize: 13 }}>
        <div>
          <span style={{ color: competitor.player1.gender === "male" ? "#2563eb" : "#db2777", marginRight: 4 }}>
            {competitor.player1.gender === "male" ? "♂" : "♀"}
          </span>
          {competitor.player1.name}
        </div>
        <div>
          <span style={{ color: competitor.player2.gender === "male" ? "#2563eb" : "#db2777", marginRight: 4 }}>
            {competitor.player2.gender === "male" ? "♂" : "♀"}
          </span>
          {competitor.player2.name}
        </div>
      </div>
    );
  } else {
    // It's a single player
    return (
      <div>
        <span style={{ color: competitor.gender === "male" ? "#2563eb" : "#db2777", marginRight: 4 }}>
          {competitor.gender === "male" ? "♂" : "♀"}
        </span>
        {competitor.name}
      </div>
    );
  }
}

export function TournamentBracket({ tournament, onSelectMatch }: Props) {
  const { schedule, currentRound, isComplete } = tournament;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Lịch thi đấu</h3>
        {isComplete ? (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: "#dcfce7",
              color: "#16a34a",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Hoàn thành
          </span>
        ) : (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: "#dbeafe",
              color: "#2563eb",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Vòng {currentRound}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {schedule.map((round, roundIdx) => {
          const roundNum = roundIdx + 1;
          const isCurrentRound = roundNum === currentRound && !isComplete;
          const allCompleted = round.every((m) => m.status === "completed");

          return (
            <div
              key={roundNum}
              style={{
                border: isCurrentRound ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* Round Header */}
              <div
                style={{
                  padding: "8px 12px",
                  background: isCurrentRound ? "#dbeafe" : allCompleted ? "#dcfce7" : "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600 }}>Vòng {roundNum}</span>
                <span
                  style={{
                    fontSize: 12,
                    color: allCompleted ? "#16a34a" : "#64748b",
                  }}
                >
                  {round.filter((m) => m.status === "completed").length}/{round.length} trận
                </span>
              </div>

              {/* Matches */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {round.map((match, matchIdx) => (
                  <div
                    key={match.id}
                    onClick={() => onSelectMatch(match)}
                    style={{
                      padding: 12,
                      borderBottom: matchIdx < round.length - 1 ? "1px solid #f1f5f9" : "none",
                      cursor: "pointer",
                      background: match.status === "completed" ? "#fafafa" : "white",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        gap: 8,
                        alignItems: "center",
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
                        <div style={{ fontWeight: match.winner === "a" ? 600 : 400 }}>
                          {renderCompetitor(match.teamA)}
                        </div>
                      </div>

                      {/* Score / VS */}
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
                        <div style={{ fontWeight: match.winner === "b" ? 600 : 400 }}>
                          {renderCompetitor(match.teamB)}
                        </div>
                      </div>
                    </div>

                    {/* Status indicator */}
                    {match.status === "pending" && (
                      <div style={{ marginTop: 8, textAlign: "center" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "#fef3c7",
                            color: "#92400e",
                            fontSize: 11,
                          }}
                        >
                          Nhấn để nhập điểm
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {schedule.length === 0 && (
        <div className="muted" style={{ textAlign: "center", padding: 16 }}>
          Chưa có lịch thi đấu
        </div>
      )}
    </div>
  );
}
