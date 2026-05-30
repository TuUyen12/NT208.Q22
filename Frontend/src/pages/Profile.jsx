import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import { GlobalStyles, Background, C } from "./Login";
import NotificationBell from "../components/NotificationBell";

const NAV_ITEMS = [
  { label: "Trang chủ", to: "/" },
  { label: "Lá số", to: "/la-so" },
  { label: "Tử vi ngày", to: "/horoscope" },
  { label: "Nhật ký", to: "/journal" },
];

function NavBar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <nav style={{
      position: "fixed", top: 0, width: "100%", zIndex: 50,
      background: "rgba(15,19,28,.85)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(77,67,81,.12)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0.65rem 1.5rem", maxWidth: "1200px", margin: "0 auto",
      }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flexShrink: 0 }}>
          <img src="/favicon3.png" alt="logo" style={{ width: "38px", height: "38px", objectFit: "contain" }} />
          <div className="font-headline" style={{ fontFamily: "Cinzel, serif", fontSize: "1.65rem", color: C.onSurface }}>YinYang</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.15rem" }}>
          {NAV_ITEMS.map(({ label, to }) => (
            <span key={to} onClick={() => navigate(to)} style={{ fontSize: "0.8rem", color: C.onSurfaceVariant, cursor: "pointer", whiteSpace: "nowrap" }}
              onMouseEnter={e => e.currentTarget.style.color = C.primary}
              onMouseLeave={e => e.currentTarget.style.color = C.onSurfaceVariant}
            >{label}</span>
          ))}
          <NotificationBell />
          <button onClick={logout} style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", background: "transparent", border: `1px solid ${C.primary}`, color: C.primary, borderRadius: "8px", cursor: "pointer" }}>
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: "rgba(255,255,255,.04)", border: "1px solid rgba(237,177,255,.1)",
      borderRadius: "1rem", padding: "1.5rem",
    }}>
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
        <NavBar />

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

              {/* Đổi mật khẩu — chỉ hiện nếu tài khoản có password */}
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
