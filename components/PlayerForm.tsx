import { useState } from "react";
import type { Gender } from "@/types";

interface Props {
  onAdd: (payload: { name: string; gender: Gender; skillLevel: number }) => void;
}

export function PlayerForm({ onAdd }: Props) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [skillLevel, setSkillLevel] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, gender, skillLevel });
    setName("");
    setSkillLevel(5);
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="name">Tên người chơi</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Lin Dan"
          required
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", width: "100%" }}
        />
      </div>
      <div style={{ display: "grid", gap: 6, gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="gender">Giới tính</label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", width: "100%" }}
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="skill">Điểm trình độ</label>
          <select
            id="skill"
            value={skillLevel}
            onChange={(e) => setSkillLevel(Number(e.target.value))}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", width: "100%" }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        style={{
          padding: "12px 14px",
          borderRadius: 10,
          border: "none",
          background: "#16a34a",
          color: "white",
          fontWeight: 600
        }}
      >
        Thêm người chơi
      </button>
    </form>
  );
}

