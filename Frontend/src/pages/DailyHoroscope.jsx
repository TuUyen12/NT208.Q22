import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../config/api";
import NotificationBell from "../components/NotificationBell";

/* ─────────── Design tokens ─────────── */
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

/* ─────────── Global styles ─────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cinzel&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
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
    .inp {
      width: 100%;
      background: ${C.surfaceLowest};
      border: 1.5px solid transparent;
      border-radius: 12px;
      padding: 13px 14px;
      font-family: 'Manrope', sans-serif;
      font-size: 15px;
      color: ${C.onSurface};
      outline: none;
      transition: border-color .22s, box-shadow .22s;
      color-scheme: dark;
    }
    .inp::placeholder { color: rgba(208,194,211,.38); }
    .inp:focus {
      border-color: rgba(237,177,255,.4);
      box-shadow: 0 0 0 3px rgba(237,177,255,.10);
    }
    .btn-pri {
      width: 100%;
      background: linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%);
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 15px;
      font-family: 'Manrope', sans-serif;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: .04em;
      cursor: pointer;
      transition: box-shadow .3s, transform .15s, opacity .2s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-pri:hover { box-shadow: 0 0 40px -6px rgba(237,177,255,.42); }
    .btn-pri:active { transform: scale(.98); }
    .btn-pri:disabled { opacity: .5; cursor: not-allowed; transform: none; }

    .btn-soc {
      width: 100%;
      background: ${C.surfaceLow};
      border: 1.5px solid rgba(77,67,81,.3);
      border-radius: 12px;
      padding: 12px 16px;
      font-family: 'Manrope', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: ${C.onSurfaceVariant};
      cursor: pointer;
      display: flex; align-items: center; justify-content: flex-start; gap: 10px;
      transition: background .2s, border-color .2s;
    }
    .btn-soc:hover {
      background: ${C.surfaceHigh};
      border-color: rgba(237,177,255,.22);
    }

    /* ── Header responsive (giống home) ── */
    .hp-mobile-btn { display: none; }
    @media (max-width: 900px) {
      .hp-desktop-nav { display: none !important; }
      .hp-mobile-btn  { display: block !important; }
    }

    .nav-link {
      color: ${C.onSurfaceVariant}; font-family: 'Manrope', sans-serif;
      font-size: 0.8rem; text-decoration: none; transition: color 0.3s;
      white-space: nowrap;
      background: none; border: none; cursor: pointer;
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

    /* ── Chatbot grid responsive ── */
    .chatbot-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 1.75rem;
    }
    @media (max-width: 800px) {
      .chatbot-grid {
        grid-template-columns: 1fr;
      }
    }

    /* ── Spinner ── */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,.25);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }

    /* ── Background orbs and stars ── */
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

/* ─────────── Background particles ─────────── */
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

/* ─────────── Header giống hệt Home ─────────── */
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Tra cứu",       to: "/",               activePath: "/" },
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
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flexShrink: 0 }}>
          <img src="/favicon3.png" alt="logo" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
          <span style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(1.1rem, 3vw, 1.65rem)", color: C.onSurface, lineHeight: 1 }}>
            YinYang
          </span>
        </div>

        <div className="hp-desktop-nav" style={{ display: "flex", gap: "clamp(0.6rem, 1.2vw, 1.15rem)", alignItems: "center", flex: 1, justifyContent: "center" }}>
          {navItems.map(item => {
            const isActive = item.activePath && location.pathname === item.activePath;
            return (
              <button
                key={item.label}
                className="nav-link"
                style={{
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? C.primary : C.onSurfaceVariant,
                  fontSize: "clamp(0.68rem, 1vw, 0.8rem)",
                }}
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
              style={{ padding: "0.4rem 1rem", fontSize: "0.78rem" }}
              onClick={logout}
            >
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
        <div style={{
          background: "rgba(15,19,28,0.98)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "1rem 1.25rem",
          display: "flex", flexDirection: "column", gap: "0.85rem",
        }}>
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
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#edb1ff,#6d208c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#111", flexShrink: 0 }}>
                  {userInitials}
                </div>
                <span style={{ color: C.onSurfaceVariant, fontSize: "0.82rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.full_name || user.email}
                </span>
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

/* ─────────── Nội dung chatbot ─────────── */
const INITIAL_AI_TEXT = "Xin chào! Tôi là chuyên gia Tử Vi của YinYang. Bạn muốn hỏi về điều gì hôm nay?";

const suggestions = [
  "Vận mệnh năm 2026",
  "Sự nghiệp trong 6 tháng tới",
  "Tình duyên và hôn nhân",
  "Lá số hợp tuổi kết hôn",
];

export default function Chatbot() {
  const [messages, setMessages] = useState([{ from: "ai", text: INITIAL_AI_TEXT }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildHistory = (msgs) =>
    msgs
      .slice(0, -1)
      .filter(m => m.from !== "thinking")
      .map(m => ({ role: m.from === "ai" ? "model" : "user", text: m.text }));

  const sendText = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { from: "user", text };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { from: "thinking", text: "..." }]);
    setInput("");
    setLoading(true);

    try {
      const result = await api.post("/api/v1/chat/", {
        message: text,
        history: buildHistory(nextMessages),
      });
      setMessages([...nextMessages, { from: "ai", text: result.reply }]);
    } catch {
      setMessages([...nextMessages, { from: "ai", text: "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại." }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => sendText(input.trim());

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", position: "relative", background: C.bg }}>
        <Background />
        <Header />

        <main style={{ position: "relative", zIndex: 10, minHeight: "100vh", padding: "100px 24px 48px" }}>
          <div className="chatbot-grid" style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* Left panel – gợi ý */}
            <section className="glass" style={{ padding: "2rem", borderRadius: 28, border: "1px solid rgba(77,67,81,.18)" }}>
              <h2 style={{ color: C.primary, marginBottom: "1.25rem", fontFamily: "'Manrope', sans-serif" }}>Chatbot AI</h2>
              <p style={{ fontFamily: "Manrope, sans-serif", color: C.onSurfaceVariant, lineHeight: 1.8, marginBottom: "1.5rem" }}>
                Đặt câu hỏi nhanh và nhận phản hồi tức thì. Sử dụng gợi ý bên dưới để bắt đầu hoặc xem lại lịch sử trò chuyện.
              </p>
              <div style={{ display: "grid", gap: "0.85rem", marginBottom: "1.5rem" }}>
                {suggestions.map(text => (
                  <button
                    key={text}
                    className="btn-soc"
                    style={{ justifyContent: "flex-start", color: C.primary, borderColor: "rgba(237,177,255,.25)", fontWeight: 600 }}
                    onClick={() => sendText(text)}
                    disabled={loading}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </section>

            {/* Right panel – hội thoại */}
            <section className="glass" style={{ display: "flex", flexDirection: "column", height: "100%", borderRadius: 28, border: "1px solid rgba(77,67,81,.18)" }}>
              <div style={{ padding: "1.5rem 1.75rem", borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 700, color: C.onSurface }}>Giao diện nhắn tin AI</div>
                  <div style={{ fontFamily: "Manrope, sans-serif", color: C.onSurfaceVariant, fontSize: 13, marginTop: 6 }}>Trò chuyện nhanh, xem lịch sử và khám phá câu trả lời chuyên sâu.</div>
                </div>
                <span className="mso" style={{ fontSize: 22, color: C.primary }}>chat</span>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "1.4rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem", minHeight: 400 }}>
                {messages.map((message, index) => (
                  <div key={index} style={{ display: "flex", justifyContent: message.from === "ai" || message.from === "thinking" ? "flex-start" : "flex-end" }}>
                    <div style={{
                      maxWidth: "82%",
                      padding: "1rem 1.15rem",
                      borderRadius: 20,
                      background: message.from === "user" ? C.primary : C.surfaceLow,
                      color: message.from === "user" ? "#111" : C.onSurface,
                      boxShadow: "0 18px 40px rgba(0,0,0,.12)",
                      opacity: message.from === "thinking" ? 0.5 : 1,
                    }}>
                      <div style={{ fontSize: 13.5, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{message.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding: "1.25rem 1.75rem", borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input
                  className="inp"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                  placeholder="Nhập câu hỏi của bạn..."
                  style={{ flex: 1, margin: 0 }}
                  disabled={loading}
                />
                <button className="btn-pri" onClick={sendMessage} disabled={loading} style={{ width: 140, padding: "0.9rem 1rem" }}>
                  {loading ? "Đang gửi..." : "Gửi"}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}