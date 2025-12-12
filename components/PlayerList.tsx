import type { Player } from "@/types";

interface Props {
  players: Player[];
  moveOptions: string[];
  onAssign: (id: string, target: string | null) => void;
  onToggleActive: (id: string) => void;
  onRemove: (id: string) => void;
}

export function PlayerList({ players, moveOptions, onAssign, onToggleActive, onRemove }: Props) {
  if (!players.length) {
    return <div className="card muted">Chưa có người chơi.</div>;
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <strong>Danh sách người chơi</strong>
        <span className="muted">
          {players.length} người · {players.filter((p) => p.gender === "male").length} nam ·{" "}
          {players.filter((p) => p.gender === "female").length} nữ
        </span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Giới tính</th>
            <th>Điểm</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
            <th>Xóa</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.gender === "male" ? "Nam" : "Nữ"}</td>
              <td>{p.skillLevel}</td>
              <td>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="muted">{p.isActive ? "Hoạt động" : "Nghỉ"}</span>
                  <button
                    onClick={() => onToggleActive(p.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: p.isActive ? "#dcfce7" : "#e2e8f0"
                    }}
                  >
                    {p.isActive ? "Chuyển nghỉ" : "Bật hoạt động"}
                  </button>
                </div>
              </td>
              <td>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="muted">{p.team ?? "Đang chờ"}</span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) return;
                      onAssign(p.id, value === "__bench__" ? null : value);
                      e.currentTarget.value = "";
                    }}
                    style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                  >
                    <option value="">Chờ / chuyển đội</option>
                    <option value="__bench__">Đưa về chờ</option>
                    {moveOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
              <td>
                <button
                  onClick={() => onRemove(p.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #fecdd3",
                    background: "#fff1f2",
                    color: "#b91c1c"
                  }}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

