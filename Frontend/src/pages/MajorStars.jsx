import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSEO } from "../hooks/useSEO";
import NotificationBell from "../components/NotificationBell";

// ───────────────── Color tokens ─────────────────
const C = {
  bg: "#0f131c",
  surface: "#0f131c",
  surfaceLowest: "#0a0e17",
  surfaceLow: "#181b25",
  surfaceContainer: "#1c1f29",
  surfaceHigh: "#262a34",
  surfaceHighest: "#31353f",
  primary: "#edb1ff",
  primaryContainer: "#6d208c",
  onPrimary: "#520070",
  onSurface: "#dfe2ef",
  onSurfaceVariant: "#d0c2d3",
  outline: "#998d9d",
  outlineVariant: "#4d4351",
  secondaryContainer: "#583d5f",
  error: "#ffb4ab",
  tertiary: "#d3bcfc",
};

// ───────────────── Global styles ─────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cinzel&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Manrope', sans-serif;
      background: ${C.bg};
      color: ${C.onSurface};
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .mso {
      font-family: 'Material Symbols Outlined';
      font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
      line-height: 1; display: inline-block; vertical-align: middle;
    }
    .glass {
      background: rgba(15,19,28,0.75);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
    }

    /* Header responsive */
    .hp-mobile-btn { display: none; }
    @media (max-width: 900px) {
      .hp-desktop-nav { display: none !important; }
      .hp-mobile-btn  { display: block !important; }
    }
    .nav-link {
      color: ${C.onSurfaceVariant}; font-family: 'Manrope', sans-serif;
      font-size: 0.8rem; text-decoration: none; transition: color 0.3s;
      white-space: nowrap; background: none; border: none; cursor: pointer;
      padding: 4px 8px; border-radius: 0.5rem;
    }
    .nav-link:hover { color: ${C.primary}; }
    .btn-outline {
      background: transparent; color: ${C.primary};
      border: 2px solid rgba(237,177,255,0.2);
      border-radius: 0.75rem; font-weight: 700; cursor: pointer;
      transition: background 0.2s; font-family: 'Manrope', sans-serif;
    }
    .btn-outline:hover { background: rgba(237,177,255,0.08); }
    .btn-outline:active { transform: scale(0.97); }

    /* Nội dung trang */
    .major-title {
      font-family: 'Cinzel', serif;
      font-size: clamp(2rem, 5vw, 3.5rem);
      color: ${C.primary};
      margin-bottom: 1rem;
    }
    .star-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    @media (max-width: 480px) {
      .star-grid {
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }
      .major-title {
        font-size: 2rem;
      }
      .main-padding {
        padding: 100px 1rem 2rem !important;
      }
    }

    /* Background orbs / stars */
    @keyframes twinkle {
      0%,100% { opacity: .12; transform: scale(1); }
      50%     { opacity: .65; transform: scale(1.5); }
    }
    .star {
      position: absolute; border-radius: 50%;
      background: ${C.primary};
      animation: twinkle var(--d,3s) ease-in-out infinite;
      animation-delay: var(--dl,0s);
      pointer-events: none;
    }
    @keyframes floatY {
      0%,100% { transform: translateY(0) scale(1); }
      50%     { transform: translateY(-18px) scale(1.04); }
    }
    .orb {
      position: absolute; border-radius: 50%;
      filter: blur(72px);
      animation: floatY var(--d,7s) ease-in-out infinite;
      animation-delay: var(--dl,0s);
      pointer-events: none;
    }
  `}</style>
);

// ───────────────── Background particles ─────────────────
const STARS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  s: Math.random() * 2.5 + 1,
  t: `${Math.random() * 100}%`,
  l: `${Math.random() * 100}%`,
  d: `${(Math.random() * 4 + 2).toFixed(1)}s`,
  dl: `${(Math.random() * 4).toFixed(1)}s`,
}));

const Background = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
    <img
      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAw8NoRR53N9kVzjPIXE5O763r_RODFkTje0VJ-pFHLXZFu750gjYin8lmfGchTK8f-UqaFxGKoZpokS5kee28ndaH0NZQMFcbXM3zvYeeFg_BUPh3BLjvj5PcdPS9oaq7HHBXJ0imlvFyBGzCHB6Ude7ACgx7kTSUx5d_nKWvTTKBI4N7VbU93AJDZ36v9sF5LqVW7sTJ7Rhhb1x0U44DGe2BKv_nP02Dchiniq-AQwgHnlovz99kGL2_bICYi0QKxN3v_Sjxw6xM"
      alt=""
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.16 }}
    />
    <div style={{
      position: "absolute", inset: 0,
      background: `linear-gradient(to bottom,${C.bg} 0%,transparent 35%,transparent 65%,${C.bg} 100%)`,
    }} />
    <div className="orb" style={{ width: 420, height: 420, background: "rgba(109,32,140,.2)", top: "-100px", left: "-120px", "--d": "8s", "--dl": "0s" }} />
    <div className="orb" style={{ width: 280, height: 280, background: "rgba(237,177,255,.07)", bottom: "80px", right: "-60px", "--d": "10s", "--dl": "2s" }} />
    <div className="orb" style={{ width: 160, height: 160, background: "rgba(83,60,115,.28)", top: "42%", right: "18%", "--d": "5s", "--dl": "1s" }} />
    {STARS.map(s => (
      <div key={s.id} className="star" style={{ width: s.s, height: s.s, top: s.t, left: s.l, "--d": s.d, "--dl": s.dl }} />
    ))}
  </div>
);

// ───────────────── Header ─────────────────
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
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, background: "rgba(15,19,28,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 1px 0 rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem clamp(1rem, 4vw, 1.5rem)", maxWidth: "80rem", margin: "0 auto", gap: "1rem" }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flexShrink: 0 }}>
          <img src="/favicon3.png" alt="logo" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
          <span style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(1.1rem, 3vw, 1.65rem)", color: C.onSurface, lineHeight: 1 }}>YinYang</span>
        </div>

        <div className="hp-desktop-nav" style={{ display: "flex", gap: "clamp(0.6rem, 1.2vw, 1.15rem)", alignItems: "center", flex: 1, justifyContent: "center" }}>
          {navItems.map(item => {
            const isActive = item.activePath && location.pathname === item.activePath;
            return (
              <button
                key={item.label}
                className="nav-link"
                style={{ fontWeight: isActive ? 700 : 400, color: isActive ? C.primary : C.onSurfaceVariant, fontSize: "clamp(0.68rem, 1vw, 0.8rem)" }}
                onClick={() => handleNav(item)}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {user ? (
          <div className="hp-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
            <NotificationBell />
            <div
              onClick={() => navigate("/profile")}
              title={user.full_name || user.email}
              style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg,#edb1ff,#6d208c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#111", cursor: "pointer" }}
            >
              {userInitials}
            </div>
            <button className="btn-outline" style={{ padding: "0.4rem 1rem", fontSize: "0.78rem" }} onClick={logout}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <button
            className="btn-outline hp-desktop-nav"
            style={{ padding: "0.45rem 1.25rem", fontSize: "0.85rem", flexShrink: 0 }}
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </button>
        )}

        <button
          className="hp-mobile-btn"
          onClick={() => setMobileOpen(o => !o)}
          style={{ background: "none", border: "none", color: C.onSurface, fontSize: "1.6rem", cursor: "pointer", lineHeight: 1, padding: "4px", flexShrink: 0 }}
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <div style={{ background: "rgba(15,19,28,0.98)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <span style={{ fontSize: "11px", color: "rgba(237,177,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
            Điều hướng
          </span>
          {navItems.map(item => {
            const isActive = item.activePath && location.pathname === item.activePath;
            return (
              <button
                key={item.label}
                style={{ background: "none", border: "none", cursor: "pointer", color: isActive ? C.primary : C.onSurfaceVariant, fontWeight: isActive ? 700 : 400, fontSize: "0.9rem", fontFamily: "'Manrope', sans-serif", textAlign: "left", padding: 0 }}
                onClick={() => handleNav(item)}
              >
                {item.label}
              </button>
            );
          })}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {user ? (
              <>
                {/* Avatar + tên => bấm tới profile */}
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
                  <span style={{ color: C.onSurfaceVariant, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.full_name || user.email}
                  </span>
                </div>
                <button
                  className="btn-outline"
                  style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem" }}
                  onClick={() => { logout(); setMobileOpen(false); }}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <button
                className="btn-outline"
                style={{ width: "100%", padding: "0.6rem", fontSize: "0.9rem" }}
                onClick={() => { navigate("/login"); setMobileOpen(false); }}
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
// ───────────────── 14 Chính Tinh data ─────────────────
const majorStarsData = [
  { name: "Tử Vi", chinese: "紫微", character: "Anh trai Chu Vũ Vương", meaning: "Hoàng Đế", description: "Sao chính của vũ trụ, đại diện cho sự chỉ huy, lãnh đạo, quyền lực và vận mệnh tối cao.", house: "Tâm chỉ", color: "#edb1ff" },
  { name: "Thiên Cơ", chinese: "天機", character: "Quân Sư / Thái Sư nhà Chu", meaning: "Trí Tuệ", description: "Sao thể hiện sự thông minh, sáng tạo, linh hoạt và khôn ngoan.", house: "Sáng tạo", color: "#d3bcfc" },
  { name: "Vũ Khúc", chinese: "武曲", character: "Chu Vũ Vương", meaning: "Quân Tướng", description: "Sao biểu thị sự kiên cường, quyết đoán, tràng năng lực hành động.", house: "Hành Động", color: "#ff9d8f" },
  { name: "Phá Quân", chinese: "破軍", character: "Trụ Vương", meaning: "Chiến Binh Phá Hoại", description: "Sao mang tính chất phá vỡ, thay đổi, cách tân và đưa lại sự mới mẻ.", house: "Biến Động", color: "#ffb4ab" },
  { name: "Thiên Lương", chinese: "天梁", character: "Cựu tổng binh nhà Thương", meaning: "Dũng Mãnh", description: "Sao duy dương của hệ thống, mang tính trường thọ, an toàn và bảo vệ.", house: "Bảo Vệ", color: "#ffc8c8" },
  { name: "Thái Âm", chinese: "太陰", character: "Phu Nhân Hoàng Phi Hổ", meaning: "Phương Ẩm", description: "Sao duy âm của hệ thống, thể hiện sự trầm tĩnh, nhu mỹ, công ích và sự tích lũy.", house: "Tích Lũy", color: "#c4d4ff" },
  { name: "Thất Sát", chinese: "七殺", character: "Thủ Lĩnh Cấm Quân", meaning: "Quân Tướng Hùng Mạnh", description: "Sao của sự quyết liệt, mạnh mẽ lôi cuốn và bá chủ.", house: "Thống Lĩnh", color: "#ffcb69" },
  { name: "Thiên Đồng", chinese: "天同", character: "Cha của Chu Vũ Vương", meaning: "Vui Vẻ", description: "Sao mang lại niềm vui, lạc quan, yêu thương và sự bảo vệ.", house: "Hạnh Phúc", color: "#b8e5c9" },
  { name: "Cự Môn", chinese: "巨門", character: "Vợ của Khương Tử Nha (Thiên Cơ)", meaning: "Nói Lên Sự Thật", description: "Sao của sự chân thật lộ liễu, không giấu giếm, khéo léo công việc miệng.", house: "Giao Tiếp", color: "#d4c9ff" },
  { name: "Liêm Trinh", chinese: "廉貞", character: "Gian thần nhà Thương", meaning: "Hạnh Phúc Giàu Có", description: "Sao của tính cách kiên nguyên, liêm khiết và có nguyên tắc cao.", house: "Nguyên Tắc", color: "#ffb8d1" },
  { name: "Thiên Phủ", chinese: "天府", character: "Hoàng Hậu / Lãnh Thổ Chủ", meaning: "Kho Tàng", description: "Sao của sự tích trữ, giàu có, an toàn và ổn định.", house: "Tài Phú", color: "#ffe8aa" },
  { name: "Đấu Mủ", chinese: "鬥牲", character: "Tước Chủ", meaning: "Đấu Tranh", description: "Sao của sự cạnh tranh, không nhân nhượng, dốc hết mình trong công việc.", house: "Cạnh Tranh", color: "#e0b0ff" },
  { name: "Tham Lương", chinese: "貪狼", character: "Tướng Tham Dục", meaning: "Tham Vọng", description: "Sao của sự thầm khát, hứng thú, nhiều đam mê và ngoại tình.", house: "Đa Tài", color: "#ffb347" },
  { name: "Tú Khúc", chinese: "祿存", character: "Sao Lộc", meaning: "Mùa Vụ Luân Hồi", description: "Sao của sự may mắn, phúc lộc, cơ hội và tài lộc.", house: "Luân Hồi", color: "#90ee90" },
  { name: "Hóa Quyền", chinese: "化權", character: "Quyền Lực", meaning: "Biến Hóa Quyền Lực", description: "Sao của sự nổi tiếng, ảnh hưởng, lãnh đạo và kiểm soát.", house: "Ảnh Hưởng", color: "#ffd4a3" },
];

// ───────────────── Main component ─────────────────
export default function MajorStars() {
  const navigate = useNavigate();
  useSEO({
    title: "Tra Cứu Sao Chiếu Mệnh Tử Vi | YinYang",
    description: "Tìm hiểu ý nghĩa các sao chính trong tử vi Đẩu Số: Tử Vi, Thiên Phủ, Thái Dương, Thái Âm và hơn 100 sao khác. Tra cứu miễn phí tại YinYang.",
    canonical: "https://yinyang.io.vn/major-stars",
  });
  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", background: C.bg, position: "relative" }}>
        <Background />
        <Header />

        <main className="main-padding" style={{ position: "relative", zIndex: 10, minHeight: "100vh", padding: "120px 2rem 3rem" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {/* Page header */}
            <div style={{ marginBottom: "3rem" }}>
              <div style={{ marginBottom: "1rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: C.onSurfaceVariant, textTransform: "uppercase" }}>
                HỆ THỐNG SAO
              </div>
              <h1 className="major-title">
                14 Chính Tinh
              </h1>
              <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "clamp(0.9rem, 2vw, 1rem)", color: C.onSurfaceVariant, maxWidth: "600px", lineHeight: 1.8 }}>
                Tìm hiểu về 14 sao chính trong hệ thống Tử Vi Đẩu Số. Mỗi ngôi sao đại diện cho một khía cạnh khác nhau của tính cách, vận mệnh và con đường cuộc đời của bạn.
              </p>
            </div>

            {/* Stars grid */}
            <div className="star-grid">
              {majorStarsData.map((star, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "1.5rem",
                    background: "rgba(88,61,95,.25)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(237,177,255,.15)",
                    borderRadius: "1.5rem",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(237,177,255,.4)";
                    e.currentTarget.style.background = "rgba(88,61,95,.35)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(237,177,255,.15)";
                    e.currentTarget.style.background = "rgba(88,61,95,.25)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Top accent bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: star.color, opacity: 0.6 }} />

                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.primary }}>{star.name}</h3>
                    <span style={{ fontSize: "0.875rem", color: C.onSurfaceVariant, opacity: 0.7 }}>{star.chinese}</span>
                  </div>

                  <div style={{ marginBottom: "0.8rem" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", color: C.onSurfaceVariant, textTransform: "uppercase", marginBottom: "0.25rem" }}>Nhân vật</div>
                    <p style={{ fontSize: "0.875rem", color: C.onSurfaceVariant }}>{star.character}</p>
                  </div>

                  <div style={{ marginBottom: "0.8rem" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", color: star.color, textTransform: "uppercase", marginBottom: "0.25rem" }}>Ý Nghĩa</div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: C.primary }}>{star.meaning}</p>
                  </div>

                  <p style={{ fontSize: "0.875rem", color: C.onSurfaceVariant, lineHeight: 1.7, marginBottom: "1rem" }}>
                    {star.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid rgba(237,177,255,.1)" }}>
                    <div style={{ fontSize: "0.75rem", color: C.onSurfaceVariant }}>
                      <strong style={{ color: C.primary }}>Cung:</strong> {star.house}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Back button */}
            <div style={{ marginTop: "3rem", textAlign: "center" }}>
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "1rem 2rem",
                  background: "linear-gradient(135deg, #edb1ff 0%, #6d208c 100%)",
                  color: "#111",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 30px rgba(237,177,255,.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                Quay Lại Trang Chủ
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}