import type { Player } from "@/types";

interface Props {
  players: Player[];
  onToggleActive: (id: string) => void;
  onRemove: (id: string) => void;
}

export function PlayerList({ players, onToggleActive, onRemove }: Props) {
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.gender === "male" ? "Nam" : "Nữ"}</td>
              <td>{p.skillLevel}</td>
              <td>
                <button
                  onClick={() => onToggleActive(p.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: p.isActive ? "#dcfce7" : "#e2e8f0"
                  }}
                >
                  {p.isActive ? "Đang chơi" : "Đang nghỉ"}
                </button>
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

