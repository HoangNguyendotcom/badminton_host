import type { Player, TeamStats } from "@/types";

interface Props {
  title: string;
  color: string;
  players: Player[];
  stats: TeamStats;
}

export function TeamPanel({ title, color, players, stats }: Props) {
  return (
    <div className="card" style={{ borderColor: color }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
          <strong>
            {title} · {stats.totalSkill} điểm
          </strong>
        </div>
        <span className="muted">
          {stats.count} người · {stats.male} nam · {stats.female} nữ
        </span>
      </div>
      {players.length === 0 ? (
        <div className="muted">Chưa có thành viên.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {players.map((p) => (
            <li
              key={p.id}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div className="muted">
                  {p.gender === "male" ? "Nam" : "Nữ"} · {p.skillLevel} điểm
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

