import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/authService";
import { C, GlobalStyles, Background, Header, Field, StrengthMeter } from "./Login";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [pw, setPw]           = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  const validate = () => {
    const e = {};
    if (!pw)           e.pw = "Vui lòng nhập mật khẩu mới.";
    else if (pw.length < 8) e.pw = "Mật khẩu tối thiểu 8 ký tự.";
    if (pw !== confirm) e.confirm = "Mật khẩu xác nhận không khớp.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setErrors({});
    setLoading(true);
    try {
      await authService.resetPassword(token, pw);
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setErrors({ general: err.message || "Token không hợp lệ hoặc đã hết hạn." });
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
                  <span className="mso" style={{ fontSize: 24, color: C.primary }}>key</span>
                </div>
                <div className="hn" style={{ fontSize: "1.6rem", fontWeight: 700, color: C.primary, marginBottom: 6 }}>
                  Đặt lại mật khẩu
                </div>
                <p style={{ color: C.onSurfaceVariant, fontSize: 13.5, opacity: .78, lineHeight: 1.55 }}>
                  Tạo mật khẩu mới cho tài khoản của bạn
                </p>
              </div>

              {done ? (
                /* Success */
                <div className="fade-up-1" style={{ textAlign: "center" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
                    background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="mso" style={{ fontSize: 26, color: "#4ade80" }}>check_circle</span>
                  </div>
                  <div style={{ fontSize: 15, color: C.onSurface, fontWeight: 600, marginBottom: 10 }}>
                    Mật khẩu đã được đặt lại!
                  </div>
                  <p style={{ fontSize: 13.5, color: C.onSurfaceVariant, lineHeight: 1.65 }}>
                    Đang chuyển hướng về trang đăng nhập...
                  </p>
                </div>
              ) : (
                /* Form */
                <>
                  <div className="fade-up-2" style={{ marginBottom: "1.1rem" }}>
                    <Field label="Mật khẩu mới" icon="lock" error={errors.pw}>
                      <input
                        className={`inp${errors.pw ? " err" : ""}`}
                        type={showPw ? "text" : "password"}
                        placeholder="Tối thiểu 8 ký tự"
                        value={pw}
                        autoComplete="new-password"
                        autoFocus
                        style={{ paddingRight: 44 }}
                        onChange={e => { setPw(e.target.value); setErrors(p => ({ ...p, pw: "" })); }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        style={{
                          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer",
                          color: C.onSurfaceVariant, opacity: .55, padding: 0, lineHeight: 1,
                        }}
                      >
                        <span className="mso" style={{ fontSize: 18 }}>
                          {showPw ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </Field>
                    <StrengthMeter password={pw} />
                  </div>

                  <div className="fade-up-2" style={{ marginBottom: "1.5rem" }}>
                    <Field label="Xác nhận mật khẩu" icon="lock_outline" error={errors.confirm}>
                      <input
                        className={`inp${errors.confirm ? " err" : ""}`}
                        type={showPw ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        value={confirm}
                        autoComplete="new-password"
                        onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: "" })); }}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                      />
                    </Field>
                  </div>

                  {errors.general && (
                    <div style={{ color: C.error, fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="mso" style={{ fontSize: 15 }}>error</span>
                      {errors.general}
                    </div>
                  )}

                  <button
                    className="btn-pri fade-up-3"
                    disabled={loading}
                    onClick={handleSubmit}
                    style={{ marginBottom: "1.25rem" }}
                  >
                    {loading ? (
                      <><div className="spinner" /> Đang lưu...</>
                    ) : (
                      <><span className="mso" style={{ fontSize: 17 }}>check</span> Đặt lại mật khẩu</>
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
