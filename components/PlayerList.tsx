import { useState } from "react";
import type { Player } from "@/types";

interface Props {
  players: Player[];
  moveOptions: string[];
  onAssign: (id: string, target: string | null) => void;
  onToggleActive: (id: string) => void;
  onEdit: (player: Player) => void;
  onRemove: (id: string) => void;
}

export function PlayerList({ players, moveOptions, onAssign, onToggleActive, onEdit, onRemove }: Props) {
  const [confirmDelete, setConfirmDelete] = useState<Player | null>(null);

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
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Giới tính</th>
              <th>Điểm</th>
              <th>Trạng thái</th>
              <th>Đội</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.gender === "male" ? "Nam" : "Nữ"}</td>
                <td>{p.skillLevel}</td>
                <td>
                  <span className="muted">{p.isActive ? "Hoạt động" : "Nghỉ"}</span>
                </td>
                <td>
                  <span className="muted">{p.team ? `${p.team}` : "Đang chờ"}</span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => onEdit(p)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background: "#e0f2fe",
                        color: "#0ea5e9"
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p)}
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
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
            zIndex: 1000
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
              width: "90%"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px 0" }}>Xác nhận xóa</h3>
            <p style={{ margin: "0 0 20px 0" }}>
              Bạn có chắc chắn muốn xóa người chơi <strong>{confirmDelete.name}</strong>?
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  cursor: "pointer"
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onRemove(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #fecdd3",
                  background: "#ef4444",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

