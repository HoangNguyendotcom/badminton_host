import type { TournamentStanding, TournamentCompetitor } from "@/types";

interface Props {
  standings: TournamentStanding[];
}

// Helper to render competitor name
function renderCompetitorName(competitor: TournamentCompetitor) {
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

export function TournamentStandings({ standings }: Props) {
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 12px 0" }}>Bảng xếp hạng</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: "8px 4px", textAlign: "center", width: 40 }}>#</th>
              <th style={{ padding: "8px 4px", textAlign: "left" }}>Tên</th>
              <th style={{ padding: "8px 4px", textAlign: "center", width: 40 }}>Đấu</th>
              <th style={{ padding: "8px 4px", textAlign: "center", width: 40 }}>Thắng</th>
              <th style={{ padding: "8px 4px", textAlign: "center", width: 40 }}>Thua</th>
              <th style={{ padding: "8px 4px", textAlign: "center", width: 50 }}>Điểm</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, idx) => {
              const isLeader = standing.rank === 1 && standing.played > 0;
              return (
                <tr
                  key={
                    "player1" in standing.competitor
                      ? standing.competitor.id
                      : standing.competitor.id
                  }
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: isLeader ? "#dcfce7" : idx % 2 === 0 ? "#fff" : "#f8fafc",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 4px",
                      textAlign: "center",
                      fontWeight: isLeader ? 700 : 500,
                      color: isLeader ? "#16a34a" : "#64748b",
                    }}
                  >
                    {standing.rank}
                  </td>
                  <td style={{ padding: "10px 4px", fontWeight: isLeader ? 600 : 400 }}>
                    {renderCompetitorName(standing.competitor)}
                  </td>
                  <td style={{ padding: "10px 4px", textAlign: "center" }}>{standing.played}</td>
                  <td style={{ padding: "10px 4px", textAlign: "center", color: "#16a34a" }}>
                    {standing.wins}
                  </td>
                  <td style={{ padding: "10px 4px", textAlign: "center", color: "#dc2626" }}>
                    {standing.losses}
                  </td>
                  <td
                    style={{
                      padding: "10px 4px",
                      textAlign: "center",
                      fontWeight: 600,
                      color: isLeader ? "#16a34a" : "#1e293b",
                    }}
                  >
                    {standing.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {standings.length === 0 && (
        <div className="muted" style={{ textAlign: "center", padding: 16 }}>
          Chưa có dữ liệu xếp hạng
        </div>
      )}
    </div>
  );
}
