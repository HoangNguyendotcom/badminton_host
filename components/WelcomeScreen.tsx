import { useState } from "react";

interface Props {
  onJoinSession: (code: string) => void;
  onCreateNew: () => void;
}

export function WelcomeScreen({ onJoinSession, onCreateNew }: Props) {
  const [sessionCode, setSessionCode] = useState("");

  const handleJoin = () => {
    const trimmed = sessionCode.trim().toUpperCase();
    if (trimmed.length === 6) {
      onJoinSession(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoin();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "white",
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "#16a34a",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 32,
            }}
          >
            🏸
          </div>
          <h1 style={{ margin: 0, fontSize: 24, color: "#1f2937" }}>
            Badminton Team Splitter
          </h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
            Chia đội cầu lông nhanh chóng và công bằng
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "left" }}>
            <label
              htmlFor="session-code"
              style={{ display: "block", marginBottom: 6, color: "#374151", fontWeight: 500 }}
            >
              Nhập mã session
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="session-code"
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="VD: ABC123"
                maxLength={6}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 16,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  textAlign: "center",
                }}
              />
              <button
                onClick={handleJoin}
                disabled={sessionCode.trim().length !== 6}
                style={{
                  padding: "12px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: sessionCode.trim().length === 6 ? "#3b82f6" : "#cbd5e1",
                  color: "white",
                  fontWeight: 600,
                  cursor: sessionCode.trim().length === 6 ? "pointer" : "not-allowed",
                }}
              >
                Vào
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#94a3b8",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 13 }}>hoặc</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          <button
            onClick={onCreateNew}
            style={{
              padding: 14,
              borderRadius: 8,
              border: "none",
              background: "#16a34a",
              color: "white",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Tạo mã mới
          </button>
        </div>
      </div>
    </div>
  );
}
