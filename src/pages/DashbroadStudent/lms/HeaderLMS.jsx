import React, { useState } from "react";
import {
  Menu,
  BookOpen,
  LogOut,
  ChevronDown,
  User
} from "lucide-react";

export default function HeaderLMS({
  streak,
  points,
  completedCount,
  totalCount,
  resetProgress,
  studentName,
  studentCode,
  studentEmail,
  onLogout,
  onToggleSidebar,
  sidebarOpen,
  onHome
}) {
  const [showLauncher, setShowLauncher] = useState(false);
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // First letter of the last word in name for Google avatar
  const avatarLetter = studentName.trim().split(" ").pop()?.charAt(0).toUpperCase() || "N";

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "#ffffff",
      borderBottom: "1px solid #E5E7EB",
      height: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      userSelect: "none",
    }}>

      {/* ─── Left side: Toggle + Brand ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Sidebar toggle */}
        <MenuToggle sidebarOpen={sidebarOpen} onToggleSidebar={onToggleSidebar} />

        {/* Brand logo */}
        <div
          onClick={onHome}
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginLeft: "4px" }}
          title="Trang chủ"
        >
          <div style={{
            width: "34px",
            height: "34px",
            background: "rgba(15,118,110,0.08)",
            border: "1px solid rgba(15,118,110,0.15)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <BookOpen size={17} style={{ color: "#0f766e", strokeWidth: 2.5 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{
              fontWeight: 800,
              fontSize: "14px",
              color: "#064e3b",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}>
              FLIPPED LMS
            </span>
            <span style={{
              fontSize: "9px",
              fontWeight: 700,
              color: "#0f766e",
              letterSpacing: "0.1em",
              lineHeight: 1,
              marginTop: "3px",
              textTransform: "uppercase",
            }}>
              Học viên
            </span>
          </div>
        </div>
      </div>

      {/* ─── Right side: Avatar + Dropdown ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

        {/* User Profile Pill */}
        <div style={{ position: "relative" }}>
          <AvatarPill
            avatarLetter={avatarLetter}
            studentName={studentName}
            showLauncher={showLauncher}
            onClick={() => setShowLauncher(!showLauncher)}
          />

          {/* Dropdown */}
          {showLauncher && (
            <>
              {/* Backdrop */}
              <div
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
                onClick={() => setShowLauncher(false)}
              />
              <div style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                width: "260px",
                background: "#ffffff",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                padding: "16px",
                zIndex: 50,
                animation: "fadeIn 0.15s ease-out",
              }}>
                {/* User profile */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  paddingBottom: "14px",
                  borderBottom: "1px solid #F3F4F6",
                  marginBottom: "10px",
                }}>
                  <div style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #064e3b, #0d9488)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "10px",
                    boxShadow: "0 2px 8px rgba(15,118,110,0.3)",
                  }}>
                    {avatarLetter}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827", display: "block" }}>{studentName}</span>
                  <span style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px", display: "block" }}>{studentEmail || "Chưa cập nhật email"}</span>
                  <span style={{
                    display: "inline-block",
                    marginTop: "8px",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "rgba(15,118,110,0.1)",
                    color: "#0f766e",
                    padding: "2px 10px",
                    borderRadius: "999px",
                  }}>
                    Học viên
                  </span>
                </div>

                {/* Actions */}
                <button
                  onClick={() => { setShowLauncher(false); onLogout(); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#DC2626",
                    background: "transparent",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "background 150ms ease",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <LogOut size={14} style={{ color: "#EF4444" }} />
                  Đăng xuất tài khoản
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function MenuToggle({ sidebarOpen, onToggleSidebar }) {
  const [hov, setHov] = useState(false);
  const isPinned = sidebarOpen;
  return (
    <button
      onClick={onToggleSidebar}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={isPinned ? "Bỏ ghim thanh điều hướng" : "Ghim thanh điều hướng (luôn mở rộng)"}
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        background: isPinned
          ? "rgba(15,118,110,0.1)"
          : hov ? "#F3F4F6" : "transparent",
        border: isPinned ? "1px solid rgba(15,118,110,0.2)" : "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isPinned ? "#0f766e" : (hov ? "#374151" : "#6B7280"),
        transition: "background 200ms ease, color 200ms ease, border-color 200ms ease",
        flexShrink: 0,
        position: "relative",
      }}
    >
      <Menu size={20} />
      {/* Pin indicator dot */}
      {isPinned && (
        <span style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "#0f766e",
        }} />
      )}
    </button>
  );
}

function AvatarPill({ avatarLetter, studentName, showLauncher, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "5px 12px 5px 5px",
        borderRadius: "999px",
        border: showLauncher ? "1px solid rgba(15,118,110,0.3)" : `1px solid ${hov ? "#D1D5DB" : "#E5E7EB"}`,
        background: showLauncher ? "rgba(15,118,110,0.06)" : (hov ? "#F9FAFB" : "#ffffff"),
        cursor: "pointer",
        transition: "all 200ms ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        userSelect: "none",
      }}
    >
      <div style={{
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #064e3b, #0d9488)",
        color: "#ffffff",
        fontWeight: 700,
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {avatarLetter}
      </div>
      <div style={{ lineHeight: 1, textAlign: "left" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827", display: "block" }}>
          {studentName.length > 18 ? studentName.slice(0, 18) + "…" : studentName}
        </span>
        <span style={{ fontSize: "10px", color: "#9CA3AF", display: "block", marginTop: "2px" }}>Student</span>
      </div>
      <ChevronDown
        size={14}
        style={{
          color: "#9CA3AF",
          transition: "transform 200ms ease",
          transform: showLauncher ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    </div>
  );
}
