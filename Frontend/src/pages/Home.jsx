import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSEO } from "../hooks/useSEO";
import NotificationBell from "../components/NotificationBell";
import { lunarToSolarLocal } from "../services/lunarConverter";

/* ─────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────────*/
const C = {
  background:              "#0f131c",
  surface:                  "#0f131c",
  surfaceContainerLowest:   "#0a0e17",
  surfaceContainerLow:      "#181b25",
  surfaceContainer:         "#1c1f29",
  surfaceContainerHigh:     "#262a34",
  surfaceContainerHighest:  "#31353f",
  primary:                  "#edb1ff",
  primaryContainer:         "#6d208c",
  onPrimary:                "#520070",
  onSurface:                "#dfe2ef",
  onSurfaceVariant:         "#d0c2d3",
  outlineVariant:           "#4d4351",
  secondaryContainer:       "#583d5f",
};

/* ─────────────── Google Fonts ──────────────── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cinzel&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${C.background}; color: ${C.onSurface}; font-family: 'Manrope', sans-serif; }
    .font-headline { font-family: 'Newsreader', serif; }
    .glass-panel {
      background: rgba(15,19,28,0.7);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
    }
    .celestial-glow {
      background: radial-gradient(circle at center, rgba(237,177,255,0.15) 0%, transparent 70%);
    }
    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      font-size: inherit; line-height: 1; display: inline-block; vertical-align: middle;
    }
    .btn-primary {
      background: linear-gradient(135deg, ${C.primary}, ${C.primaryContainer});
      color: white; border: none; border-radius: 0.75rem;
      font-weight: 700; cursor: pointer;
      transition: box-shadow 0.3s, transform 0.15s;
    }
    .btn-primary:hover { box-shadow: 0 0 30px -5px rgba(237,177,255,0.4); }
    .btn-primary:active { transform: scale(0.98); }
    .btn-outline {
      background: transparent; color: ${C.primary};
      border: 2px solid rgba(237,177,255,0.2);
      border-radius: 0.75rem; font-weight: 700; cursor: pointer;
      transition: background 0.2s;
    }
    .btn-outline:hover { background: rgba(237,177,255,0.08); }
    .btn-outline:active { transform: scale(0.97); }
    .nav-link {
      color: ${C.onSurfaceVariant}; font-family: 'Manrope', sans-serif;
      font-size: 0.8rem; text-decoration: none; transition: color 0.3s;
      white-space: nowrap;
    }
    .nav-link:hover { color: ${C.primary}; }
    .field-input, .field-select {
      width: 100%; background: ${C.surfaceContainerLowest};
      border: none; border-radius: 0.75rem;
      padding: 1rem 1.2rem; color: ${C.onSurface};
      font-family: 'Manrope', sans-serif; font-size: 1.1rem;
      outline: none; transition: box-shadow 0.2s;
    }
    .field-input:focus, .field-select:focus { box-shadow: 0 0 0 2px rgba(237,177,255,0.4); }
    .field-input::placeholder { color: rgba(208,194,211,0.4); }
    .field-select option { background: ${C.surfaceContainerLowest}; }
    .insight-card {
      position: relative; overflow: hidden;
      background: ${C.surfaceContainerLow}; border-radius: 2rem;
      padding: 2rem; cursor: pointer; transition: background 0.5s;
    }
    .insight-card:hover { background: ${C.surfaceContainerHigh}; }
    .insight-card .glow-spot {
      position: absolute; top: -1rem; right: -1rem; width: 6rem; height: 6rem;
      background: radial-gradient(circle at center, rgba(237,177,255,0.15) 0%, transparent 70%);
      opacity: 0; transition: opacity 0.4s;
    }
    .insight-card:hover .glow-spot { opacity: 1; }
    .zodiac-card {
      background: ${C.surface}; padding: 1.5rem; border-radius: 1rem;
      border: 1px solid rgba(77,67,81,0.1); text-align: center;
      cursor: pointer; transition: border-color 0.3s;
    }
    .zodiac-card:hover { border-color: rgba(237,177,255,0.4); }
    .zodiac-card img {
      width: 100%; aspect-ratio: 1/1; object-fit: cover;
      border-radius: 0.75rem; margin-bottom: 1rem;
      filter: grayscale(1); transition: filter 0.7s;
    }
    .zodiac-card:hover img { filter: grayscale(0); }
    .footer-link {
      color: ${C.onSurfaceVariant}; text-decoration: none;
      display: inline-block; transition: color 0.2s, transform 0.2s;
    }
    .footer-link:hover { color: ${C.primary}; transform: translateX(4px); }

    /* ── Header responsive ── */
    .hp-mobile-btn { display: none; }
    @media (max-width: 900px) {
      .hp-desktop-nav { display: none !important; }
      .hp-mobile-btn  { display: block !important; }
    }

    /* ── Hero title ── */
    @media (max-width: 480px) {
      .hero-title { font-size: 9.5vw !important; }
    }

    /* ── Hero section ── */
    @media (max-width: 600px) {
      .hero-section-padding { padding: 5rem 1rem 2rem !important; }
      .hero-form-panel { padding: 1.25rem !important; }
      .hero-form-grid { gap: 1.25rem !important; }
    }

    /* ── Combo section ── */
    @media (max-width: 600px) {
      .combo-grid { grid-template-columns: 1fr !important; }
      .combo-header { flex-direction: column; align-items: flex-start !important; gap: 0.75rem; }
    }

    /* ── Insights section ── */
    @media (max-width: 600px) {
      .insights-section { padding: 3rem 1rem !important; }
      .insights-grid { grid-template-columns: 1fr !important; }
    }

    .zodiac-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(6, 1fr); /* laptop: 2 hàng × 6 */
    }

    @media (max-width: 1024px) {
      .zodiac-grid {
        grid-template-columns: repeat(4, 1fr); /* 3 hàng × 4 */
      }
    }

    @media (max-width: 768px) {
      .zodiac-grid {
        grid-template-columns: repeat(3, 1fr); /* 4 hàng × 3 */
      }
    }

    @media (max-width: 480px) {
      .zodiac-grid {
        grid-template-columns: repeat(2, 1fr); /* 6 hàng × 2 */
      }
    }
    /* ================= FOOTER ================= */
    .footer-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr;
      gap: 3rem;
    }
    .footer-brand { display: flex; flex-direction: column; }
    .footer-logo-wrap { display: flex; align-items: center; gap: 0.75rem; }
    .footer-social { display: flex; gap: 1rem; }
    @media (max-width: 1024px) {
      .footer-grid { grid-template-columns: 1fr 1fr; gap: 2.5rem; }
      .footer-brand { grid-column: 1 / -1; align-items: center; text-align: center; }
      .footer-social { justify-content: center; }
    }
    @media (max-width: 768px) {
      .footer-grid { grid-template-columns: 1fr; gap: 2rem; text-align: center; }
      .footer-brand { align-items: center; }
      .footer-logo-wrap { justify-content: center; }
      .footer-social { justify-content: center; }
      .footer-link { width: 100%; }
    }
    @media (max-width: 480px) {
      footer { padding: 3rem 1rem !important; }
      .footer-logo-wrap img { width: 42px !important; height: 42px !important; }
      .footer-logo-wrap div { font-size: 2rem !important; }
      .footer-social a { width: 3rem !important; height: 3rem !important; }
    }
    @media (max-width: 768px) {
      .hero-top { flex-direction: column !important; text-align: center; }
      .hero-top > div:first-child { text-align: center !important; }
      .hero-top img { width: 180px !important; margin-top: 1rem; }
    }
  `}</style>
);

/* ─────────────────────── Header ──────────────────────── */
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
    const scrollToSection = () => {
      const el = document.getElementById(item.to);
      if (el) {
        window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
      }
    };

    if (location.pathname !== "/") {
      navigate("/");
      // Đợi trang render xong rồi mới scroll
      setTimeout(scrollToSection, 300);
    } else {
      scrollToSection();
    }
  } else {
    navigate(item.to);
  }

  setMobileOpen(false);
};

  const userInitials = (user?.full_name || user?.email || "?")
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <nav style={{
      position: "fixed", top: 0, width: "100%", zIndex: 50,
      background: "rgba(15,19,28,0.88)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: "0 1px 0 rgba(255,255,255,0.06)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0.65rem clamp(1rem, 4vw, 1.5rem)",
        maxWidth: "80rem", margin: "0 auto", gap: "1rem",
      }}>

        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flexShrink: 0 }}
        >
          <img src="/favicon3.png" alt="logo" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
          <span style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(1.1rem, 3vw, 1.65rem)",
            color: C.onSurface, lineHeight: 1,
          }}>
            YinYang
          </span>
        </div>

        {/* Desktop nav */}
        <div
          className="hp-desktop-nav"
          style={{ display: "flex", gap: "clamp(0.6rem, 1.2vw, 1.15rem)", alignItems: "center", flex: 1, justifyContent: "center" }}
        >
          {navItems.map(item => {
            const isActive = item.activePath && location.pathname === item.activePath;
            return (
              <span
                key={item.label}
                className="nav-link"
                style={{
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? C.primary : C.onSurfaceVariant,
                  fontSize: "clamp(0.68rem, 1vw, 0.8rem)",
                }}
                onClick={() => handleNav(item)}
              >
                {item.label}
              </span>
            );
          })}
        </div>

        {/* Desktop user / login */}
        {user ? (
          <div className="hp-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
            <NotificationBell />
            <div
              onClick={() => navigate("/profile")}
              title={user.full_name || user.email}
              style={{
                width: "30px", height: "30px", borderRadius: "50%",
                background: "linear-gradient(135deg,#edb1ff,#6d208c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", fontWeight: 700, color: "#111", cursor: "pointer",
              }}
            >
              {userInitials}
            </div>
            <button
              className="btn-outline"
              style={{ padding: "0.4rem 1rem", fontSize: "0.78rem", fontFamily: "'Manrope', sans-serif" }}
              onClick={logout}
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <button
            className="btn-outline hp-desktop-nav"
            style={{ padding: "0.45rem 1.25rem", fontSize: "0.85rem", fontFamily: "'Manrope', sans-serif", flexShrink: 0 }}
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </button>
        )}

        {/* Hamburger */}
        <button
          className="hp-mobile-btn"
          onClick={() => setMobileOpen(o => !o)}
          style={{ background: "none", border: "none", color: C.onSurface, fontSize: "1.6rem", cursor: "pointer", lineHeight: 1, padding: "4px", flexShrink: 0 }}
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{
          background: "rgba(15,19,28,0.98)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "1rem 1.25rem",
          display: "flex", flexDirection: "column", gap: "0.85rem",
        }}>
          <span style={{
            fontSize: "11px", color: "rgba(237,177,255,0.5)",
            textTransform: "uppercase", letterSpacing: "0.08em",
            borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px",
          }}>
            Điều hướng
          </span>

          {navItems.map(item => {
            const isActive = item.activePath && location.pathname === item.activePath;
            return (
              <span
                key={item.label}
                style={{
                  cursor: "pointer",
                  color: isActive ? C.primary : C.onSurfaceVariant,
                  fontWeight: isActive ? 700 : 400,
                  fontSize: "0.9rem", fontFamily: "'Manrope', sans-serif",
                }}
                onClick={() => handleNav(item)}
              >
                {item.label}
              </span>
            );
          })}

          {/* User row */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {user ? (
              <>
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
                  style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem", fontFamily: "'Manrope', sans-serif" }}
                  onClick={() => { logout(); setMobileOpen(false); }}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <button
                className="btn-outline"
                style={{ width: "100%", padding: "0.6rem", fontSize: "0.9rem", fontFamily: "'Manrope', sans-serif" }}
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

/* ─────────────────────── Hero / Banner ──────────────────────── */
const HeroSection = () => {
  const navigate = useNavigate();

  const getCanChi = (year) => {
    const can = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
    const chi = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    const canIndex = (year - 4) % 10;
    const chiIndex = (year - 4) % 12;
    return `${can[canIndex]} ${chi[chiIndex]}`;
  };

  const currentYear = new Date().getFullYear();
  const [calMode, setCalMode] = useState("solar");
  const [form, setForm] = useState({
    name: "", dob: "",lunarDate: "", time: "", gender: "Nam", year: currentYear.toString(), 
    lunarLeap: false,
  });
  const [converting, setConverting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const startYear = currentYear - 10;
  const endYear = currentYear + 10;
  const yearOptions = [];
  for (let y = startYear; y <= endYear; y++) {
    yearOptions.push({ value: y, label: `${y} (${getCanChi(y)})` });
  }

  const handleGetChartClick = async () => {
    if (!form.name || !form.time) {
      alert("Vui lòng nhập đầy đủ thông tin (Họ tên, Giờ sinh)");
      return;
    }

    let birthDate = form.dob;

    if (calMode === "lunar") {
      if (!form.lunarDate) {
        alert("Vui lòng nhập ngày sinh âm lịch");
        return;
      }

      setConverting(true);
      const [year, month, day] = form.lunarDate.split("-").map(Number);
      const converted = lunarToSolarLocal(year, month, day, form.lunarLeap);
      if (!converted) {
        alert("Ngày âm lịch không hợp lệ hoặc không thể chuyển đổi.");
        setConverting(false);
        return;
      }
      birthDate = converted;
      setConverting(false);
    }
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      alert("Ngày sinh không hợp lệ. Vui lòng nhập lại.");
      return;
    }

    navigate("/la-so", {
      state: {
        name: form.name,
        birthDate,
        birthHour: form.time,
        gender: form.gender === "Nữ" ? "female" : "male",
        targetYear: Number(form.year),
        calMode,
        lunarDateInput: calMode === "lunar" ? form.lunarDate : null,
        lunarLeap: calMode === "lunar" ? form.lunarLeap : false,
      },
    });
  };
  return (
    <section
      className="hero-section-padding"
      style={{
        position: "relative", minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", padding: "6rem 1.5rem 4rem",
      }}
    >
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img
          src="/background2.png"
          alt="dark background"
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }}
        />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${C.background}, transparent, ${C.background})` }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: "80rem", width: "100%" }}>

        <div
  className="hero-top"
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "4rem",
    gap: "1rem",
  }}
>
          {/* Cột trái */}
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <h1
              className="font-headline hero-title"
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "clamp(1rem, 6vw, 4.5rem)",
                color: C.primary,
                letterSpacing: "-0.02em",
                marginBottom: "1rem",
                textShadow: "0 0 80px rgba(237,177,255,0.2)",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              LÁ SỐ TỬ VI
            </h1>

            <p
              style={{
                color: C.onSurfaceVariant,
                fontSize: "clamp(0.75rem, 2.5vw, 1.6rem)",
                fontWeight: 300,
                letterSpacing: "0.02em",
                lineHeight: 1.6,
              }}
            >
              Mỗi vì sao khi bạn chào đời đều mang một thông điệp riêng. Hãy để
              YinYang giúp bạn giải mã bản đồ sao phương Đông, thấu hiểu bản thân để
              nắm bắt cơ hội và sống trọn vẹn từng khoảnh khắc.
            </p>
          </div>

          {/* Cột phải */}
          <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "flex-end" }}>
            <img
              src="/favicon3.png"
              alt="Minh họa lá số"
              style={{
                width: "clamp(80px, 22vw, 450px)",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>
        </div>

        {/* Form */}
        <div
          className="glass-panel hero-form-panel"
          style={{
            maxWidth: "70rem", margin: "0 auto", padding: "3rem",
            borderRadius: "2rem", border: `1px solid rgba(77, 67, 81, 0.12)`,
            boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
          }}
        >
          {/* Toggle dương / âm lịch */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 999, padding: "4px", border: "1px solid rgba(237,177,255,0.15)", gap: 4 }}>
              {[{ key: "solar", label: "Dương lịch" }, { key: "lunar", label: "Âm lịch" }].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCalMode(key)}
                  style={{
                    padding: "0.35rem 1.2rem",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    fontFamily: "'Manrope', sans-serif",
                    transition: "all 0.2s",
                    background: calMode === key ? "linear-gradient(135deg, #edb1ff, #6d208c)" : "transparent",
                    color: calMode === key ? "#fff" : "rgba(237,177,255,0.55)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="hero-form-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "2.5rem" }}
          >
            {/* Họ tên */}
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.primary, textTransform: "uppercase", marginBottom: "0.5rem", marginLeft: "0.25rem" }}>Họ và Tên</label>
              <input className="field-input" type="text" name="name" placeholder="Nguyễn Văn A" value={form.name} onChange={handleChange} />
            </div>

            {/* Ngày sinh */}
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.primary, textTransform: "uppercase", marginBottom: "0.5rem", marginLeft: "0.25rem"}}>
                Ngày sinh
              </label>
              <input className="field-input" type="date" name={calMode === "solar" ? "dob" : "lunarDate"} value={calMode === "solar" ? form.dob : form.lunarDate} onChange={handleChange} style={{ colorScheme: "dark" }}/>
              {calMode === "lunar" && (
                <label
                  style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.72rem", color: "rgba(237,177,255,0.6)", cursor: "pointer"}} >
                  <input type="checkbox" name="lunarLeap" checked={form.lunarLeap} onChange={handleChange} style={{ accentColor: "#edb1ff" }} />
                  Tháng nhuận
                </label>
              )}
            </div>

            {/* Giờ sinh */}
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.primary, textTransform: "uppercase", marginBottom: "0.5rem", marginLeft: "0.25rem" }}>Giờ sinh</label>
              <input className="field-input" type="time" name="time" value={form.time} onChange={handleChange} style={{ colorScheme: "dark" }} />
            </div>

            {/* Giới tính */}
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.primary, textTransform: "uppercase", marginBottom: "0.5rem", marginLeft: "0.25rem" }}>Giới tính</label>
              <select className="field-select" name="gender" value={form.gender} onChange={handleChange}>
                <option>Nam</option><option>Nữ</option>
              </select>
            </div>

            {/* Năm tra cứu */}
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.primary, textTransform: "uppercase", marginBottom: "0.5rem", marginLeft: "0.25rem" }}>Năm tra cứu</label>
              <select className="field-select" name="year" value={form.year} onChange={handleChange}>
                {yearOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                className="btn-outline"
                style={{ width: "100%", padding: "1rem", fontSize: "clamp(0.9rem, 2vw, 1.3rem)", fontFamily: "'Manrope', sans-serif", opacity: converting ? 0.6 : 1, cursor: converting ? "not-allowed" : "pointer" }}
                onClick={handleGetChartClick}
                disabled={converting}
              >
                {converting ? "Đang chuyển đổi..." : "Giải Mã Lá Số"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────── Combo / Packages ──────────────────────── */
const comboData = [
  {
    title: "TƯƠNG HỢP TÌNH YÊU",
    desc: "Đánh giá mối quan hệ giữa hai lá số, hóa giải xung khắc, xem duyên nợ.",
    stats: "1 MỤC • 5 CHỦ ĐỀ",
    price: "169.000 đ",
    color: "#d9659e",
    details: [
      "Phân tích mức độ hòa hợp giữa hai lá số.",
      "Luận duyên nợ, cảm xúc và sự gắn kết.",
      "Gợi ý cách hóa giải xung khắc trong tình yêu.",
    ],
  },
  {
    title: "GÓI CƠ BẢN",
    desc: "Tổng quan Vận mệnh, Cá nhân, Sự nghiệp Tiền tài & Tình duyên.",
    stats: "3 MỤC • 16 CHỦ ĐỀ",
    price: "199.000 đ",
    color: "#c37735",
    details: [
      "Luận tổng quan vận mệnh cá nhân.",
      "Phân tích tính cách, sự nghiệp, tài lộc và tình duyên.",
      "Phù hợp cho người mới bắt đầu xem lá số.",
    ],
  },
  {
    title: "GÓI NÂNG CAO",
    desc: "Có thêm Vận hạn năm & Tương tác. Giúp định hướng rõ ràng.",
    stats: "5 MỤC • 24 CHỦ ĐỀ",
    price: "299.000 đ",
    color: "#d46b84",
    details: [
      "Bao gồm nội dung gói cơ bản.",
      "Phân tích vận hạn từng năm.",
      "Gợi ý thời điểm thuận lợi và cần cẩn trọng.",
    ],
  },
  {
    title: "GÓI TRỌN ĐỜI",
    desc: "Giải mã toàn diện lá số, vận hạn trọn đời, chi tiết từng đại vận.",
    stats: "TẤT CẢ CHỦ ĐỀ",
    price: "499.000 đ",
    color: "#7a5c9e",
    details: [
      "Giải mã toàn diện lá số tử vi.",
      "Luận đại vận, tiểu vận và các mốc quan trọng.",
      "Phân tích dài hạn về sự nghiệp, tài lộc, tình duyên, sức khỏe.",
    ],
  },
];

const ComboSection = () => {
  const [selectedCombo, setSelectedCombo] = useState(null);

  return (
  <section id="services" style={{ position: "relative", width: "100%", padding: "6rem 0", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      <img
        src="/background1.jpg"
        alt="combo background"
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(6px)", transform: "scale(1.05)" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "rgba(15, 19, 28, 0.6)" }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${C.background} 0%, transparent 15%, transparent 85%, ${C.background} 100%)` }} />
    </div>

    <div style={{ position: "relative", zIndex: 10, maxWidth: "80rem", margin: "0 auto", padding: "0 2rem" }}>
      <div
        className="combo-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}
      >
        <h2 className="font-headline" style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", color: C.onSurface, fontWeight: 420 }}>
          Combo tiết kiệm
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", color: C.onSurfaceVariant }}>
          <span className="material-symbols-outlined" style={{ cursor: "pointer", fontSize: "1.2rem", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = C.primary} onMouseLeave={e => e.currentTarget.style.color = C.onSurfaceVariant}>arrow_back</span>
          <span style={{ fontSize: "1rem", fontWeight: 500, fontFamily: "'Manrope', sans-serif" }}>4/4</span>
          <span className="material-symbols-outlined" style={{ cursor: "pointer", fontSize: "1.2rem", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = C.primary} onMouseLeave={e => e.currentTarget.style.color = C.onSurfaceVariant}>arrow_forward</span>
        </div>
      </div>

      <div
        className="combo-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}
      >
        {comboData.map((combo, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedCombo(combo)}
            style={{
              background: "#ffffff", border: `1px solid ${combo.color}`,
              borderRadius: "0", padding: "2rem 1.5rem",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              minHeight: "260px", cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 15px 30px -10px ${combo.color}80`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div>
              <h3 style={{ color: combo.color, fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem", fontFamily: "'Manrope', sans-serif" }}>{combo.title}</h3>
              <p style={{ color: "#4a4a4a", fontSize: "0.95rem", lineHeight: 1.6, fontFamily: "'Manrope', sans-serif" }}>{combo.desc}</p>
            </div>
            <div style={{ marginTop: "2.5rem" }}>
              <div style={{ width: "100%", height: "1px", background: "rgba(0,0,0,0.1)", marginBottom: "1.25rem" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Manrope', sans-serif" }}>
                <span style={{ color: combo.color, fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>{combo.stats}</span>
                <span style={{ color: combo.color, fontSize: "1.2rem", fontWeight: 700 }}>{combo.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    {selectedCombo && (
  <div
    onClick={() => setSelectedCombo(null)}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 999,
      background: "rgba(0,0,0,0.68)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: "560px",
        maxHeight: "85vh",
        overflowY: "auto",
        background: C.surfaceContainerHigh,
        border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: "1.5rem",
        padding: "2rem",
        boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
      }}
    >
      <h3
  style={{
    color: "#ffffff",
    fontSize: "2rem",
    fontWeight: 700,
    fontFamily: "'Manrope', sans-serif",
    letterSpacing: "0.02em",
    marginBottom: "1rem",
    textAlign: "center",
  }}
>
        {selectedCombo.title}
      </h3>

      <p
        style={{
          color: C.onSurfaceVariant,
          fontSize: "1.1rem",
          lineHeight: 1.8,
          marginBottom: "1.25rem",
          textAlign: "justify",
        }}
      >
        {selectedCombo.desc}
      </p>

      <div
        style={{
          color: C.primary,
          fontWeight: 700,
          marginBottom: "1rem",
        }}
      >
        {selectedCombo.stats} • {selectedCombo.price}
      </div>

      <ul
        style={{
          paddingLeft: "1.2rem",
          color: C.onSurfaceVariant,
          lineHeight: 1.9,
          fontSize: "1.05rem",
          marginBottom: "1.75rem",
        }}
      >
        {selectedCombo.details.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <div style={{ display: "flex", justifyContent: "center" }}>
  <button
    className="btn-outline"
    onClick={() => setSelectedCombo(null)}
    style={{
      padding: "0.75rem 2rem",
      fontSize: "1rem",
      minWidth: "120px",
    }}
  >
    Đóng
  </button>
</div>
    </div>
  </div>
)}
  </section>
  );
};

/* ─────────────────────── Insights Grid ──────────────────────── */
const insightItems = [
  { icon: "favorite",          title: "Tình duyên", desc: "Luận giải về nhân duyên, tri kỷ và thời điểm rực rỡ nhất trong đời sống tình cảm." },
  { icon: "work",              title: "Sự nghiệp",  desc: "Định hướng công danh, xác định thiên hướng nghề nghiệp và các cột mốc thăng tiến." },
  { icon: "payments",          title: "Tài lộc",    desc: "Phân tích khả năng tích lũy, các cơ hội làm giàu và những lưu ý về tài chính cá nhân." },
  { icon: "health_and_safety", title: "Sức khỏe",   desc: "Dự báo tình trạng thể chất và tinh thần, gợi ý các phương thức cân bằng cuộc sống." },
];

const InsightsSection = () => (
  <section
    className="insights-section"
    style={{
      padding: "6rem 2rem",
      maxWidth: "80rem",
      margin: "0 auto",
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: "4rem",
        gap: "1rem",
      }}
    >
      <div style={{ maxWidth: "42rem" }}>
        <h2
          className="font-headline"
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: "clamp(1.6rem, 4vw, 3.1rem)",
            color: C.onSurface,
            marginBottom: "1rem",
            lineHeight: 1.15,
            fontWeight: 460,
            letterSpacing: "-0.015em",
          }}
        >
          Khám phá bản thân qua các khía cạnh
        </h2>

        <p
          style={{
            color: C.onSurfaceVariant,
            fontWeight: 300,
            lineHeight: 1.85,
            fontSize: "clamp(0.9rem, 1.8vw, 1rem)",
            letterSpacing: "0.01em",
          }}
        >
          Thấu hiểu các mảnh ghép cuộc đời thông qua lăng kính Tử Vi Đẩu Số.
          Mỗi lá số là một hành trình riêng biệt được khắc họa bởi các vì tinh tú.
        </p>
      </div>
    </div>

    <div
      className="insights-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "2rem",
      }}
    >
      {insightItems.map(({ icon, title, desc }) => (
        <div key={title} className="insight-card">
          <div className="glow-spot" />

          <div
            style={{
              background: "rgba(88,61,95,0.3)",
              width: "4rem",
              height: "4rem",
              borderRadius: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.primary,
              fontSize: "2rem",
              marginBottom: "1.5rem",
            }}
          >
            <span className="material-symbols-outlined">{icon}</span>
          </div>

          <h3
            className="font-headline"
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: "1.45rem",
              color: C.onSurface,
              marginBottom: "0.75rem",
              fontWeight: 480,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>

          <p
            style={{
              color: C.onSurfaceVariant,
              fontSize: "1.05rem",
              lineHeight: 1.75,
              fontWeight: 300,
              letterSpacing: "0.005em",
            }}
          >
            {desc}
          </p>
        </div>
      ))}
    </div>
  </section>
);

/* ─────────────────────── 12 Con Giáp ──────────────────────── */
const zodiacData = [
  { name: "Tý",   src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f42d.svg" },
  { name: "Sửu",  src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f42e.svg" },
  { name: "Dần",  src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f42f.svg" },
  { name: "Mão",  src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f431.svg" },
  { name: "Thìn", src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f432.svg" },
  { name: "Tỵ",   src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f40d.svg" },
  { name: "Ngọ",  src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f434.svg" },
  { name: "Mùi",  src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f411.svg" },
  { name: "Thân", src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f435.svg" },
  { name: "Dậu",  src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f414.svg" },
  { name: "Tuất", src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f436.svg" },
  { name: "Hợi",  src: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f437.svg" },
];

const zodiacDetails = {
"Tý": {
title: "Tuổi Tý",
text: "Là con giáp đầu tiên trong chu kỳ 12 con giáp, chuột tượng trưng cho sự khởi đầu mới mẻ, sự thông minh, lanh lợi và khả năng thích nghi tốt. Người tuổi Tý thường rất ham học hỏi, cầu tiến và có ý chí phấn đấu mạnh mẽ. Tuy nhiên, đôi khi họ có thể hơi nóng tính, bướng bỉnh và thiếu kiên nhẫn. \n\nDung mạo người tuổi Tý thường nhanh nhẹn, ánh mắt linh hoạt, gương mặt sáng và biểu cảm thông minh. \n\nNgười tuổi Tý tương hợp với tuổi Thân, Thìn và dễ xung khắc với tuổi Ngọ."
},

"Sửu": {
title: "Tuổi Sửu",
text: "Trong chu kỳ 12 con giáp, trâu tượng trưng cho sự chăm chỉ, kiên trì, nhẫn nại và trung thành. Người tuổi Sửu có trách nhiệm cao, đáng tin cậy và luôn sẵn sàng giúp đỡ người khác. Tuy nhiên họ cũng khá bảo thủ, cố chấp và thiếu linh hoạt. \n\nDung mạo người tuổi Sửu thường chắc chắn, thân hình cân đối, khuôn mặt điềm đạm và tạo cảm giác đáng tin cậy. \n\nTương hợp với tuổi Tỵ, Dậu; dễ xung khắc với tuổi Mùi."
},

"Dần": {
title: "Tuổi Dần",
text: "Người tuổi Dần thường mạnh mẽ, quyết đoán, có khí chất lãnh đạo và thích tự do. Họ tự tin, dám nghĩ dám làm và luôn muốn khẳng định bản thân. Tuy nhiên đôi khi khá nóng nảy và bốc đồng. \n\nDung mạo người tuổi Dần thường có ánh mắt sắc bén, thần thái mạnh mẽ, dáng đi tự tin và dễ tạo cảm giác uy nghiêm. \n\nTương hợp với tuổi Ngọ, Tuất; dễ xung khắc với tuổi Thân."
},

"Mão": {
title: "Tuổi Mão",
text: "Người tuổi Mão thường mềm mỏng, tinh tế, khéo léo trong giao tiếp và biết giữ hòa khí. Họ có trực giác tốt, sống tình cảm và yêu thích cái đẹp. \n\nDung mạo người tuổi Mão thường thanh tú, khuôn mặt hài hòa, ánh mắt hiền lành và tạo cảm giác dễ gần. \n\nTương hợp với tuổi Hợi, Mùi; dễ xung khắc với tuổi Dậu."
},

"Thìn": {
title: "Tuổi Thìn",
text: "Người tuổi Thìn thường có tham vọng lớn, khí chất mạnh mẽ và khả năng lãnh đạo nổi bật. Họ thích thử thách, luôn muốn vươn lên và dễ thu hút sự chú ý của người khác. \n\nDung mạo người tuổi Thìn thường sáng sủa, thần thái tự tin, ánh mắt có sức hút và phong thái nổi bật giữa đám đông. \n\nTương hợp với tuổi Tý, Thân; dễ xung khắc với tuổi Tuất."
},

"Tỵ": {
title: "Tuổi Tỵ",
text: "Người tuổi Tỵ thường thông minh, sâu sắc, kín đáo và có trực giác nhạy bén. Họ thích quan sát, suy nghĩ kỹ trước khi hành động và có khả năng phân tích tốt. \n\nDung mạo người tuổi Tỵ thường thanh mảnh, ánh mắt sắc sảo, gương mặt có nét bí ẩn và cuốn hút. \n\nTương hợp với tuổi Sửu, Dậu; dễ xung khắc với tuổi Hợi."
},

"Ngọ": {
title: "Tuổi Ngọ",
text: "Người tuổi Ngọ thường năng động, nhiệt tình, yêu tự do và thích khám phá những điều mới mẻ. Họ hòa đồng, cởi mở và có khả năng truyền cảm hứng cho người khác. \n\nDung mạo người tuổi Ngọ thường cao ráo, nhanh nhẹn, gương mặt tươi sáng và tràn đầy sức sống. \n\nTương hợp với tuổi Dần, Tuất; dễ xung khắc với tuổi Tý."
},

"Mùi": {
title: "Tuổi Mùi",
text: "Người tuổi Mùi thường hiền hòa, giàu lòng trắc ẩn và sống tình cảm. Họ có óc nghệ thuật, yêu cái đẹp và luôn quan tâm đến cảm xúc của người khác. \n\nDung mạo người tuổi Mùi thường có nét dịu dàng, khuôn mặt phúc hậu, ánh mắt ấm áp và dễ tạo thiện cảm. \n\nTương hợp với tuổi Mão, Hợi; dễ xung khắc với tuổi Sửu."
},

"Thân": {
title: "Tuổi Thân",
text: "Người tuổi Thân thường thông minh, linh hoạt, hoạt ngôn và có khả năng thích nghi nhanh với mọi hoàn cảnh. Họ sáng tạo, hài hước và luôn tìm được cách giải quyết vấn đề. \n\nDung mạo người tuổi Thân thường nhanh nhẹn, ánh mắt lanh lợi, gương mặt sáng và biểu cảm phong phú. \n\nTương hợp với tuổi Tý, Thìn; dễ xung khắc với tuổi Dần."
},

"Dậu": {
title: "Tuổi Dậu",
text: "Người tuổi Dậu thường chỉn chu, thẳng thắn, có tính kỷ luật cao và luôn chú trọng hình ảnh cá nhân. Họ cầu toàn, chăm chỉ và có tinh thần trách nhiệm. \n\nDung mạo người tuổi Dậu thường gọn gàng, sắc nét, phong thái chỉnh chu và gây ấn tượng bởi vẻ ngoài chỉn chu. \n\nTương hợp với tuổi Sửu, Tỵ; dễ xung khắc với tuổi Mão."
},

"Tuất": {
title: "Tuổi Tuất",
text: "Người tuổi Tuất thường trung thành, chính trực và có tinh thần bảo vệ người thân. Họ sống chân thành, đáng tin cậy và luôn giữ lời hứa. \n\nDung mạo người tuổi Tuất thường cương nghị, ánh mắt chân thành, khuôn mặt tạo cảm giác đáng tin tưởng. \n\nTương hợp với tuổi Dần, Ngọ; dễ xung khắc với tuổi Thìn."
},

"Hợi": {
title: "Tuổi Hợi",
text: "Người tuổi Hợi thường phúc hậu, chân thành, sống tình cảm và biết tận hưởng cuộc sống. Họ hòa nhã, rộng lượng và dễ được mọi người yêu mến. \n\nDung mạo người tuổi Hợi thường đầy đặn, gương mặt hiền hòa, nụ cười thân thiện và tạo cảm giác gần gũi. \n\nTương hợp với tuổi Mão, Mùi; dễ xung khắc với tuổi Tỵ."
}
};


const ZodiacSection = () => {
  const [selectedZodiac, setSelectedZodiac] = useState(null);

  return (
    <section id="zodiac" style={{ padding: "6rem 0", background: C.surfaceContainerLowest, position: "relative", overflow: "hidden" }}>
      <div className="celestial-glow" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 2rem", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: "5rem" }}>
          <h2 className="font-headline" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(2.5rem, 4vw, 3.5rem)", color: C.primary, marginBottom: "1.5rem" }}>
            12 con giáp
          </h2>
          <div style={{ width: "6rem", height: "4px", background: C.primaryContainer, borderRadius: "9999px", margin: "0 auto 1.5rem" }} />
          <p style={{ color: C.onSurfaceVariant, maxWidth: "30rem", margin: "0 auto", lineHeight: 1.8 }}>
            Bấm vào từng con giáp để xem luận giải tổng quan về tính cách, khuynh hướng và tương hợp.
          </p>
        </div>

        <div className="zodiac-grid" style={{ marginBottom: "4rem" }}>
          {zodiacData.map(({ name, src }) => (
            <div
              key={name}
              className="zodiac-card"
              onClick={() => setSelectedZodiac({ name, src, ...zodiacDetails[name] })}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <img
                src={src}
                alt={name}
                style={{
                  width: "100%",
                  aspectRatio: "1/1",
                  padding: "0.5rem",
                  objectFit: "contain",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "50%",
                  marginBottom: "1.25rem",
                }}
              />
              <span className="font-headline" style={{ fontSize: "1.15rem", color: C.onSurface }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedZodiac && (
        <div
          onClick={() => setSelectedZodiac(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "85vh",
              overflowY: "auto",
              background: C.surfaceContainerHigh,
              border: `1px solid rgba(237,177,255,0.35)`,
              borderRadius: "1.5rem",
              padding: "2rem",
              boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
              textAlign: "center",
            }}
          >
            <div
            className="zodiac-modal-header"
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
  }}
>
  <img
    src={selectedZodiac.src}
    alt={selectedZodiac.name}
    style={{
      width: "80px",
      height: "80px",
      objectFit: "contain",
    }}
  />

  <h3
    className="font-headline"
    style={{
      fontFamily: "Cormorant Garamond, serif",
      fontSize: "clamp(1.8rem, 6vw, 3rem)",
      color: C.primary,
      margin: 0,
      lineHeight: 1,
      fontWeight: 600,
    }}
  >
    {selectedZodiac.title}
  </h3>
</div>

            <p
            className="zodiac-modal-text"
              style={{
                color: C.onSurfaceVariant,
                lineHeight: 1.9,
                fontSize: "1.15rem",
                marginBottom: "1.75rem",
                textAlign: "justify",
                whiteSpace: "pre-line",
              }}
>
  {selectedZodiac.text}
</p>

            <button
              className="btn-outline"
              onClick={() => setSelectedZodiac(null)}
              style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

/* ─────────────────────── Footer ──────────────────────── */
const Footer = () => {
  const navigate = useNavigate();

  const serviceLinks = [
    { label: "Tra cứu",       to: "/" },
    { label: "Dịch vụ",       to: "services" },
    { label: "Chatbot",       to: "/chatbot" },
    { label: "14 Chính tinh", to: "/major-stars" },
  ];

  const infoLinks = [
    { label: "12 con giáp", to: "zodiac" },
    { label: "Về YinYang",  to: "/" },
    { label: "Điều khoản",  to: "/" },
  ];

  return (
    <footer
      style={{
        width: "100%", padding: "4rem 2rem",
        background: C.surfaceContainerLowest,
        fontFamily: "'Manrope', sans-serif",
        color: C.onSurfaceVariant,
        borderTop: `1px solid rgba(77,67,81,0.15)`,
      }}
    >
      <div
        className="footer-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr",
          gap: "3rem",
          maxWidth: "80rem",
          margin: "0 auto",
        }}
      >
        <div id="contact" className="footer-brand">
          <div
            className="footer-logo-wrap"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.8rem",
            }}
          >
            <img src="/favicon3.png" alt="YinYang Logo" style={{ width: "52px", height: "52px", objectFit: "contain" }} />
            <div style={{ fontFamily: "Cinzel, serif", fontSize: "2.5rem", color: C.onSurface, lineHeight: 1 }}>
              YinYang
            </div>
          </div>

          <div className="footer-social" style={{ display: "flex", gap: "1rem"}}>
            {["alternate_email", "share"].map((icon) => (
              <a
                key={icon}
                href="mailto:contact@yinyang.io.vn"
                style={{
                  background: C.surfaceContainer, width: "3.5rem", height: "3.5rem",
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.onSurfaceVariant, fontSize: "1rem", textDecoration: "none", transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.primaryContainer)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.surfaceContainer)}
              >
                <span className="material-symbols-outlined">{icon}</span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ color: C.primary, fontWeight: 700, marginBottom: "1.5rem" }}>Dịch vụ</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {serviceLinks.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  className="footer-link"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
                  onClick={() => {
                    if (item.to === "services") {
                      const el = document.getElementById("services");
                      if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
                    } else { navigate(item.to); }
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ color: C.primary, fontWeight: 700, marginBottom: "1.5rem" }}>Thông tin</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {infoLinks.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  className="footer-link"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
                  onClick={() => {
                    if (item.to === "zodiac") {
                      const el = document.getElementById("zodiac");
                      if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
                    } else { navigate(item.to); }
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{
        maxWidth: "80rem", margin: "4rem auto 0", paddingTop: "2rem",
        borderTop: `1px solid rgba(77,67,81,0.1)`,
        textAlign: "center", opacity: 0.4, fontSize: "0.75rem",
      }}>
        © 2024 YinYang Astrology. All rights reserved.
      </div>
    </footer>
  );
};

/* ─────────────────────── Daily horoscope banner ── */
const DailyBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <div
      onClick={() => navigate("/daily-horoscope")}
      style={{
        position: "fixed", top: "5.25rem", left: 0, right: 0, zIndex: 40,
        background: "linear-gradient(90deg, rgba(109,32,140,0.85) 0%, rgba(237,177,255,0.15) 100%)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(237,177,255,0.15)",
        padding: "0.5rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "0.6rem", cursor: "pointer", transition: "opacity .2s",
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      <span style={{ fontSize: "1rem" }}>🔮</span>
      <span style={{ fontSize: "0.85rem", color: "#edb1ff", fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}>
        Tử vi hôm nay của bạn đã sẵn sàng
      </span>
      <span style={{ fontSize: "0.75rem", color: "rgba(237,177,255,0.65)", fontFamily: "'Manrope', sans-serif", marginLeft: 4 }}>
        → Xem ngay
      </span>
    </div>
  );
};

/* ─────────────────────── HomePage ──────────────────────── */
export default function HomePage() {
  const { user } = useAuth();
  useSEO({
    title: "Lá Số Tử Vi Online Miễn Phí | YinYang",
    description: "Xem lá số tử vi online miễn phí, chính xác theo tử vi Đẩu Số. Tra cứu sao chiếu mệnh, tử vi hàng ngày, nhật ký vận mệnh. Đăng ký ngay!",
    canonical: "https://yinyang.io.vn/",
  });
  return (
    <>
      <FontLoader />
      <div style={{ background: C.background, minHeight: "100vh" }}>
        <Header />
        <DailyBanner />
        <main style={{ paddingTop: user ? "7.75rem" : "5.25rem" }}>
          <HeroSection />
          <ComboSection />
          <InsightsSection />
          <ZodiacSection />
        </main>
        <Footer />
      </div>
    </>
  );
}