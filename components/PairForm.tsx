import { useState } from "react";
import type { Gender, MatchType } from "@/types";

interface Props {
  matchType: MatchType;
  onAdd: (payload: {
    name1: string;
    gender1: Gender;
    skillLevel1: number;
    name2: string;
    gender2: Gender;
    skillLevel2: number;
  }) => void;
}

export function PairForm({ matchType, onAdd }: Props) {
  const [name1, setName1] = useState("");
  const [gender1, setGender1] = useState<Gender>(matchType === "WD" ? "female" : "male");
  const [skillLevel1, setSkillLevel1] = useState(5);

  const [name2, setName2] = useState("");
  const [gender2, setGender2] = useState<Gender>(matchType === "XD" ? "female" : matchType === "WD" ? "female" : "male");
  const [skillLevel2, setSkillLevel2] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed1 = name1.trim();
    const trimmed2 = name2.trim();
    if (!trimmed1 || !trimmed2) return;

    // Validate gender rules
    if (matchType === "MD" && (gender1 !== "male" || gender2 !== "male")) {
      alert("Đôi Nam yêu cầu cả 2 người chơi đều là nam");
      return;
    }
    if (matchType === "WD" && (gender1 !== "female" || gender2 !== "female")) {
      alert("Đôi Nữ yêu cầu cả 2 người chơi đều là nữ");
      return;
    }
    if (matchType === "XD" && gender1 === gender2) {
      alert("Đôi Nam Nữ yêu cầu 1 nam và 1 nữ");
      return;
    }

    onAdd({
      name1: trimmed1,
      gender1,
      skillLevel1,
      name2: trimmed2,
      gender2,
      skillLevel2,
    });

    // Reset form
    setName1("");
    setName2("");
    setSkillLevel1(5);
    setSkillLevel2(5);
  };

  const isGenderLocked = matchType === "MD" || matchType === "WD";

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: "grid", gap: 12 }}>
      {/* Player 1 */}
      <div style={{ display: "grid", gap: 6 }}>
        <label>Người chơi 1</label>
        <input
          value={name1}
          onChange={(e) => setName1(e.target.value)}
          placeholder="Tên người chơi 1"
          required
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", width: "100%" }}
        />
      </div>
      <div style={{ display: "grid", gap: 6, gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Giới tính</label>
          <select
            value={gender1}
            onChange={(e) => setGender1(e.target.value as Gender)}
            disabled={isGenderLocked}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", width: "100%" }}
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Điểm trình độ</label>
          <select
            value={skillLevel1}
            onChange={(e) => setSkillLevel1(Number(e.target.value))}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", width: "100%" }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Player 2 */}
      <div style={{ display: "grid", gap: 6 }}>
        <label>Người chơi 2</label>
        <input
          value={name2}
          onChange={(e) => setName2(e.target.value)}
          placeholder="Tên người chơi 2"
          required
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", width: "100%" }}
        />
      </div>
      <div style={{ display: "grid", gap: 6, gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Giới tính</label>
          <select
            value={gender2}
            onChange={(e) => setGender2(e.target.value as Gender)}
            disabled={isGenderLocked}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", width: "100%" }}
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Điểm trình độ</label>
          <select
            value={skillLevel2}
            onChange={(e) => setSkillLevel2(Number(e.target.value))}
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
        Thêm cặp
      </button>
    </form>
  );
}
