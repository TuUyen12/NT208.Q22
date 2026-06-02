import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { C, GlobalStyles, Background, Header, Field } from "./Login";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch {
      // Still show success — never reveal if email exists
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", background: C.bg, position: "relative" }}>
        <Background />
        <Header />

        <main style={{
          position: "relative", zIndex: 10,
          minHeight: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "88px 24px 48px",
        }}>
          <div className="glass fade-up" style={{
            width: "100%", maxWidth: 420,
            borderRadius: 28,
            border: `1px solid rgba(77,67,81,.18)`,
            boxShadow: "0 48px 120px rgba(0,0,0,.55), 0 0 80px rgba(109,32,140,.12)",
            overflow: "hidden",
          }}>
            <div className="card-pad" style={{ padding: "2.5rem 2.25rem" }}>

              {/* Header */}
              <div className="fade-up-1" style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
                  background: "rgba(88,61,95,.35)", border: `1px solid rgba(237,177,255,.2)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span className="mso" style={{ fontSize: 24, color: C.primary }}>lock_reset</span>
                </div>
                <div className="hn" style={{ fontSize: "1.6rem", fontWeight: 700, color: C.primary, marginBottom: 6 }}>
                  Quên mật khẩu
                </div>
                <p style={{ color: C.onSurfaceVariant, fontSize: 13.5, opacity: .78, lineHeight: 1.55 }}>
                  Nhập email của bạn để nhận link đặt lại mật khẩu
                </p>
              </div>

              {sent ? (
                /* Success state */
                <div className="fade-up-1" style={{ textAlign: "center" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
                    background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="mso" style={{ fontSize: 26, color: "#4ade80" }}>mark_email_read</span>
                  </div>
                  <div style={{ fontSize: 15, color: C.onSurface, fontWeight: 600, marginBottom: 10 }}>
                    Kiểm tra hộp thư của bạn
                  </div>
                  <p style={{ fontSize: 13.5, color: C.onSurfaceVariant, lineHeight: 1.65, marginBottom: 24 }}>
                    Nếu email <b style={{ color: C.primary }}>{email}</b> tồn tại trong hệ thống,
                    bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
                    <br /><br />
                    Link có hiệu lực trong <b style={{ color: C.primary }}>15 phút</b>.
                  </p>
                  <button className="btn-soc" onClick={() => navigate("/login")}>
                    <span className="mso" style={{ fontSize: 16 }}>arrow_back</span>
                    Quay lại đăng nhập
                  </button>
                </div>
              ) : (
                /* Form state */
                <>
                  <div className="fade-up-2" style={{ marginBottom: "1.25rem" }}>
                    <Field label="Email" icon="alternate_email" error={error}>
                      <input
                        className={`inp${error ? " err" : ""}`}
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        autoComplete="email"
                        autoFocus
                        onChange={e => { setEmail(e.target.value); setError(""); }}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                      />
                    </Field>
                  </div>

                  <button
                    className="btn-pri fade-up-3"
                    disabled={loading}
                    onClick={handleSubmit}
                    style={{ marginBottom: "1.25rem" }}
                  >
                    {loading ? (
                      <><div className="spinner" /> Đang gửi...</>
                    ) : (
                      <><span className="mso" style={{ fontSize: 17 }}>send</span> Gửi link đặt lại</>
                    )}
                  </button>

                  <button
                    className="btn-ghost"
                    style={{ display: "block", margin: "0 auto", fontSize: 13 }}
                    onClick={() => navigate("/login")}
                  >
                    ← Quay lại đăng nhập
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
