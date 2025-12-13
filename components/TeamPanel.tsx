import type { Player, TeamStats } from "@/types";

interface Props {
  title: string;
  color: string;
  players: Player[];
  stats: TeamStats;
  points?: number;
  moveOptions?: string[];
  onMovePlayer?: (id: string, target: string | null) => void;
}

export function TeamPanel({ title, color, players, stats, points = 0, moveOptions = [], onMovePlayer }: Props) {
  return (
    <div className="card" style={{ borderColor: color }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
          <strong>
            {title} | Trình độ: {stats.totalSkill} | {points} điểm
          </strong>
        </div>
        <div className="muted" style={{ paddingLeft: 20 }}>
          {stats.count} người · {stats.male} nam · {stats.female} nữ
        </div>
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
                alignItems: "center",
                gap: 8
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div className="muted">
                  {p.gender === "male" ? "Nam" : "Nữ"} · {p.skillLevel} điểm
                </div>
              </div>
              {onMovePlayer && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) return;
                      if (value === "__bench__") {
                        onMovePlayer(p.id, null);
                      } else {
                        onMovePlayer(p.id, value);
                      }
                      e.currentTarget.value = "";
                    }}
                    style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                  >
                    <option value="">Chọn hành động</option>
                    {moveOptions
                      .filter((opt) => opt !== title)
                      .map((opt) => (
                        <option key={opt} value={opt}>
                          Chuyển sang {opt}
                        </option>
                      ))}
                    <option value="__bench__">Đưa về chờ</option>
                  </select>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}