import type { GameMode, TournamentFormat, MatchType } from "@/types";

interface Props {
  onSelect: (mode: GameMode, tournamentFormat?: TournamentFormat, matchType?: MatchType) => void;
  onCancel: () => void;
}

const modes: { value: GameMode; label: string; description: string }[] = [
  {
    value: "team",
    label: "Chia đội",
    description: "Chia người chơi thành các đội cố định. Phù hợp cho nhóm lớn muốn thi đấu theo đội."
  },
  {
    value: "free_play",
    label: "Chơi tự do",
    description: "Không có đội cố định. Người chơi tự do ghép cặp cho mỗi trận. Phù hợp cho chơi vui."
  },
  {
    value: "tournament",
    label: "Giải đấu",
    description: "Thi đấu có tổ chức với bảng xếp hạng hoặc nhánh loại trực tiếp."
  }
];

const tournamentFormats: { value: TournamentFormat; label: string; description: string }[] = [
  {
    value: "round_robin",
    label: "Vòng tròn",
    description: "Mỗi người/cặp đấu với tất cả đối thủ một lần."
  },
  {
    value: "single_elimination",
    label: "Loại trực tiếp",
    description: "Thua một trận là bị loại."
  },
  {
    value: "double_elimination",
    label: "Loại kép",
    description: "Phải thua hai trận mới bị loại."
  }
];

const matchTypes: { value: MatchType; label: string }[] = [
  { value: "MS", label: "Đơn Nam" },
  { value: "WS", label: "Đơn Nữ" },
  { value: "XD", label: "Đôi Nam Nữ" },
  { value: "MD", label: "Đôi Nam" },
  { value: "WD", label: "Đôi Nữ" }
];

import { useState } from "react";

export function ModeSelector({ onSelect, onCancel }: Props) {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat>("round_robin");
  const [matchType, setMatchType] = useState<MatchType>("MD");

  const handleConfirm = () => {
    if (!selectedMode) return;
    if (selectedMode === "tournament") {
      onSelect(selectedMode, tournamentFormat, matchType);
    } else {
      onSelect(selectedMode);
    }
  };

  return (
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
    >
      <div
        style={{
          background: "white",
          padding: 24,
          borderRadius: 12,
          maxWidth: 500,
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        <h2 style={{ margin: "0 0 20px 0" }}>Chọn chế độ chơi</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {modes.map((mode) => (
            <div
              key={mode.value}
              onClick={() => setSelectedMode(mode.value)}
              style={{
                padding: 16,
                borderRadius: 8,
                border: selectedMode === mode.value ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                background: selectedMode === mode.value ? "#eff6ff" : "#fff",
                cursor: "pointer"
              }}
            >
              <strong>{mode.label}</strong>
              <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: 14 }}>
                {mode.description}
              </p>
            </div>
          ))}
        </div>

        {selectedMode === "tournament" && (
          <>
            <h3 style={{ margin: "24px 0 12px 0", fontSize: 16 }}>Thể thức giải đấu</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tournamentFormats.map((format) => (
                <label
                  key={format.value}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: 12,
                    borderRadius: 8,
                    border: tournamentFormat === format.value ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                    background: tournamentFormat === format.value ? "#eff6ff" : "#fff",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="radio"
                    name="tournamentFormat"
                    value={format.value}
                    checked={tournamentFormat === format.value}
                    onChange={() => setTournamentFormat(format.value)}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <strong>{format.label}</strong>
                    <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>
                      {format.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <h3 style={{ margin: "24px 0 12px 0", fontSize: 16 }}>Loại trận đấu</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {matchTypes.map((type) => (
                <label
                  key={type.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: matchType === type.value ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                    background: matchType === type.value ? "#eff6ff" : "#fff",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="radio"
                    name="matchType"
                    value={type.value}
                    checked={matchType === type.value}
                    onChange={() => setMatchType(type.value)}
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              cursor: "pointer"
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMode}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: selectedMode ? "#3b82f6" : "#cbd5e1",
              color: "white",
              cursor: selectedMode ? "pointer" : "not-allowed"
            }}
          >
            Tạo phiên
          </button>
        </div>
      </div>
    </div>
  );
}
