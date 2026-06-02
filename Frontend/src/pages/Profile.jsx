import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import { GlobalStyles, Background, C } from "./Login";
import NotificationBell from "../components/NotificationBell";

/* ═════════════════ Header giống Home ══════════════ */
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Trang chủ", to: "/", activePath: "/" },
    { label: "Dịch vụ", to: "services", activePath: null },
    { label: "Lá số", to: "/la-so", activePath: "/la-so" },
    { label: "Tử vi hôm nay", to: "/daily-horoscope", activePath: "/daily-horoscope" },
    { label: "Nhật ký", to: "/journal", activePath: "/journal" },
    { label: "Chatbot", to: "/chatbot", activePath: "/chatbot" },
    { label: "14 Chính tinh", to: "/major-stars", activePath: "/major-stars" },
    { label: "12 con giáp", to: "zodiac", activePath: null },
    { label: "Liên hệ", to: "contact", activePath: null },
  ];

  const handleNav = (item) => {
    if (["contact", "services", "zodiac"].includes(item.to)) {
      const scrollToSection = () => {
        const el = document.getElementById(item.to);
        if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
      };
      if (location.pathname !== "/") {
        navigate("/");
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
    <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, background: "rgba(15,19,28,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 1px 0 rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem clamp(1rem, 4vw, 1.5rem)", maxWidth: "80rem", margin: "0 auto", gap: "1rem" }}>
        {/* Logo */}
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flexShrink: 0 }}>
          <img src="/favicon3.png" alt="logo" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
          <span style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(1.1rem, 3vw, 1.65rem)", color: C.onSurface, lineHeight: 1 }}>YinYang</span>
        </div>

        {/* Desktop nav */}
        <div className="hp-desktop-nav" style={{ display: "flex", gap: "clamp(0.6rem, 1.2vw, 1.15rem)", alignItems: "center", flex: 1, justifyContent: "center" }}>
          {navItems.map(item => {
            const isActive = item.activePath && location.pathname === item.activePath;
            return (
              <span key={item.label} className="nav-link" style={{ cursor: "pointer", fontWeight: isActive ? 700 : 400, color: isActive ? C.primary : C.onSurfaceVariant, fontSize: "clamp(0.68rem, 1vw, 0.8rem)" }} onClick={() => handleNav(item)}>
                {item.label}
              </span>
            );
          })}
        </div>

        {/* Desktop user */}
        {user ? (
          <div className="hp-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
            <NotificationBell />
            <div onClick={() => navigate("/profile")} title={user.full_name || user.email} style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg,#edb1ff,#6d208c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#111", cursor: "pointer" }}>
              {userInitials}
            </div>
            <button className="btn-outline" style={{ padding: "0.4rem 1rem", fontSize: "0.78rem", fontFamily: "'Manrope', sans-serif" }} onClick={logout}>Đăng xuất</button>
          </div>
        ) : (
          <button className="btn-outline hp-desktop-nav" style={{ padding: "0.45rem 1.25rem", fontSize: "0.85rem", fontFamily: "'Manrope', sans-serif", flexShrink: 0 }} onClick={() => navigate("/")}>
            <span className="mso" style={{ fontSize: 16, marginRight: 4 }}>arrow_back</span> Trang chủ
          </button>
        )}

        {/* Hamburger */}
        <button className="hp-mobile-btn" onClick={() => setMobileOpen(o => !o)} style={{ background: "none", border: "none", color: C.onSurface, fontSize: "1.6rem", cursor: "pointer", lineHeight: 1, padding: "4px", flexShrink: 0 }} aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}>
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{ background: "rgba(15,19,28,0.98)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <span style={{ fontSize: "11px", color: "rgba(237,177,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>Điều hướng</span>

          {navItems.map(item => {
            const isActive = item.activePath && location.pathname === item.activePath;
            return (
              <span key={item.label} style={{ cursor: "pointer", color: isActive ? C.primary : C.onSurfaceVariant, fontWeight: isActive ? 700 : 400, fontSize: "0.9rem", fontFamily: "'Manrope', sans-serif" }} onClick={() => handleNav(item)}>
                {item.label}
              </span>
            );
          })}

          {/* User row */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {user ? (
              <>
                <div onClick={() => { navigate("/profile"); setMobileOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, cursor: "pointer", minWidth: 0 }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { navigate("/profile"); setMobileOpen(false); } }} aria-label="Trang cá nhân">
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#edb1ff,#6d208c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#111", flexShrink: 0 }}>
                    {userInitials}
                  </div>
                  <span style={{ color: C.onSurfaceVariant, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.full_name || user.email}
                  </span>
                </div>
                <button className="btn-outline" style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem", fontFamily: "'Manrope', sans-serif" }} onClick={() => { logout(); setMobileOpen(false); }}>Đăng xuất</button>
              </>
            ) : (
              <button className="btn-outline" style={{ width: "100%", padding: "0.6rem", fontSize: "0.9rem", fontFamily: "'Manrope', sans-serif" }} onClick={() => { navigate("/"); setMobileOpen(false); }}>
                <span className="mso" style={{ fontSize: 16, marginRight: 4 }}>arrow_back</span> Trang chủ
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

/* ═════════════════ Các phần còn lại giữ nguyên ══════════════ */
function Section({ title, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(237,177,255,.1)", borderRadius: "1rem", padding: "1.5rem" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: C.primary, marginBottom: "1.25rem" }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.78rem", color: C.onSurfaceVariant, marginBottom: "0.35rem" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "0.6rem 0.9rem", borderRadius: "0.5rem",
  background: "rgba(255,255,255,.06)", border: "1px solid rgba(237,177,255,.2)",
  color: C.onSurface, fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
};

function SaveButton({ loading, label = "Lưu thay đổi" }) {
  return (
    <button type="submit" disabled={loading} style={{
      padding: "0.55rem 1.5rem", borderRadius: "0.5rem", border: "none",
      background: loading ? "rgba(237,177,255,.3)" : "linear-gradient(135deg,#edb1ff,#6d208c)",
      color: "#111", fontWeight: 600, fontSize: "0.875rem", cursor: loading ? "not-allowed" : "pointer",
    }}>
      {loading ? "Đang lưu…" : label}
    </button>
  );
}

function Toast({ msg, ok }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 200,
      padding: "0.75rem 1.25rem", borderRadius: "0.6rem",
      background: ok ? "rgba(100,220,120,.15)" : "rgba(255,100,100,.15)",
      border: `1px solid ${ok ? "rgba(100,220,120,.4)" : "rgba(255,100,100,.4)"}`,
      color: ok ? "#7dffaa" : "#ff9090", fontSize: "0.875rem",
    }}>{msg}</div>
  );
}

const CHANNELS = [
  { value: "email", label: "Email" },
  { value: "push", label: "Push notification" },
  { value: "both", label: "Cả hai" },
];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [channel, setChannel] = useState(user?.notify_channel || "email");
  const [savingInfo, setSavingInfo] = useState(false);

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [toast, setToast] = useState({ msg: "", ok: true });

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 3000);
  }

  async function handleSaveInfo(e) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const updated = await authService.updateProfile({
        full_name: fullName || null,
        notify_channel: channel,
      });
      updateUser(updated);
      showToast("Đã cập nhật thông tin");
    } catch {
      showToast("Có lỗi xảy ra, thử lại sau", false);
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPwd !== confirmPwd) { showToast("Mật khẩu mới không khớp", false); return; }
    if (newPwd.length < 8) { showToast("Mật khẩu tối thiểu 8 ký tự", false); return; }
    setSavingPwd(true);
    try {
      await authService.changePassword(curPwd, newPwd);
      setCurPwd(""); setNewPwd(""); setConfirmPwd("");
      showToast("Đã đổi mật khẩu thành công");
    } catch (err) {
      const detail = err?.response?.data?.detail || "Có lỗi xảy ra";
      showToast(detail, false);
    } finally {
      setSavingPwd(false);
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      await authService.deleteMe();
      logout();
      navigate("/");
    } catch {
      showToast("Không thể xoá tài khoản, thử lại sau", false);
      setDeletingAccount(false);
    }
  }

  const initials = (user?.full_name || user?.email || "?")
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", background: C.bg, position: "relative" }}>
        <Background />
        <Header />

        <main style={{ position: "relative", zIndex: 10, paddingTop: "80px", paddingBottom: "3rem" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 1.5rem" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem" }}>
              <div style={{
                width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#edb1ff,#6d208c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", fontWeight: 700, color: "#111",
              }}>{initials}</div>
              <div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: C.onSurface }}>{user?.full_name || "Chưa đặt tên"}</div>
                <div style={{ fontSize: "0.82rem", color: C.onSurfaceVariant, marginTop: "0.2rem" }}>{user?.email}</div>
                <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: C.onSurfaceVariant }}>Tham gia: <b style={{ color: C.onSurface }}>{formatDate(user?.created_at)}</b></span>
                  <span style={{ fontSize: "0.75rem", color: C.onSurfaceVariant }}>Streak: <b style={{ color: C.primary }}>{user?.streak_count ?? 0} ngày</b></span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Thông tin cá nhân */}
              <Section title="Thông tin cá nhân">
                <form onSubmit={handleSaveInfo}>
                  <Field label="Họ và tên">
                    <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nhập họ và tên" />
                  </Field>
                  <Field label="Email">
                    <input style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} value={user?.email || ""} readOnly />
                  </Field>
                  <Field label="Kênh thông báo sao lưu">
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      {CHANNELS.map(({ value, label }) => (
                        <label key={value} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.875rem", color: channel === value ? C.primary : C.onSurfaceVariant }}>
                          <input type="radio" name="channel" value={value} checked={channel === value} onChange={() => setChannel(value)} style={{ accentColor: C.primary }} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </Field>
                  <SaveButton loading={savingInfo} />
                </form>
              </Section>

              {/* Đổi mật khẩu */}
              {user?.has_password && (
                <Section title="Đổi mật khẩu">
                  <form onSubmit={handleChangePassword}>
                    <Field label="Mật khẩu hiện tại">
                      <input type="password" style={inputStyle} value={curPwd} onChange={e => setCurPwd(e.target.value)} placeholder="••••••••" required />
                    </Field>
                    <Field label="Mật khẩu mới">
                      <input type="password" style={inputStyle} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Tối thiểu 8 ký tự" required />
                    </Field>
                    <Field label="Xác nhận mật khẩu mới">
                      <input type="password" style={inputStyle} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Nhập lại mật khẩu mới" required />
                    </Field>
                    <SaveButton loading={savingPwd} label="Đổi mật khẩu" />
                  </form>
                </Section>
              )}

              {/* Danger zone */}
              <Section title="Vùng nguy hiểm">
                <p style={{ fontSize: "0.82rem", color: C.onSurfaceVariant, marginBottom: "1rem", lineHeight: 1.6 }}>
                  Xoá tài khoản sẽ xoá toàn bộ dữ liệu của bạn (lá số, nhật ký, ghi chú) trong vòng 30 ngày. Hành động này không thể hoàn tác.
                </p>
                {!showDeleteConfirm ? (
                  <button onClick={() => setShowDeleteConfirm(true)} style={{
                    padding: "0.55rem 1.25rem", borderRadius: "0.5rem",
                    background: "transparent", border: "1px solid rgba(255,100,100,.4)",
                    color: "#ff9090", fontSize: "0.875rem", cursor: "pointer", fontWeight: 600,
                  }}>Xoá tài khoản</button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.82rem", color: "#ff9090" }}>Bạn chắc chắn muốn xoá?</span>
                    <button onClick={handleDeleteAccount} disabled={deletingAccount} style={{
                      padding: "0.5rem 1.1rem", borderRadius: "0.5rem", border: "none",
                      background: "rgba(255,80,80,.8)", color: "#fff", fontWeight: 700,
                      fontSize: "0.85rem", cursor: "pointer",
                    }}>{deletingAccount ? "Đang xoá…" : "Xác nhận xoá"}</button>
                    <button onClick={() => setShowDeleteConfirm(false)} style={{
                      padding: "0.5rem 1.1rem", borderRadius: "0.5rem",
                      background: "transparent", border: "1px solid rgba(255,255,255,.2)",
                      color: C.onSurfaceVariant, fontSize: "0.85rem", cursor: "pointer",
                    }}>Huỷ</button>
                  </div>
                )}
              </Section>

            </div>
          </div>
        </main>
      </div>
      <Toast msg={toast.msg} ok={toast.ok} />
    </>
  );
}