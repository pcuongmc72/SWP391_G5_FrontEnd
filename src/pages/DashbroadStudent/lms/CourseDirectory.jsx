import React from "react";
import {
  Calendar,
  BookOpen,
  Search,
  Folder,
  MoreVertical,
  Layers,
  ClipboardList,
  ChevronDown,
  Bell,
  User
} from "lucide-react";
import { getUser } from "../../../services/authService";

// ============================================================
// Design tokens — kept inline to avoid extra CSS module import
// ============================================================
const tokens = {
  primary: "#0F766E",
  primaryHover: "#115E59",
  bg: "#F7F9FC",
  card: "#ffffff",
  border: "#E5E7EB",
  text: "#111827",
  textSecondary: "#6B7280",
};

// Gradient per course code
const getBannerColor = (code) => {
  if (!code) return "linear-gradient(135deg, #064e3b 0%, #065f46 100%)";
  const c = code.toLowerCase();
  if (c.includes("prj")) return "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)";
  if (c.includes("se") || c.includes("oop")) return "linear-gradient(135deg, #78350f 0%, #92400e 100%)";
  if (c.includes("mad") || c.includes("csd")) return "linear-gradient(135deg, #312e81 0%, #3730a3 100%)";
  return "linear-gradient(135deg, #064e3b 0%, #065f46 100%)";
};

export default function CourseDirectory({
  classes,
  onSelectCourse,
  years,
  selectedYear,
  setSelectedYear,
  selectedSemester,
  setSelectedSemester,
  searchTerm,
  setSearchTerm,
  terms
}) {
  const activeCount = classes.length;
  const currentUser = getUser();
  const studentName = currentUser?.fullName || currentUser?.email || 'Học viên';
  const matchedTerm = terms?.find(t => t.id === selectedSemester);

  return (
    <div id="course-directory-root" style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "12px" }}>

      {/* ── Welcome Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)",
        borderRadius: "18px",
        padding: "24px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(15,118,110,0.22)",
        flexWrap: "wrap",
      }}>
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "180px", height: "180px", background: "rgba(255,255,255,0.07)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-50px", right: "130px", width: "110px", height: "110px", background: "rgba(255,255,255,0.04)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", margin: "0 0 12px", lineHeight: 1.2 }}>
            Welcome back, {studentName} 👋
          </h2>
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.75)", marginBottom: "4px", margin: "0 0 4px" }}>
            Ready to continue your learning today?
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "999px", padding: "5px 14px", fontSize: "12px", fontWeight: 700, color: "#ffffff"
            }}>
              <BookOpen size={13} /> {activeCount} lớp học đang tham gia
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "999px", padding: "5px 14px", fontSize: "12px", fontWeight: 700, color: "#ffffff"
            }}>
              <Calendar size={13} /> {matchedTerm ? matchedTerm.name : (selectedSemester + ' ' + selectedYear)}
            </span>
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, fontSize: "52px", lineHeight: 1, opacity: 0.65 }}>🎓</div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div id="filter-bar" style={{
        background: "#ffffff",
        border: `1px solid ${tokens.border}`,
        borderRadius: "16px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        flexWrap: "wrap",
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Tìm kiếm mã lớp, môn học, mã môn học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              height: "48px",
              padding: "0 16px 0 42px",
              border: "1px solid #E5E7EB",
              borderRadius: "14px",
              fontSize: "14px",
              color: tokens.text,
              background: "#F9FAFB",
              outline: "none",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              transition: "border-color 200ms, box-shadow 200ms",
              boxSizing: "border-box",
            }}
            onFocus={e => { e.target.style.borderColor = tokens.primary; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(15,118,110,0.1)"; }}
            onBlur={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.background = "#F9FAFB"; e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
          />
        </div>

        {/* Filter dropdowns */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {/* Year selector */}
          <div style={{ position: "relative" }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                height: "48px",
                padding: "0 36px 0 14px",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                background: "#F9FAFB",
                outline: "none",
                appearance: "none",
                cursor: "pointer",
                minWidth: "132px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                transition: "border-color 200ms",
              }}
              onFocus={e => { e.target.style.borderColor = tokens.primary; e.target.style.boxShadow = "0 0 0 3px rgba(15,118,110,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
            >
              {years.map((year) => (
                <option key={year} value={year}>Năm học {year}</option>
              ))}
            </select>
            <Calendar size={13} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
          </div>

          {/* Semester selector */}
          <div style={{ position: "relative" }}>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              style={{
                height: "48px",
                padding: "0 36px 0 14px",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                background: "#F9FAFB",
                outline: "none",
                appearance: "none",
                cursor: "pointer",
                minWidth: "132px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                transition: "border-color 200ms",
              }}
              onFocus={e => { e.target.style.borderColor = tokens.primary; e.target.style.boxShadow = "0 0 0 3px rgba(15,118,110,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
            >
              {terms
                ?.filter(t => t.startDate && t.startDate.split('-')[0] === selectedYear)
                .map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))
              }
            </select>
            <Layers size={13} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
          </div>
        </div>
      </div>

      {/* ── Section header ── */}
      {classes.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: tokens.text, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={16} style={{ color: tokens.primary }} />
            Lớp học của tôi
          </h3>
          <span style={{
            fontSize: "12px", fontWeight: 600, color: tokens.textSecondary,
            background: "#F3F4F6", border: "1px solid #E5E7EB",
            borderRadius: "999px", padding: "2px 10px"
          }}>
            {classes.length} lớp
          </span>
        </div>
      )}

      {/* ── Class Cards Grid ── */}
      {classes.length === 0 ? (
        <div style={{
          background: "#ffffff",
          border: "1.5px dashed #D1D5DB",
          borderRadius: "18px",
          padding: "56px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}>
          <div style={{ fontSize: "48px", lineHeight: 1, opacity: 0.6 }}>🎒</div>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#374151", margin: 0 }}>
            Không tìm thấy lớp học nào
          </p>
          <p style={{ fontSize: "13px", color: "#9CA3AF", maxWidth: "320px", margin: 0, lineHeight: 1.6 }}>
            Vui lòng chọn học kỳ khác hoặc thử tìm kiếm với từ khóa khác.
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
          gap: "20px",
        }}>
          {classes.map((cls) => {
            const bannerColor = getBannerColor(cls.courseCode);
            return (
              <ClassCard
                key={cls.id}
                cls={cls}
                bannerColor={bannerColor}
                selectedSemester={selectedSemester}
                onSelectCourse={onSelectCourse}
                matchedTermCode={matchedTerm?.termCode}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ClassCard — extracted for clean hover state management
// ─────────────────────────────────────────────────────────────
function ClassCard({ cls, bannerColor, selectedSemester, onSelectCourse, matchedTermCode }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={() => onSelectCourse(cls)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: "18px",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        boxShadow: hovered
          ? "0 12px 32px rgba(0,0,0,0.12)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        position: "relative",
      }}
    >
      {/* ─ Card Banner (top colored section) ─ */}
      <div
        style={{
          background: bannerColor,
          padding: "22px 20px 18px",
          minHeight: "140px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-24px", right: "-24px", width: "100px", height: "100px", background: "rgba(255,255,255,0.08)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-30px", right: "50px", width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />
        <LayoutBookSimulated />

        {/* Top row: course code + semester badge */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", position: "relative", zIndex: 1 }}>
          <h3 style={{
            fontSize: "26px",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.05,
            margin: 0,
            textShadow: "0 1px 4px rgba(0,0,0,0.2)",
            maxWidth: "calc(100% - 72px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {cls.courseCode || cls.id}
          </h3>
          <span style={{
            fontSize: "9px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            background: "rgba(0,0,0,0.22)",
            color: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "999px",
            padding: "3px 10px",
            flexShrink: 0,
          }}>
            {cls.termCode || matchedTermCode || 'N/A'}
          </span>
        </div>

        {/* Middle row: Class Code badge */}
        {cls.id && (
          <div style={{ marginTop: "4px", position: "relative", zIndex: 1 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "6px",
              padding: "3px 10px",
              fontSize: "11px",
              fontWeight: "750",
              color: "#ffffff",
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
              letterSpacing: "0.02em"
            }}>
              Lớp: {cls.id}
            </span>
          </div>
        )}

        {/* Bottom row: lecturer name */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
            <User size={12} />
            GV: {cls.lecturerName || "Chưa phân công"}
          </p>
        </div>
      </div>

      {/* ─ Card Body ─ */}
      <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        <h4 style={{
          fontSize: "14px",
          fontWeight: 700,
          color: hovered ? "#0f766e" : "#111827",
          lineHeight: 1.4,
          margin: 0,
          transition: "color 200ms ease",
        }}>
          {cls.courseName}
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>
          <Calendar size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          <span>{cls.startDate || "N/A"} — {cls.endDate || "N/A"}</span>
        </div>
      </div>

      {/* ─ Card Footer ─ */}
      <div style={{
        borderTop: "1px solid #F3F4F6",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <FooterIconBtn title="Bài tập được giao"><ClipboardList size={16} /></FooterIconBtn>
          <FooterIconBtn title="Thư mục khóa học"><Folder size={16} /></FooterIconBtn>
          <FooterIconBtn title="Tùy chọn khác"><MoreVertical size={16} /></FooterIconBtn>
        </div>

        <EnterButton />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function FooterIconBtn({ children, title }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      title={title}
      onClick={e => e.stopPropagation()}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "6px",
        borderRadius: "8px",
        color: hov ? "#374151" : "#9CA3AF",
        background: hov ? "#F3F4F6" : "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 200ms ease, color 200ms ease",
      }}
    >
      {children}
    </button>
  );
}

function EnterButton() {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={e => e.stopPropagation()}
      style={{
        fontSize: "12px",
        fontWeight: 700,
        color: hov ? "#115E59" : "#0f766e",
        background: hov ? "rgba(15,118,110,0.15)" : "rgba(15,118,110,0.08)",
        border: hov ? "1px solid rgba(15,118,110,0.4)" : "1px solid rgba(15,118,110,0.2)",
        borderRadius: "10px",
        padding: "6px 16px",
        cursor: "pointer",
        transition: "all 200ms ease",
        whiteSpace: "nowrap",
      }}
    >
      Vào lớp
    </button>
  );
}

function LayoutBookSimulated() {
  return (
    <div style={{ position: "absolute", right: "-10px", top: "-10px", opacity: 0.07, pointerEvents: "none" }}>
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="50" height="60" rx="3" fill="white" fillOpacity="0.3" />
        <rect x="25" y="35" width="40" height="4" fill="white" fillOpacity="0.4" />
        <rect x="25" y="45" width="40" height="2" fill="white" fillOpacity="0.4" />
        <rect x="25" y="52" width="25" height="2" fill="white" fillOpacity="0.4" />
        <circle cx="80" cy="40" r="12" fill="white" fillOpacity="0.2" />
      </svg>
    </div>
  );
}

// Generate colors (kept for backward compat — unused in this render)
function getAvatarColor(initial) {
  const code = initial.charCodeAt(0);
  const colors = [
    "#2563eb",
    "#7c2d12",
    "#4f46e5",
    "#059669",
    "#db2777",
    "#d97706",
    "#0D3E26"
  ];
  return colors[code % colors.length];
}
