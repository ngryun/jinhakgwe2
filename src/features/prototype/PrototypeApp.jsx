import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { applyToSchedule, cancelApplication, listAppliedSchedulesByTeacher, listApplicationsBySchedule } from "../../services/applicationService";
import { createSchedule, deleteSchedule, listSchedules, updateSchedule } from "../../services/scheduleService";
import { getUserProfile, listUsers, updateMyProfile, updateUserRole } from "../../services/userService";

/*
  Design direction: Claude-inspired — warm, minimal, restrained.
  - Warm off-white background, clean white cards
  - Single accent: warm terracotta/sienna
  - No emojis in UI chrome
  - Tight type hierarchy, generous whitespace
  - Subtle 1px borders, soft shadows
  - Purposeful micro-interactions
*/

// ─── Minimal Icon Set (thin stroke) ─────────────────────────────────────────
const I = {
  google: (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  pin: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  grid: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  file: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

// ─── Data ────────────────────────────────────────────────────────────────────
// ─── Tokens ──────────────────────────────────────────────────────────────────
const t = {
  bg: "#F9F8F6",
  surface: "#FFFFFF",
  surfaceHover: "#FAFAF8",
  border: "#EBEBEA",
  borderDark: "#D9D9D6",
  accent: "#C2714F",
  accentHover: "#A85D3F",
  accentSoft: "#FDF5F2",
  green: "#3D8C6E",
  greenSoft: "#F0F8F4",
  amber: "#B5880A",
  amberSoft: "#FEFBF0",
  text: "#1A1A1A",
  text2: "#5C5C5C",
  text3: "#999999",
  radius: 10,
  font: "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};

const css = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; min-height: 100%; }
  body {
    margin: 0;
    display: block;
    background: ${t.bg};
    -webkit-font-smoothing: antialiased;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  ::selection { background: ${t.accent}20; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 2px; }
`;

const roleLabel = (role) => (role === "admin" ? "관리자" : "상담교사");

// ─── Reusable ────────────────────────────────────────────────────────────────
function Badge({ type }) {
  const map = {
    done: { label: "마감", bg: t.greenSoft, color: t.green, border: `1px solid ${t.green}20` },
    reserve: { label: "예비접수", bg: t.accentSoft, color: t.accent, border: `1px solid ${t.accent}20` },
    progress: { label: "모집중", bg: t.amberSoft, color: t.amber, border: `1px solid ${t.amber}20` },
    waiting: { label: "대기", bg: t.bg, color: t.text3, border: `1px solid ${t.border}` },
  };
  const s = map[type];
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color, border: s.border, letterSpacing: "-0.01em" }}>{s.label}</span>;
}

function getCapacity(needed, waitlist = 0) {
  return Number(needed || 0) + Number(waitlist || 0);
}

function formatCapacity(needed, waitlist = 0) {
  const main = Number(needed || 0);
  const reserve = Number(waitlist || 0);
  return reserve > 0 ? `${main}(+${reserve})` : `${main}`;
}

function getStatus(applied, needed, waitlist = 0) {
  const main = Number(needed || 0);
  const total = getCapacity(needed, waitlist);
  if (Number(applied || 0) >= total) return "done";
  if (Number(applied || 0) >= main) return "reserve";
  if (applied > 0) return "progress";
  return "waiting";
}

function formatAppliedAt(value) {
  if (!value) return "-";
  let dateObj = null;
  if (typeof value?.toDate === "function") {
    dateObj = value.toDate();
  } else if (typeof value?.seconds === "number") {
    dateObj = new Date(value.seconds * 1000);
  } else {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) dateObj = parsed;
  }
  if (!dateObj) return "-";
  return dateObj.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Login ───────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("main"); // main | magic | sent

  const inputBase = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    background: "#fff", border: `1px solid ${t.border}`,
    color: t.text, fontSize: 14, outline: "none", fontFamily: t.font,
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: t.bg, fontFamily: t.font }}>
      <style>{css}</style>
      <div style={{
        width: 380, padding: "40px 36px", borderRadius: 16,
        background: t.surface, border: `1px solid ${t.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)",
        animation: "fadeIn 0.4s ease-out",
      }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, marginBottom: 20,
            background: t.accent, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 650, color: t.text, letterSpacing: "-0.025em", marginBottom: 6 }}>상담교사 배정 시스템</h1>
          <p style={{ fontSize: 14, color: t.text3, lineHeight: 1.5 }}>학교 상담 일정 관리 및 교사 배정</p>
        </div>

        {mode === "main" && (
          <div>
            <button onClick={() => onLogin("teacher")} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "10px", borderRadius: 8,
              background: "#fff", border: `1px solid ${t.borderDark}`, cursor: "pointer",
              fontSize: 14, fontWeight: 500, color: t.text, transition: "all 0.15s",
            }}
            onMouseOver={e => { e.currentTarget.style.background = t.bg; }}
            onMouseOut={e => { e.currentTarget.style.background = "#fff"; }}
            >{I.google} Google로 계속하기</button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: t.border }} />
              <span style={{ fontSize: 12, color: t.text3 }}>또는</span>
              <div style={{ flex: 1, height: 1, background: t.border }} />
            </div>

            <button onClick={() => setMode("magic")} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "10px", borderRadius: 8,
              background: "transparent", border: `1px solid ${t.border}`, cursor: "pointer",
              fontSize: 14, fontWeight: 500, color: t.text2, transition: "all 0.15s",
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = t.borderDark}
            onMouseOut={e => e.currentTarget.style.borderColor = t.border}
            >{I.mail} 이메일로 로그인 링크 받기</button>

            <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
              <p style={{ fontSize: 12, color: t.text3, marginBottom: 10 }}>데모 바로가기</p>
              <div style={{ display: "flex", gap: 8 }}>
                {[["admin", "관리자"], ["teacher", "교사"]].map(([role, label]) => (
                  <button key={role} onClick={() => onLogin(role)} style={{
                    flex: 1, padding: "8px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                    background: role === "admin" ? t.accent : "transparent",
                    color: role === "admin" ? "#fff" : t.text2,
                    border: role === "admin" ? "none" : `1px solid ${t.border}`,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseOver={e => { if (role !== "admin") e.currentTarget.style.background = t.bg; }}
                  onMouseOut={e => { if (role !== "admin") e.currentTarget.style.background = "transparent"; }}
                  >{label} 모드</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === "magic" && (
          <div style={{ animation: "fadeIn 0.25s ease-out" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: t.text2, marginBottom: 6 }}>이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@school.ed.kr" style={inputBase}
              onFocus={e => e.target.style.borderColor = t.accent}
              onBlur={e => e.target.style.borderColor = t.border}
            />
            <button onClick={() => setMode("sent")} style={{
              width: "100%", padding: "10px", borderRadius: 8, marginTop: 12,
              background: t.accent, border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 550, color: "#fff", transition: "background 0.15s",
            }}
            onMouseOver={e => e.currentTarget.style.background = t.accentHover}
            onMouseOut={e => e.currentTarget.style.background = t.accent}
            >로그인 링크 보내기</button>
            <button onClick={() => setMode("main")} style={{
              width: "100%", padding: "8px", marginTop: 6, background: "transparent",
              border: "none", cursor: "pointer", fontSize: 13, color: t.text3,
            }}>돌아가기</button>
          </div>
        )}

        {mode === "sent" && (
          <div style={{ textAlign: "center", animation: "fadeIn 0.25s ease-out", padding: "12px 0" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, margin: "0 auto 16px",
              background: t.greenSoft, border: `1px solid ${t.green}20`,
              display: "flex", alignItems: "center", justifyContent: "center", color: t.green,
            }}>{I.check}</div>
            <p style={{ fontSize: 15, fontWeight: 550, color: t.text, marginBottom: 6 }}>메일을 확인해주세요</p>
            <p style={{ fontSize: 13, color: t.text3, lineHeight: 1.5 }}>
              <span style={{ color: t.text2 }}>{email || "입력한 주소"}</span>로<br/>로그인 링크를 보냈습니다.
            </p>
            <button onClick={() => { setMode("main"); }} style={{
              marginTop: 20, padding: "8px 20px", borderRadius: 8,
              background: "transparent", border: `1px solid ${t.border}`,
              cursor: "pointer", fontSize: 13, color: t.text3,
            }}>다시 시도</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ role, user, tab, setTab, onLogout, isMobile, isOpen, onClose }) {
  const nav = role === "admin"
    ? [{ id: "dash", icon: I.grid, label: "대시보드" }, { id: "sched", icon: I.calendar, label: "상담일정" }, { id: "teach", icon: I.users, label: "교사 관리" }, { id: "profile", icon: I.file, label: "내 정보" }]
    : [{ id: "list", icon: I.calendar, label: "상담 일정" }, { id: "my", icon: I.file, label: "내 지원현황" }, { id: "profile", icon: I.users, label: "내 정보" }];

  const displayName = user?.name || user?.email || "-";
  const displayRole = roleLabel(role);
  const avatarText = (displayName || "?").trim().charAt(0);
  const baseSidebarStyle = {
    width: 220, height: "100vh", background: t.surface,
    borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column",
    fontFamily: t.font, flexShrink: 0,
  };

  const mobileSidebarStyle = isMobile ? {
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 50,
    width: 250,
    transform: isOpen ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 0.2s ease",
    boxShadow: "6px 0 24px rgba(0,0,0,0.12)",
  } : {
    position: "sticky",
    top: 0,
  };

  return (
    <div style={{ ...baseSidebarStyle, ...mobileSidebarStyle }}>
      <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 650, color: t.text, letterSpacing: "-0.02em" }}>상담교사 배정</span>
        </div>
      </div>

      <nav style={{ padding: "12px 8px", flex: 1 }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => { setTab(n.id); if (isMobile) onClose(); }} style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", padding: "8px 10px", borderRadius: 8, marginBottom: 2,
            background: tab === n.id ? t.bg : "transparent",
            border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: tab === n.id ? 550 : 450,
            color: tab === n.id ? t.text : t.text2,
            transition: "all 0.12s",
          }}
          onMouseOver={e => { if (tab !== n.id) e.currentTarget.style.background = t.surfaceHover; }}
          onMouseOut={e => { if (tab !== n.id) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ color: tab === n.id ? t.text : t.text3, display: "flex" }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: "12px 12px 16px", borderTop: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: t.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600, color: t.text2, border: `1px solid ${t.border}`,
          }}>
            {avatarText}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 550, color: t.text }}>{displayName}</div>
            <div style={{ fontSize: 11, color: t.text3 }}>{displayRole}</div>
          </div>
        </div>
        <button onClick={async () => { await onLogout(); if (isMobile) onClose(); }} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          width: "100%", padding: "7px", borderRadius: 7,
          background: "transparent", border: `1px solid ${t.border}`,
          cursor: "pointer", fontSize: 12, color: t.text3, transition: "all 0.15s",
        }}
        onMouseOver={e => { e.currentTarget.style.borderColor = t.borderDark; e.currentTarget.style.color = t.text2; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.text3; }}
        >{I.logout} 로그아웃</button>
      </div>
    </div>
  );
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────
function TopBar({ role, tab, isMobile, onToggleSidebar }) {
  return (
    <div style={{
      height: isMobile ? 68 : 84, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: `1px solid ${t.border}`, background: t.surface, flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid ${t.border}`, background: "transparent",
              cursor: "pointer", color: t.text2, fontSize: 16,
            }}
          >
            ☰
          </button>
        )}
        <img
          src="/logo.png"
          alt="강원특별자치도 진학지원센터 로고"
          style={{ width: 200, height: 60, objectFit: "contain", objectPosition: "left center" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button style={{
          position: "relative", width: 32, height: 32, borderRadius: 8,
          background: "transparent", border: `1px solid ${t.border}`,
          cursor: "pointer", color: t.text3, display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}
        onMouseOver={e => e.currentTarget.style.borderColor = t.borderDark}
        onMouseOut={e => e.currentTarget.style.borderColor = t.border}
        >
          {I.bell}
          <div style={{ position: "absolute", top: 6, right: 6, width: 5, height: 5, borderRadius: "50%", background: t.accent }} />
        </button>
        <span style={{ fontSize: 13, color: t.text3 }}>
          {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
        </span>
      </div>
    </div>
  );
}

// ─── Admin: Dashboard ────────────────────────────────────────────────────────
function Dashboard({ schedules }) {
  const total = schedules.length;
  const needed = schedules.reduce((a, s) => a + s.needed, 0);
  const waitlist = schedules.reduce((a, s) => a + Number(s.waitlist || 0), 0);
  const applied = schedules.reduce((a, s) => a + s.applied, 0);
  const done = schedules.filter(s => s.applied >= getCapacity(s.needed, s.waitlist)).length;

  const stats = [
    { label: "전체 일정", value: total, sub: "건" },
    { label: "모집 인원", value: needed, sub: "명" },
    { label: "예비 인원", value: waitlist, sub: "명" },
    { label: "지원 완료", value: applied, sub: "명" },
    { label: "마감 일정", value: done, sub: "건" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 650, color: t.text, letterSpacing: "-0.02em", marginBottom: 20 }}>대시보드</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            padding: "18px 20px", borderRadius: t.radius, background: t.surface,
            border: `1px solid ${t.border}`,
          }}>
            <div style={{ fontSize: 12, color: t.text3, marginBottom: 8, fontWeight: 450 }}>{s.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: t.text, letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: 13, color: t.text3 }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: t.radius, background: t.surface, border: `1px solid ${t.border}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>최근 일정</span>
        </div>
        {schedules.map((s, i) => (
          <div key={s.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px", borderBottom: i < schedules.length - 1 ? `1px solid ${t.border}` : "none",
            transition: "background 0.1s",
          }}
          onMouseOver={e => e.currentTarget.style.background = t.surfaceHover}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 550, color: t.text, marginBottom: 2 }}>{s.school}</div>
              <div style={{ fontSize: 12, color: t.text3, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>{I.pin} {s.region}</span>
                <span>{s.date}</span>
                <span>{s.time}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: t.text3 }}>{s.applied}/{formatCapacity(s.needed, s.waitlist)}</span>
              <Badge type={getStatus(s.applied, s.needed, s.waitlist)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin: Schedules ────────────────────────────────────────────────────────
function Schedules({ schedules, onAddSchedule, onUpdateSchedule, onDeleteSchedule, onViewApplicants }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ school: "", region: "", date: "", time: "", needed: 2, waitlist: 0 });
  const [applicantDialog, setApplicantDialog] = useState({
    open: false,
    schedule: null,
    rows: [],
    loading: false,
    error: "",
  });

  const handleSubmit = async () => {
    if (!form.school || !form.date || !form.time) return;
    if (editingId) {
      await onUpdateSchedule(editingId, {
        school: form.school,
        region: form.region,
        date: form.date,
        time: form.time,
        needed: Number.parseInt(form.needed, 10) || 0,
        waitlist: Number.parseInt(form.waitlist, 10) || 0,
      });
    } else {
      await onAddSchedule({
        school: form.school,
        region: form.region,
        date: form.date,
        time: form.time,
        needed: Number.parseInt(form.needed, 10) || 0,
        waitlist: Number.parseInt(form.waitlist, 10) || 0,
      });
    }
    setForm({ school: "", region: "", date: "", time: "", needed: 2, waitlist: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (schedule) => {
    setEditingId(schedule.id);
    setForm({
      school: schedule.school || "",
      region: schedule.region || "",
      date: schedule.date || "",
      time: schedule.time || "",
      needed: schedule.needed || 1,
      waitlist: Number(schedule.waitlist || 0),
    });
    setShowForm(true);
  };

  const inp = {
    width: "100%", padding: "9px 12px", borderRadius: 8, background: "#fff",
    border: `1px solid ${t.border}`, color: t.text, fontSize: 13,
    outline: "none", fontFamily: t.font, transition: "border-color 0.15s",
  };

  const handleOpenApplicants = async (schedule) => {
    setApplicantDialog({
      open: true,
      schedule,
      rows: [],
      loading: true,
      error: "",
    });

    try {
      const rows = await onViewApplicants(schedule.id);
      setApplicantDialog({
        open: true,
        schedule,
        rows,
        loading: false,
        error: "",
      });
    } catch (e) {
      setApplicantDialog({
        open: true,
        schedule,
        rows: [],
        loading: false,
        error: e instanceof Error ? e.message : "신청자 조회에 실패했습니다.",
      });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 650, color: t.text, letterSpacing: "-0.02em" }}>상담일정 관리</h2>
        <button onClick={() => {
          if (showForm) {
            setEditingId(null);
            setForm({ school: "", region: "", date: "", time: "", needed: 2, waitlist: 0 });
          }
          setShowForm(!showForm);
        }} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "8px 14px", borderRadius: 8,
          background: showForm ? "transparent" : t.accent,
          color: showForm ? t.text2 : "#fff",
          border: showForm ? `1px solid ${t.border}` : "none",
          cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
        }}>
          {showForm ? "취소" : <>{I.plus} 일정 등록</>}
        </button>
      </div>

      {showForm && (
        <div style={{
          padding: 20, borderRadius: t.radius, marginBottom: 20,
          background: t.surface, border: `1px solid ${t.accent}30`,
          animation: "fadeIn 0.2s ease-out",
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 16 }}>
            {editingId ? "상담 일정 수정" : "새 상담 일정"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["학교명", "school", "서울 한빛초등학교", "text"],
              ["지역", "region", "서울 강남구", "text"],
              ["날짜", "date", "", "date"],
              ["시간", "time", "09:00 – 12:00", "text"],
              ["모집 인원", "needed", "", "number"],
              ["예비 인원", "waitlist", "", "number"],
            ].map(([label, key, ph, type]) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 12, color: t.text3, marginBottom: 4, fontWeight: 450 }}>{label}</label>
                <input type={type} min={type === "number" ? (key === "waitlist" ? 0 : 1) : undefined} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                  placeholder={ph} style={inp}
                  onFocus={e => e.target.style.borderColor = t.accent}
                  onBlur={e => e.target.style.borderColor = t.border}
                />
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button onClick={handleSubmit} style={{
                width: "100%", padding: "9px", borderRadius: 8,
                background: t.accent, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 550, color: "#fff", transition: "background 0.15s",
              }}
              onMouseOver={e => e.currentTarget.style.background = t.accentHover}
              onMouseOut={e => e.currentTarget.style.background = t.accent}
              >{editingId ? "수정 저장" : "등록"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ borderRadius: t.radius, background: t.surface, border: `1px solid ${t.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              {["학교", "지역", "날짜", "시간", "현황", "상태", ""].map(h => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 12, fontWeight: 500, color: t.text3, textAlign: "left", background: t.bg }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules.map((s, i) => (
              <tr key={s.id}
                style={{ borderBottom: i < schedules.length - 1 ? `1px solid ${t.border}` : "none", transition: "background 0.1s" }}
                onMouseOver={e => e.currentTarget.style.background = t.surfaceHover}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 550, color: t.text }}>{s.school}</td>
                <td style={{ padding: "11px 16px", fontSize: 13, color: t.text2 }}>{s.region}</td>
                <td style={{ padding: "11px 16px", fontSize: 13, color: t.text2 }}>{s.date}</td>
                <td style={{ padding: "11px 16px", fontSize: 13, color: t.text2 }}>{s.time}</td>
                <td style={{ padding: "11px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {(() => {
                      const status = getStatus(s.applied, s.needed, s.waitlist);
                      const total = Math.max(1, getCapacity(s.needed, s.waitlist));
                      const ratio = Math.min(100, (Number(s.applied || 0) / total) * 100);
                      const barColor = status === "done" ? t.green : status === "reserve" ? t.amber : t.accent;
                      return (
                        <>
                          <div style={{ width: 60, height: 4, borderRadius: 2, background: t.bg, overflow: "hidden" }}>
                            <div style={{
                              width: `${ratio}%`, height: "100%", borderRadius: 2,
                              background: barColor, transition: "width 0.3s",
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: t.text3 }}>{s.applied}/{formatCapacity(s.needed, s.waitlist)}</span>
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td style={{ padding: "11px 16px" }}><Badge type={getStatus(s.applied, s.needed, s.waitlist)} /></td>
                <td style={{ padding: "11px 16px", textAlign: "right" }}>
                  <button onClick={() => handleOpenApplicants(s)} style={{
                    padding: "4px 6px", borderRadius: 6, background: "transparent",
                    border: "none", cursor: "pointer", color: t.text3, transition: "color 0.15s",
                    marginRight: 8,
                  }}
                  onMouseOver={e => e.currentTarget.style.color = t.text}
                  onMouseOut={e => e.currentTarget.style.color = t.text3}
                  >신청자</button>
                  <button onClick={() => handleEdit(s)} style={{
                    padding: "4px 6px", borderRadius: 6, background: "transparent",
                    border: "none", cursor: "pointer", color: t.text3, transition: "color 0.15s",
                    marginRight: 8,
                  }}
                  onMouseOver={e => e.currentTarget.style.color = t.text}
                  onMouseOut={e => e.currentTarget.style.color = t.text3}
                  >수정</button>
                  <button onClick={() => onDeleteSchedule(s.id)} style={{
                    padding: "4px 6px", borderRadius: 6, background: "transparent",
                    border: "none", cursor: "pointer", color: t.text3, transition: "color 0.15s",
                  }}
                  onMouseOver={e => e.currentTarget.style.color = "#C53030"}
                  onMouseOut={e => e.currentTarget.style.color = t.text3}
                  >{I.trash}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {applicantDialog.open && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
        onClick={() => setApplicantDialog({ open: false, schedule: null, rows: [], loading: false, error: "" })}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 760,
              borderRadius: 12,
              background: t.surface,
              border: `1px solid ${t.border}`,
              boxShadow: "0 18px 50px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: `1px solid ${t.border}`,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 650, color: t.text }}>신청자 목록</div>
                <div style={{ fontSize: 12, color: t.text3, marginTop: 3 }}>
                  {applicantDialog.schedule?.school || "-"} · {applicantDialog.schedule?.date || "-"} {applicantDialog.schedule?.time || ""}
                </div>
              </div>
              <button
                onClick={() => setApplicantDialog({ open: false, schedule: null, rows: [], loading: false, error: "" })}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: `1px solid ${t.border}`,
                  background: "transparent",
                  color: t.text2,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                닫기
              </button>
            </div>

            <div style={{ padding: 16 }}>
              {applicantDialog.loading && (
                <div style={{ fontSize: 13, color: t.text3 }}>신청자 정보를 불러오는 중...</div>
              )}
              {!applicantDialog.loading && applicantDialog.error && (
                <div style={{ fontSize: 13, color: "#8b3124" }}>{applicantDialog.error}</div>
              )}
              {!applicantDialog.loading && !applicantDialog.error && applicantDialog.rows.length === 0 && (
                <div style={{ fontSize: 13, color: t.text3 }}>현재 신청자가 없습니다.</div>
              )}
              {!applicantDialog.loading && !applicantDialog.error && applicantDialog.rows.length > 0 && (
                <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${t.border}` }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }}>
                        {["학교명", "이름", "전화번호", "이메일", "지원시각"].map((h) => (
                          <th key={h} style={{ padding: "10px 12px", fontSize: 12, color: t.text3, textAlign: "left", fontWeight: 550 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {applicantDialog.rows.map((row, idx) => (
                        <tr key={row.id} style={{ borderBottom: idx < applicantDialog.rows.length - 1 ? `1px solid ${t.border}` : "none" }}>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: t.text }}>{row.school || "-"}</td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: t.text }}>{row.name || "-"}</td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: t.text2 }}>{row.phone || "-"}</td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: t.text2 }}>{row.email || row.teacherEmail || "-"}</td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: t.text2 }}>{formatAppliedAt(row.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Teachers ─────────────────────────────────────────────────────────
function Teachers({ users, currentUid, onChangeRole }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 650, color: t.text, letterSpacing: "-0.02em", marginBottom: 20 }}>교사 관리</h2>
      <div style={{ borderRadius: t.radius, background: t.surface, border: `1px solid ${t.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              {["이름", "이메일", "권한", ""].map(h => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 12, fontWeight: 500, color: t.text3, textAlign: "left", background: t.bg }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.uid}
                style={{ borderBottom: i < users.length - 1 ? `1px solid ${t.border}` : "none", transition: "background 0.1s" }}
                onMouseOver={e => e.currentTarget.style.background = t.surfaceHover}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "11px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, background: t.bg, border: `1px solid ${t.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 600, color: t.text2,
                    }}>{(u.name || u.email || "?")[0]}</div>
                    <span style={{ fontSize: 13, fontWeight: 550, color: t.text }}>{u.name || "-"}</span>
                  </div>
                </td>
                <td style={{ padding: "11px 16px", fontSize: 13, color: t.text2 }}>{u.email}</td>
                <td style={{ padding: "11px 16px", fontSize: 13, color: t.text2 }}>
                  <select
                    value={u.role}
                    disabled={u.uid === currentUid}
                    onChange={(e) => onChangeRole(u, e.target.value)}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: `1px solid ${t.border}`,
                      background: "#fff",
                      color: t.text2,
                      fontSize: 12,
                    }}
                  >
                    <option value="teacher">상담교사</option>
                    <option value="admin">관리자</option>
                  </select>
                </td>
                <td style={{ padding: "11px 16px" }}>
                  {u.uid === currentUid ? <span style={{ fontSize: 12, color: t.text3 }}>본인 계정</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Teacher: Schedule List ──────────────────────────────────────────────────
function ScheduleList({ schedules, myApps, onApply, onCancel }) {
  const [viewMode, setViewMode] = useState("list");
  const [isCompact, setIsCompact] = useState(() => window.innerWidth < 900);
  const [processingIds, setProcessingIds] = useState([]);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleApply = async (s) => {
    if (myApps.find(a => a.id === s.id)) return;
    setProcessingIds((prev) => [...prev, s.id]);
    try {
      await onApply(s.id);
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== s.id));
    }
  };

  const handleCancel = async (s) => {
    setProcessingIds((prev) => [...prev, s.id]);
    try {
      await onCancel(s.id);
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== s.id));
    }
  };

  const recruitable = schedules.filter((s) => Number(s.applied || 0) < Number(s.needed || 0));
  const reserveOpen = schedules.filter((s) => {
    const applied = Number(s.applied || 0);
    const needed = Number(s.needed || 0);
    const total = getCapacity(s.needed, s.waitlist);
    return applied >= needed && applied < total;
  });
  const full = schedules.filter((s) => Number(s.applied || 0) >= getCapacity(s.needed, s.waitlist));
  const allSchedules = [...recruitable, ...reserveOpen, ...full];

  const parseDate = (value) => {
    if (!value) return null;
    const [y, m, d] = String(value).split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const toKey = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const dayMap = allSchedules.reduce((acc, item) => {
    const dt = parseDate(item.date);
    if (!dt) return acc;
    const key = toKey(dt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const monthLabel = `${monthCursor.getFullYear()}년 ${monthCursor.getMonth() + 1}월`;
  const startWeekday = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1).getDay();
  const totalDays = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
  const calendarCells = [];

  for (let i = 0; i < startWeekday; i += 1) {
    calendarCells.push({ type: "blank", key: `b-${i}` });
  }
  for (let day = 1; day <= totalDays; day += 1) {
    const dateObj = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day);
    const key = toKey(dateObj);
    calendarCells.push({ type: "day", key, day, items: dayMap[key] || [] });
  }

  const selectedItems = selectedDay ? (dayMap[selectedDay] || []) : [];

  const Card = ({ s }) => {
    const applied = myApps.find(a => a.id === s.id);
    const isProcessing = processingIds.includes(s.id);
    const status = getStatus(s.applied, s.needed, s.waitlist);
    const totalCapacity = Math.max(1, getCapacity(s.needed, s.waitlist));
    const mainCapacity = Number(s.needed || 0);
    const appliedCount = Number(s.applied || 0);
    const isClosedForNew = status === "done" && !applied;
    const remainMain = Math.max(0, mainCapacity - appliedCount);
    const remainReserve = Math.max(0, totalCapacity - appliedCount);
    const progressColor = status === "done" ? t.green : status === "reserve" ? t.amber : t.accent;
    const actionLabel = isProcessing
      ? "처리중..."
      : applied
        ? "지원 취소"
        : status === "reserve"
          ? "예비지원"
          : status === "done"
            ? "모집 마감"
            : "지원하기";
    return (
      <div style={{
        padding: "18px 20px", borderRadius: t.radius, background: t.surface,
        border: `1px solid ${applied ? t.green + "30" : t.border}`,
        opacity: isClosedForNew ? 0.72 : 1, transition: "all 0.15s",
      }}
      onMouseOver={e => { if (!isClosedForNew) { e.currentTarget.style.borderColor = t.borderDark; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}}
      onMouseOut={e => { e.currentTarget.style.borderColor = applied ? t.green + "30" : t.border; e.currentTarget.style.boxShadow = "none"; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 3 }}>{s.school}</div>
            <div style={{ fontSize: 12, color: t.text3, display: "flex", alignItems: "center", gap: 3 }}>{I.pin} {s.region}</div>
          </div>
          <Badge type={status} />
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 13, color: t.text2 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{I.calendar} {s.date}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{I.clock} {s.time}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 60, height: 4, borderRadius: 2, background: t.bg, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (appliedCount / totalCapacity) * 100)}%`, height: "100%", borderRadius: 2, background: progressColor, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 12, color: t.text3 }}>
              {status === "done" ? "정원 마감" : status === "reserve" ? `예비 ${remainReserve}명 남음` : `${remainMain}명 남음`}
            </span>
            <span style={{ fontSize: 12, color: t.text3 }}>{appliedCount}/{formatCapacity(s.needed, s.waitlist)}</span>
          </div>
          <button onClick={() => (applied ? handleCancel(s) : handleApply(s))} disabled={isProcessing || isClosedForNew} style={{
            padding: "7px 16px", borderRadius: 7, fontSize: 13, fontWeight: 500,
            background: applied ? "#fff6f4" : isClosedForNew ? t.bg : t.accent,
            color: applied ? "#9b3a2a" : isClosedForNew ? t.text3 : "#fff",
            border: applied ? "1px solid #f2c9c0" : isClosedForNew ? `1px solid ${t.border}` : "none",
            cursor: (isProcessing || isClosedForNew) ? "default" : "pointer", transition: "all 0.15s",
            opacity: isProcessing ? 0.7 : 1,
          }}
          onMouseOver={e => { if (!applied && !isProcessing && !isClosedForNew) e.currentTarget.style.background = t.accentHover; }}
          onMouseOut={e => { if (!applied && !isProcessing && !isClosedForNew) e.currentTarget.style.background = t.accent; }}
          >{actionLabel}</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 650, color: t.text, letterSpacing: "-0.02em" }}>상담 일정</h2>
        <div style={{ display: "inline-flex", padding: 3, borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface }}>
          {[
            { id: "list", label: "리스트" },
            { id: "calendar", label: "캘린더" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              style={{
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 10px",
                borderRadius: 6,
                color: viewMode === m.id ? "#fff" : t.text2,
                background: viewMode === m.id ? t.accent : "transparent",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "list" && (
        <>
          {recruitable.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: t.text3, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                모집중 · {recruitable.length}건
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "repeat(2, 1fr)", gap: 12, marginBottom: 28 }}>
                {recruitable.map(s => <Card key={s.id} s={s} />)}
              </div>
            </>
          )}

          {reserveOpen.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: t.text3, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                예비 접수 · {reserveOpen.length}건
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "repeat(2, 1fr)", gap: 12, marginBottom: 28 }}>
                {reserveOpen.map(s => <Card key={s.id} s={s} />)}
              </div>
            </>
          )}

          {full.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: t.text3, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                마감 · {full.length}건
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
                {full.map(s => <Card key={s.id} s={s} />)}
              </div>
            </>
          )}
        </>
      )}

      {viewMode === "calendar" && (
        <div style={{ borderRadius: t.radius, border: `1px solid ${t.border}`, background: t.surface, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `1px solid ${t.border}` }}>
            <button
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: t.text2, fontSize: 14 }}
            >
              {"<"}
            </button>
            <div style={{ fontSize: 14, fontWeight: 650, color: t.text }}>{monthLabel}</div>
            <button
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: t.text2, fontSize: 14 }}
            >
              {">"}
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: isCompact ? 680 : "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderBottom: `1px solid ${t.border}` }}>
                {["일", "월", "화", "수", "목", "금", "토"].map((dayName) => (
                  <div key={dayName} style={{ padding: "8px 6px", fontSize: 12, color: t.text3, textAlign: "center", background: t.bg }}>
                    {dayName}
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
                {calendarCells.map((cell) => {
                  if (cell.type === "blank") {
                    return <div key={cell.key} style={{ minHeight: isCompact ? 72 : 88, borderRight: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, background: "#fcfbfa" }} />;
                  }

                  const isSelected = selectedDay === cell.key;
                  return (
                    <button
                      key={cell.key}
                      onClick={() => setSelectedDay(cell.key)}
                      style={{
                        minHeight: isCompact ? 72 : 88,
                        border: "none",
                        borderRight: `1px solid ${t.border}`,
                        borderBottom: `1px solid ${t.border}`,
                        background: isSelected ? "#fff5f1" : "#fff",
                        textAlign: "left",
                        padding: isCompact ? "5px" : "6px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: isCompact ? 11 : 12, fontWeight: 600, color: t.text2, marginBottom: 4 }}>{cell.day}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {cell.items.slice(0, isCompact ? 1 : 2).map((s) => (
                          (() => {
                            const status = getStatus(s.applied, s.needed, s.waitlist);
                            const styleByStatus = status === "done"
                              ? { color: t.green, background: t.greenSoft, border: `1px solid ${t.green}30` }
                              : status === "reserve"
                                ? { color: t.amber, background: t.amberSoft, border: `1px solid ${t.amber}30` }
                                : { color: t.accent, background: t.accentSoft, border: `1px solid ${t.accent}30` };
                            return (
                              <span
                                key={s.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  fontSize: 10,
                                  borderRadius: 999,
                                  padding: "2px 6px",
                                  maxWidth: "100%",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  ...styleByStatus,
                                }}
                              >
                                {s.school} · {s.applied}/{formatCapacity(s.needed, s.waitlist)}
                              </span>
                            );
                          })()
                        ))}
                        {cell.items.length > (isCompact ? 1 : 2) && (
                          <span style={{ fontSize: 10, color: t.text3 }}>+{cell.items.length - (isCompact ? 1 : 2)}건</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ padding: "14px", borderTop: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 12, color: t.text3, marginBottom: 10 }}>
              {selectedDay ? `${selectedDay} 일정 ${selectedItems.length}건` : "날짜를 선택하면 일정 상세가 표시됩니다."}
            </div>
            {selectedDay && selectedItems.length === 0 && (
              <div style={{ fontSize: 13, color: t.text3 }}>선택한 날짜에 등록된 일정이 없습니다.</div>
            )}
            {selectedItems.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
                {selectedItems.map((s) => (
                  <Card key={s.id} s={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teacher: My Applications ────────────────────────────────────────────────
function MyApps({ myApps, onCancel }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 650, color: t.text, letterSpacing: "-0.02em", marginBottom: 20 }}>내 지원현황</h2>

      {myApps.length === 0 ? (
        <div style={{
          padding: "48px 0", borderRadius: t.radius, textAlign: "center",
          background: t.surface, border: `1px solid ${t.border}`,
        }}>
          <div style={{ color: t.text3, marginBottom: 8, display: "flex", justifyContent: "center" }}>{I.file}</div>
          <p style={{ fontSize: 14, fontWeight: 500, color: t.text2, marginBottom: 4 }}>아직 지원한 일정이 없습니다</p>
          <p style={{ fontSize: 13, color: t.text3 }}>상담 일정 탭에서 지원할 수 있습니다.</p>
        </div>
      ) : (
        <div style={{ borderRadius: t.radius, background: t.surface, border: `1px solid ${t.border}`, overflow: "hidden" }}>
          {myApps.map((s, i) => (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: i < myApps.length - 1 ? `1px solid ${t.border}` : "none",
              transition: "background 0.1s",
            }}
            onMouseOver={e => e.currentTarget.style.background = t.surfaceHover}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 550, color: t.text, marginBottom: 2 }}>{s.school}</div>
                <div style={{ fontSize: 12, color: t.text3, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>{I.pin} {s.region}</span>
                  <span>{s.date}</span>
                  <span>{s.time}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                  background: t.greenSoft, color: t.green, border: `1px solid ${t.green}20`,
                }}>지원완료</span>
                <button
                  onClick={() => onCancel(s.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#9b3a2a",
                    background: "#fff6f4",
                    border: "1px solid #f2c9c0",
                    cursor: "pointer",
                  }}
                >
                  지원 취소
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────────────────────
function ProfilePage({ user, onSave }) {
  const [form, setForm] = useState({
    school: user?.school || "",
    name: user?.name || "",
    phone: user?.phone || "",
    subject: user?.subject || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      school: user?.school || "",
      name: user?.name || "",
      phone: user?.phone || "",
      subject: user?.subject || "",
    });
  }, [user?.name, user?.school, user?.phone, user?.subject]);

  const inp = {
    width: "100%", padding: "9px 12px", borderRadius: 8, background: "#fff",
    border: `1px solid ${t.border}`, color: t.text, fontSize: 13,
    outline: "none", fontFamily: t.font,
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 650, color: t.text, letterSpacing: "-0.02em", marginBottom: 20 }}>내 정보</h2>
      <div style={{ padding: 20, borderRadius: t.radius, background: t.surface, border: `1px solid ${t.border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: t.text3, marginBottom: 4 }}>학교명</label>
            <input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="예: 설악고등학교" style={inp} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: t.text3, marginBottom: 4 }}>성함</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="성함" style={inp} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: t.text3, marginBottom: 4 }}>과목</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="예: 수학" style={inp} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: t.text3, marginBottom: 4 }}>전화번호</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="예: 010-1234-5678" style={inp} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: t.text3, marginBottom: 4 }}>역할</label>
            <input value={roleLabel(user?.role || "teacher")} readOnly style={{ ...inp, background: t.bg, color: t.text3 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: t.text3, marginBottom: 4 }}>이메일</label>
            <input value={user?.email || ""} readOnly style={{ ...inp, background: t.bg, color: t.text3 }} />
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: t.text3 }}>
          역할(role)은 관리자만 변경할 수 있습니다.
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(form);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            style={{
              padding: "8px 14px", borderRadius: 8, border: "none",
              background: t.accent, color: "#fff", cursor: saving ? "default" : "pointer",
              fontSize: 13, fontWeight: 600,
            }}
          >
            {saving ? "저장 중..." : "정보 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { user: authUser, isAuthenticated, isLoading, signInWithGoogle, signOut } = useAuth();
  const [tab, setTab] = useState("dash");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");

  const role = profile?.role || authUser?.role || "teacher";

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileNavOpen(false);
    }
  }, [isMobile]);

  const loadData = async () => {
    if (!authUser?.uid) {
      setSchedules([]);
      setMyApps([]);
      setUsers([]);
      setProfile(null);
      return;
    }

    const [scheduleData, myApplied, userRows, myProfile] = await Promise.all([
      listSchedules(),
      listAppliedSchedulesByTeacher(authUser.uid),
      role === "admin" ? listUsers() : Promise.resolve([]),
      getUserProfile(authUser.uid),
    ]);

    setSchedules(scheduleData);
    setMyApps(myApplied.map((item) => item.schedule).filter(Boolean));
    setUsers(userRows);
    setProfile(myProfile);
  };

  useEffect(() => {
    if (!isAuthenticated || !authUser?.uid) {
      setDataLoading(false);
      return;
    }

    let mounted = true;

    async function hydrate() {
      setDataLoading(true);
      try {
        await loadData();
        if (!mounted) return;
        setTab(role === "admin" ? "dash" : "list");
        setError("");
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.");
      } finally {
        if (mounted) setDataLoading(false);
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, [authUser?.uid, isAuthenticated, role]);

  const handleAddSchedule = async (payload) => {
    try {
      await createSchedule(payload);
      await loadData();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "일정 생성에 실패했습니다.");
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await deleteSchedule(scheduleId);
      await loadData();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "일정 삭제에 실패했습니다.");
    }
  };

  const handleUpdateSchedule = async (scheduleId, payload) => {
    try {
      await updateSchedule(scheduleId, payload);
      await loadData();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "일정 수정에 실패했습니다.");
    }
  };

  const handleApplySchedule = async (scheduleId) => {
    if (!authUser?.uid) return;
    const target = schedules.find((item) => item.id === scheduleId);
    if (!target) return;
    if (myApps.find((item) => item.id === scheduleId)) return;

    const previousSchedules = schedules;
    const previousMyApps = myApps;
    setMyApps((prev) => [...prev, target]);
    setSchedules((prev) =>
      prev.map((item) =>
        item.id === scheduleId
          ? { ...item, applied: Number(item.applied || 0) + 1 }
          : item,
      ),
    );

    try {
      await applyToSchedule({
        scheduleId,
        teacherUid: authUser.uid,
        teacherEmail: authUser.email,
        teacherName: authUser.name,
      });
      await loadData();
      setError("");
    } catch (e) {
      setSchedules(previousSchedules);
      setMyApps(previousMyApps);
      setError(e instanceof Error ? e.message : "일정 지원에 실패했습니다.");
    }
  };

  const handleCancelApplication = async (scheduleId) => {
    if (!authUser?.uid) return;
    const previousSchedules = schedules;
    const previousMyApps = myApps;
    setMyApps((prev) => prev.filter((item) => item.id !== scheduleId));
    setSchedules((prev) =>
      prev.map((item) =>
        item.id === scheduleId
          ? { ...item, applied: Math.max(0, Number(item.applied || 0) - 1) }
          : item,
      ),
    );

    try {
      await cancelApplication({
        scheduleId,
        teacherUid: authUser.uid,
      });
      await loadData();
      setError("");
    } catch (e) {
      setSchedules(previousSchedules);
      setMyApps(previousMyApps);
      setError(e instanceof Error ? e.message : "지원 취소에 실패했습니다.");
    }
  };

  const handleChangeUserRole = async (userRow, nextRole) => {
    const currentRole = userRow.role || "teacher";
    if (currentRole === nextRole) return;

    const ok = window.confirm(
      `권한을 변경하시겠습니까?\n\n대상: ${userRow.email}\n현재: ${currentRole}\n변경: ${nextRole}`
    );

    if (!ok) return;

    try {
      await updateUserRole(userRow.uid, nextRole);
      await loadData();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "권한 변경에 실패했습니다.");
    }
  };

  const handleSaveProfile = async (payload) => {
    if (!authUser?.uid) return;
    try {
      await updateMyProfile(authUser.uid, payload);
      await loadData();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "프로필 저장에 실패했습니다.");
    }
  };

  const handleViewApplicants = async (scheduleId) => {
    return listApplicationsBySchedule(scheduleId);
  };

  if (isLoading || dataLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: t.bg, color: t.text2, fontFamily: t.font }}>
        데이터를 불러오는 중...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 15% 20%, #fff3ec 0%, #f8f4ee 35%, #f4f1eb 100%)",
          fontFamily: t.font,
          padding: "24px 16px 20px",
        }}
      >
        <div />

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              width: "100%",
              maxWidth: 760,
              borderRadius: 20,
              border: `1px solid ${t.border}`,
              background: "#ffffffcc",
              backdropFilter: "blur(6px)",
              boxShadow: "0 12px 34px rgba(111, 74, 38, 0.08)",
              padding: "32px 28px",
              textAlign: "center",
            }}
          >
            <img
              src="/logo.png"
              alt="강원특별자치도 진학지원센터 로고"
              style={{
                width: 220,
                maxWidth: "82%",
                height: 64,
                objectFit: "contain",
                marginBottom: 12,
              }}
            />
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                lineHeight: 1.2,
                fontWeight: 700,
                color: t.text,
                letterSpacing: "-0.02em",
              }}
            >
              강원특별자치도 진학지원센터
              <br />
              상담교사 배정 시스템
            </h1>
            <p style={{ margin: "14px 0 24px", color: t.text2, fontSize: 14, lineHeight: 1.5 }}>
              상담 일정 확인, 지원, 배정 관리를 위해
              <br />
              Google 계정으로 로그인해 주세요.
            </p>
            <button
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Google 로그인에 실패했습니다.");
                }
              }}
              style={{
                width: "100%",
                maxWidth: 360,
                border: "none",
                borderRadius: 10,
                background: t.accent,
                color: "#fff",
                fontSize: 14,
                fontWeight: 650,
                padding: "12px 14px",
                cursor: "pointer",
                boxShadow: "0 8px 16px rgba(194, 113, 79, 0.28)",
              }}
            >
              Google 계정으로 로그인
            </button>
            {!!error && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#8b3124" }}>
                {error}
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", color: t.text3, fontSize: 12, lineHeight: 1.5 }}>
          로그인 후 좌측 메뉴에서 상담 일정 지원, 내 정보 수정, 지원 현황 확인이 가능합니다.
          <br />
          문의: 강원특별자치도 진학지원센터
        </div>
      </div>
    );
  }

  const currentUser = { ...(authUser || {}), ...(profile || {}) };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.bg, fontFamily: t.font, color: t.text }}>
      <style>{css}</style>
      {isMobile && mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.22)",
            zIndex: 40,
          }}
        />
      )}
      <Sidebar
        role={role}
        user={currentUser}
        tab={tab}
        setTab={setTab}
        isMobile={isMobile}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onLogout={async () => { await signOut(); setMyApps([]); }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar role={role} tab={tab} isMobile={isMobile} onToggleSidebar={() => setMobileNavOpen((prev) => !prev)} />
        <div style={{ flex: 1, padding: isMobile ? "16px 12px" : "24px 28px", overflow: "auto", animation: "fadeIn 0.3s ease-out" }}>
          <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
            {!!error && (
              <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 8, background: "#fff4f2", border: "1px solid #f1c3bc", color: "#8b3124", fontSize: 13 }}>
                {error}
              </div>
            )}
            {role === "admin" && tab === "dash" && <Dashboard schedules={schedules} />}
            {role === "admin" && tab === "sched" && (
              <Schedules
                schedules={schedules}
                onAddSchedule={handleAddSchedule}
                onUpdateSchedule={handleUpdateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onViewApplicants={handleViewApplicants}
              />
            )}
            {role === "admin" && tab === "teach" && (
              <Teachers users={users} currentUid={authUser.uid} onChangeRole={handleChangeUserRole} />
            )}
            {role === "teacher" && tab === "list" && (
              <ScheduleList
                schedules={schedules}
                myApps={myApps}
                onApply={handleApplySchedule}
                onCancel={handleCancelApplication}
              />
            )}
            {role === "teacher" && tab === "my" && <MyApps myApps={myApps} onCancel={handleCancelApplication} />}
            {tab === "profile" && <ProfilePage user={currentUser} onSave={handleSaveProfile} />}
          </div>
        </div>
      </div>
    </div>
  );
}
