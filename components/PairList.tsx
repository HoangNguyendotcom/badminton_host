import { useState } from "react";
import type { TournamentPair } from "@/types";

interface Props {
  pairs: TournamentPair[];
  onEdit: (pair: TournamentPair) => void;
  onRemove: (id: string) => void;
}

export function PairList({ pairs, onEdit, onRemove }: Props) {
  const [confirmDelete, setConfirmDelete] = useState<TournamentPair | null>(null);

  if (!pairs.length) {
    return <div className="card muted">Chưa có cặp nào.</div>;
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <strong>Danh sách cặp</strong>
        <span className="muted">{pairs.length} cặp</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Người chơi 1</th>
              <th>Người chơi 2</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair) => (
              <tr key={pair.id}>
                <td>
                  <span style={{ color: pair.player1.gender === "male" ? "#2563eb" : "#db2777", marginRight: 4 }}>
                    {pair.player1.gender === "male" ? "♂" : "♀"}
                  </span>
                  {pair.player1.name}
                  <span className="muted" style={{ marginLeft: 6 }}>({pair.player1.skillLevel})</span>
                </td>
                <td>
                  <span style={{ color: pair.player2.gender === "male" ? "#2563eb" : "#db2777", marginRight: 4 }}>
                    {pair.player2.gender === "male" ? "♂" : "♀"}
                  </span>
                  {pair.player2.name}
                  <span className="muted" style={{ marginLeft: 6 }}>({pair.player2.skillLevel})</span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => onEdit(pair)}
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
                      onClick={() => setConfirmDelete(pair)}
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
              Bạn có chắc chắn muốn xóa cặp <strong>{confirmDelete.player1.name} + {confirmDelete.player2.name}</strong>?
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
