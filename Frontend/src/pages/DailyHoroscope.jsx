import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../config/api";
import NotificationBell from "../components/NotificationBell";

const C = {
  bg: "#0b0e17",
  surface: "#131720",
  surfaceLow: "#1a1e2a",
  surfaceHigh: "#222736",
  surfaceHighest: "#2c3042",
  primary: "#c084fc",
  primaryDim: "#a855f7",
  primaryContainer: "#3b0764",
  onSurface: "#e2e8f0",
  onSurfaceVar: "#94a3b8",
  outline: "#334155",
  success: "#4ade80",
  successDim: "#166534",
  danger: "#f87171",
  dangerDim: "#7f1d1d",
  gold: "#fbbf24",
  teal: "#2dd4bf",
};

/* ── Global styles ── */
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .ms {
      font-family: 'Material Symbols Rounded';
      font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      line-height: 1; display: inline-block; vertical-align: middle;
      user-select: none;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes orb {
      0%,100% { transform: translateY(0) scale(1); }
      50%      { transform: translateY(-24px) scale(1.06); }
    }
    @keyframes flicker {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.75; }
    }

    .card {
      background: ${C.surfaceLow};
      border: 1px solid ${C.outline};
      border-radius: 1.25rem;
      padding: 1.5rem 1.75rem;
      animation: fadeUp .45s ease both;
      transition: border-color .25s;
    }
    .card:hover { border-color: rgba(192,132,252,0.35); }

    .chip {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid ${C.outline};
      font-size: 0.9375rem; line-height: 1.6; color: ${C.onSurfaceVar};
    }
    .chip:last-child { border-bottom: none; }

    .streak {
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #f97316, #dc2626);
      border-radius: 999px; padding: 5px 14px;
      font-size: 0.875rem; font-weight: 700; color: #fff;
      animation: flicker 2.4s ease-in-out infinite;
    }

    .pill {
      display: inline-flex; align-items: center; gap: 6px;
      border-radius: 999px; padding: 5px 14px;
      font-size: 0.8rem; font-weight: 600;
    }

    .btn {
      border-radius: 0.75rem; padding: 10px 22px;
      font-size: 0.875rem; font-weight: 600;
      cursor: pointer; border: none;
      font-family: 'Manrope', sans-serif;
      transition: opacity .2s, transform .15s;
    }
    .btn:hover { opacity: .88; }
    .btn:active { transform: scale(.97); }

    .hour-row {
      display: flex; align-items: center; gap: 10px;
      background: ${C.surface}; border-radius: 0.75rem;
      padding: 0.65rem 1rem;
      border: 1px solid ${C.outline};
      transition: border-color .25s;
    }
    .hour-row:hover { border-color: rgba(192,132,252,0.35); }

    /* ── Header responsive (giống home) ── */
    .hp-mobile-btn { display: none; }
    @media (max-width: 900px) {
      .hp-desktop-nav { display: none !important; }
      .hp-mobile-btn  { display: block !important; }
    }

    .nav-link {
      color: ${C.onSurfaceVar};
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      text-decoration: none;
      transition: color 0.3s;
      white-space: nowrap;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 0.5rem;
    }
    .nav-link:hover { color: ${C.primary}; }

    .btn-outline {
      background: transparent;
      color: ${C.primary};
      border: 2px solid rgba(192,132,252,0.2);
      border-radius: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
      font-family: 'Manrope', sans-serif;
    }
    .btn-outline:hover { background: rgba(192,132,252,0.08); }
    .btn-outline:active { transform: scale(0.97); }
  `}</style>
);

/* ─────────── Header ─────────── */
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Trang chủ",     to: "/",                activePath: "/" },
    { label: "Dịch vụ",       to: "services",         activePath: null },
    { label: "Lá số",         to: "/la-so",           activePath: "/la-so" },
    { label: "Tử vi hôm nay", to: "/daily-horoscope", activePath: "/daily-horoscope" },
    { label: "Nhật ký",       to: "/journal",         activePath: "/journal" },
    { label: "Chatbot",       to: "/chatbot",         activePath: "/chatbot" },
    { label: "14 Chính tinh", to: "/major-stars",     activePath: "/major-stars" },
    { label: "12 con giáp",   to: "zodiac",           activePath: null },
    { label: "Liên hệ",       to: "contact",          activePath: null },
  ];

  const handleNav = (item) => {
    if (["contact", "services", "zodiac"].includes(item.to)) {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(item.to);
        if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
      }, 100);
    } else {
      navigate(item.to);
    }
    setMobileOpen(false);
  };

  const userInitials = (user?.full_name || user?.email || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, background: "rgba(11,14,23,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${C.outline}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem clamp(1rem, 4vw, 1.5rem)", maxWidth: "80rem", margin: "0 auto", gap: "1rem" }}>
        {/* Logo */}
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flexShrink: 0 }}>
          <img src="/favicon3.png" alt="logo" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
          <span style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(1.1rem, 3vw, 1.65rem)", color: C.onSurface, lineHeight: 1 }}>YinYang</span>
        </div>

        {/* Desktop nav */}
        <div className="hp-desktop-nav" style={{ display: "flex", gap: "clamp(0.6rem, 1.2vw, 1.15rem)", alignItems: "center", flex: 1, justifyContent: "center" }}>
          {navItems.map((item) => {
            const isActive = item.activePath && location.pathname === item.activePath;
            return (
              <button key={item.label} className="nav-link" style={{ fontWeight: isActive ? 700 : 400, color: isActive ? C.primary : C.onSurfaceVar, fontSize: "clamp(0.68rem, 1vw, 0.8rem)" }} onClick={() => handleNav(item)}>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Desktop user / login */}
        {user ? (
          <div className="hp-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
            <NotificationBell />
            <div onClick={() => navigate("/profile")} title={user.full_name || user.email} style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg,#edb1ff,#6d208c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#111", cursor: "pointer" }}>
              {userInitials}
            </div>
            <button className="btn-outline" style={{ padding: "0.4rem 1rem", fontSize: "0.78rem" }} onClick={logout}>Đăng xuất</button>
          </div>
        ) : (
          <button className="btn-outline hp-desktop-nav" style={{ padding: "0.45rem 1.25rem", fontSize: "0.85rem", flexShrink: 0 }} onClick={() => navigate("/login")}>Đăng nhập</button>
        )}

        {/* Hamburger */}
        <button className="hp-mobile-btn" onClick={() => setMobileOpen((o) => !o)} style={{ background: "none", border: "none", color: C.onSurface, fontSize: "1.6rem", cursor: "pointer", lineHeight: 1, padding: "4px", flexShrink: 0 }} aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}>
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{ background: "rgba(11,14,23,0.98)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <span style={{ fontSize: "11px", color: "rgba(192,132,252,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>Điều hướng</span>

          {navItems.map((item) => {
            const isActive = item.activePath && location.pathname === item.activePath;
            return (
              <button key={item.label} style={{ background: "none", border: "none", cursor: "pointer", color: isActive ? C.primary : C.onSurfaceVar, fontWeight: isActive ? 700 : 400, fontSize: "0.9rem", fontFamily: "'Manrope', sans-serif", textAlign: "left", padding: 0 }} onClick={() => handleNav(item)}>
                {item.label}
              </button>
            );
          })}

          {/* User row */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {user ? (
              <>
                {/* Avatar + tên -> bấm vào đi profile */}
                <div
                  onClick={() => { navigate("/profile"); setMobileOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, cursor: "pointer", minWidth: 0 }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { navigate("/profile"); setMobileOpen(false); } }}
                  aria-label="Trang cá nhân"
                >
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#edb1ff,#6d208c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#111", flexShrink: 0 }}>
                    {userInitials}
                  </div>
                  <span style={{ color: C.onSurfaceVar, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.full_name || user.email}
                  </span>
                </div>
                <button className="btn-outline" style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem" }} onClick={() => { logout(); setMobileOpen(false); }}>Đăng xuất</button>
              </>
            ) : (
              <button className="btn-outline" style={{ width: "100%", padding: "0.6rem", fontSize: "0.9rem" }} onClick={() => { navigate("/login"); setMobileOpen(false); }}>Đăng nhập</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

/* ── Section card ── */
function Card({ icon, iconColor, title, delay = 0, children }) {
  return (
    <div className="card" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.1rem" }}>
        <span className="ms" style={{ color: iconColor, fontSize: "1.35rem" }}>{icon}</span>
        <h2 style={{
          fontFamily: "Manrope, sans-serif", fontWeight: 700,
          fontSize: "0.95rem", letterSpacing: "0.04em",
          color: C.onSurface, textTransform: "uppercase",
        }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ── List ── */
function ItemList({ items, iconColor, icon }) {
  if (!items?.length) return <p style={{ color: C.onSurfaceVar, fontSize: "0.9rem" }}>—</p>;
  return (
    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column" }}>
      {items.map((item, i) => (
        <li key={i} className="chip">
          <span className="ms" style={{ color: iconColor, fontSize: "1.05rem", flexShrink: 0, marginTop: 2 }}>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Hours ── */
function HourList({ hours }) {
  if (!hours?.length) return <p style={{ color: C.onSurfaceVar, fontSize: "0.9rem" }}>—</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {hours.map((h, i) => (
        <div key={i} className="hour-row">
          <span className="ms" style={{ color: C.primary, fontSize: "1.1rem", flexShrink: 0 }}>schedule</span>
          <span style={{ color: C.onSurface, fontSize: "0.9rem" }}>{h}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Lucky pair ── */
function LuckyPair({ color, number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      {[
        { icon: "palette", label: "Màu may mắn", value: color, accent: C.gold },
        { icon: "casino",  label: "Số may mắn",  value: number, accent: C.teal },
      ].map(({ icon, label, value, accent }) => (
        <div key={label} style={{
          background: C.surface, borderRadius: "1rem",
          padding: "1rem 1.25rem",
          border: `1px solid ${C.outline}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
            <span className="ms" style={{ color: accent, fontSize: "1.15rem" }}>{icon}</span>
            <span style={{ fontSize: "0.72rem", color: C.onSurfaceVar, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              {label}
            </span>
          </div>
          <p style={{ fontFamily: "Newsreader, serif", fontSize: "1.05rem", color: C.onSurface, fontStyle: "italic" }}>
            {value || "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div style={{ background: C.surfaceLow, borderRadius: "1.25rem", padding: "1.5rem", border: `1px solid ${C.outline}` }}>
      {[75, 55, 65].map((w, i) => (
        <div key={i} style={{
          height: 12, borderRadius: 99, marginBottom: 12, width: `${w}%`,
          background: C.surfaceHigh, opacity: 0.6,
        }} />
      ))}
    </div>
  );
}

const SAO_INFO = {
  "Lưu Nhật Lộc Tồn":   { icon: "💰", color: "#4ade80",  desc: "Sao tài lộc — tốt cho giao dịch, kiếm tiền" },
  "Lưu Nhật Kình Dương": { icon: "⚔",  color: "#f87171",  desc: "Sao sát — cẩn thận va chạm, tranh chấp" },
  "Lưu Nhật Đà La":      { icon: "🌑", color: "#a78bfa",  desc: "Sao cản — tránh quyết định lớn, dễ trì hoãn" },
  "Lưu Nhật Thiên Mã":   { icon: "🐎", color: "#67e8f9",  desc: "Sao di chuyển — tốt cho xuất hành, đi lại" },
  "Lưu Nhật Tang Môn":   { icon: "🪦", color: "#94a3b8",  desc: "Sao tang — hạn chế việc lớn, cẩn thận sức khoẻ" },
  "Lưu Nhật Bạch Hổ":    { icon: "🐯", color: "#fb923c",  desc: "Sao hung — đề phòng tranh cãi, chấn thương" },
};
const HOA_COLORS = {
  "Hóa Lộc": "#4ade80", "Hóa Quyền": "#fbbf24", "Hóa Khoa": "#67e8f9", "Hóa Kỵ": "#f87171",
};

function SaoNhatCard({ saoNhat, delay = 0 }) {
  if (!saoNhat) return null;
  const stars = Object.entries(SAO_INFO)
    .map(([name, info]) => ({ name, ...info, data: saoNhat[name] }))
    .filter(s => s.data);
  const tuHoa = saoNhat.tu_hoa || {};
  return (
    <div className="card" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1.1rem" }}>
        <span className="ms" style={{ color: C.primary, fontSize:"1.3rem" }}>auto_awesome</span>
        <span style={{ fontWeight:700, fontSize:"1rem", color: C.onSurface }}>
          Sao Nhật — {saoNhat.can} {saoNhat.chi}
        </span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:"1rem" }}>
        {stars.map(({ name, icon, color, desc, data }) => (
          <div key={name} style={{ display:"flex", alignItems:"flex-start", gap:10,
            padding:"7px 10px", borderRadius:8, background:"rgba(255,255,255,0.03)",
            border:"1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ flexShrink:0, fontSize:"1rem", marginTop:1 }}>{icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:700, fontSize:"0.78rem", color }}>{name}</span>
                <span style={{ fontSize:"0.68rem", color: C.onSurfaceVar }}>
                  Cung {data.house} · {data.chi}
                </span>
              </div>
              <div style={{ fontSize:"0.68rem", color: C.onSurfaceVar, marginTop:2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
      {Object.keys(tuHoa).length > 0 && (
        <>
          <div style={{ fontSize:"0.68rem", color: C.onSurfaceVar, marginBottom:6,
            letterSpacing:"0.08em", textTransform:"uppercase" }}>Tứ Hóa ngày</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {Object.entries(tuHoa).map(([star, hoa]) => (
              <span key={star} style={{
                fontSize:"0.72rem", padding:"3px 10px", borderRadius:999,
                background:`${HOA_COLORS[hoa] || "#fff"}18`,
                border:`1px solid ${HOA_COLORS[hoa] || "#fff"}40`,
                color: HOA_COLORS[hoa] || C.onSurface, fontWeight:600,
              }}>{star} · {hoa}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main ── */
export default function DailyHoroscope() {
  useAuth();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get("/api/v1/daily-horoscope/")
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div style={{ background: C.bg, minHeight: "100vh", position: "relative" }}>
      <G />
      <Header />

      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "8%", left: "10%",
          width: 480, height: 480, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(109,32,140,0.22) 0%, transparent 70%)",
          animation: "orb 9s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "12%", right: "8%",
          width: 340, height: 340, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,212,191,0.1) 0%, transparent 70%)",
          animation: "orb 13s ease-in-out infinite reverse",
        }} />
      </div>

      <main style={{
        position: "relative", zIndex: 1,
        maxWidth: "54rem", margin: "0 auto",
        padding: "6.5rem 1.25rem 5rem",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem", animation: "fadeUp .4s ease" }}>
          <p style={{ fontSize: "0.8rem", color: C.onSurfaceVar, marginBottom: "0.4rem", textTransform: "capitalize", letterSpacing: "0.05em" }}>
            {today}
          </p>
          <h1 style={{
            fontFamily: "Newsreader, serif",
            fontSize: "clamp(2.25rem, 5vw, 3rem)",
            fontWeight: 400, fontStyle: "italic",
            background: `linear-gradient(135deg, ${C.primary} 0%, #818cf8 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.25, marginBottom: "1.25rem",
          }}>
            Tử Vi Hôm Nay
          </h1>

          {data && (
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.6rem" }}>
              <span className="streak">🔥 Chuỗi {data.streak} ngày</span>
              {data.personalized && (
                <span className="pill" style={{
                  background: "rgba(192,132,252,0.12)",
                  border: `1px solid rgba(192,132,252,0.3)`,
                  color: C.primary,
                }}>
                  <span className="ms" style={{ fontSize: "0.95rem" }}>auto_awesome</span>
                  Cá nhân hóa theo lá số
                </span>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                border: `3px solid ${C.outline}`, borderTopColor: C.primary,
                animation: "spin .8s linear infinite", margin: "0 auto 0.75rem",
              }} />
              <p style={{ color: C.onSurfaceVar, fontSize: "0.875rem" }}>Đang xem thiên cơ hôm nay…</p>
            </div>
            {[0,1,2,3].map(i => <Skeleton key={i} />)}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            background: "rgba(248,113,113,0.08)",
            border: `1px solid rgba(248,113,113,0.25)`,
            borderRadius: "1.25rem", padding: "2rem",
            textAlign: "center",
          }}>
            <span className="ms" style={{ color: C.danger, fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>
              error_outline
            </span>
            <p style={{ color: C.danger, marginBottom: "1.25rem", fontSize: "0.9rem" }}>{error}</p>
            <button className="btn" onClick={() => window.location.reload()} style={{
              background: C.primaryContainer, color: C.primary,
            }}>Thử lại</button>
          </div>
        )}

        {/* No chart placeholder */}
        {data && !loading && data.needs_chart && (
          <div style={{
            background: C.surfaceLow, border: `1px solid rgba(192,132,252,0.2)`,
            borderRadius: "1.5rem", padding: "3rem 2rem",
            textAlign: "center", animation: "fadeUp .4s ease",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", margin: "0 auto 1.5rem",
              background: "radial-gradient(circle, rgba(192,132,252,0.2), transparent 70%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="ms" style={{ color: C.primary, fontSize: "2.4rem" }}>auto_awesome</span>
            </div>
            <h2 style={{
              fontFamily: "Newsreader, serif", fontStyle: "italic",
              fontSize: "1.6rem", color: C.onSurface, marginBottom: "0.75rem",
            }}>Bạn chưa có Lá Số Tử Vi</h2>
            <p style={{
              color: C.onSurfaceVar, fontSize: "0.9rem", lineHeight: 1.75,
              maxWidth: "360px", margin: "0 auto 2rem",
            }}>
              Tử vi hôm nay được cá nhân hóa hoàn toàn dựa trên lá số của bạn.
              Hãy lập lá số để nhận luận giải riêng theo từng cung, từng sao nhật chiếu vào lá số.
            </p>
            <button className="btn" onClick={() => navigate("/")} style={{
              background: `linear-gradient(135deg, ${C.primary}, #818cf8)`,
              color: "#fff", padding: "0.75rem 2rem", fontSize: "0.95rem",
            }}>
              Lập Lá Số Ngay
            </button>
            {data.sao_nhat && Object.keys(data.sao_nhat).length > 0 && (
              <div style={{ marginTop: "2.5rem", textAlign: "left" }}>
                <SaoNhatCard saoNhat={data.sao_nhat} />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {data && !loading && !data.needs_chart && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

            {/* Tổng quan */}
            <Card icon="auto_awesome" iconColor={C.primary} title="Tổng Quan Vận Thế" delay={0}>
              <p style={{
                fontFamily: "Newsreader, serif", fontStyle: "italic",
                fontSize: "1.0625rem", lineHeight: 1.8, color: C.onSurface,
              }}>
                {data.tong_quan}
              </p>
            </Card>

            {/* Nên làm / Nên tránh */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>
              <Card icon="check_circle" iconColor={C.success} title="Nên Làm Hôm Nay" delay={80}>
                <ItemList items={data.nen_lam} iconColor={C.success} icon="check_circle" />
              </Card>
              <Card icon="cancel" iconColor={C.danger} title="Nên Tránh Hôm Nay" delay={160}>
                <ItemList items={data.nen_tranh} iconColor={C.danger} icon="cancel" />
              </Card>
            </div>

            {/* Giờ tốt */}
            <Card icon="schedule" iconColor={C.primary} title="Giờ Tốt Trong Ngày" delay={240}>
              <HourList hours={data.gio_tot} />
            </Card>

            {/* Màu + Số may mắn */}
            <div style={{ animation: "fadeUp .45s ease both", animationDelay: "320ms" }}>
              <LuckyPair color={data.mau_may_man} number={data.con_so_may_man} />
            </div>

            {/* Sao Nhật */}
            {data.sao_nhat && (
              <div style={{ animation:"fadeUp .45s ease both", animationDelay:"360ms" }}>
                <SaoNhatCard saoNhat={data.sao_nhat} />
              </div>
            )}

            {/* Lời khuyên */}
            <Card icon="tips_and_updates" iconColor={C.gold} title="Lời Khuyên" delay={440}>
              <p style={{ fontSize: "0.9875rem", lineHeight: 1.75, color: C.onSurface }}>
                {data.loi_khuyen}
              </p>
            </Card>

            {/* Footer actions */}
            <div style={{
              textAlign: "center", paddingTop: "0.5rem",
              animation: "fadeUp .45s ease both", animationDelay: "480ms",
            }}>
              <p style={{ fontSize: "0.78rem", color: C.onSurfaceVar, marginBottom: "1rem" }}>
                {data.cached ? "Đã lưu cache — xem lại không tốn lượt AI" : "Mới tạo hôm nay"}
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn" onClick={() => navigate("/la-so-tu-vi")} style={{
                  background: C.surfaceHigh, color: C.onSurface,
                  border: `1px solid ${C.outline}`,
                }}>
                  Xem Lá Số
                </button>
                <button className="btn" onClick={() => navigate("/chatbot")} style={{
                  background: `linear-gradient(135deg, ${C.primary}, #818cf8)`,
                  color: "#fff",
                }}>
                  Hỏi AI Tử Vi
                </button>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}