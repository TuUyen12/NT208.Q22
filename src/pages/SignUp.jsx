import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { C, GlobalStyles, Background, Header, Field, StrengthMeter, LeftPanel } from "./Login";

/* ════════════════════════════════════════════════
   SIGNUP CARD
════════════════════════════════════════════════ */
const SignupCard = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const btnRef = useRef(null);

  const validate = () => {
    const e = {};

    if (!name.trim()) e.name = "Vui lòng nhập tên.";

    if (!email.trim()) e.email = "Vui lòng nhập email.";
    else if (!/\S+@\S+\.\S+/.test(email))
      e.email = "Email không hợp lệ.";

    if (!pw) e.pw = "Vui lòng nhập mật khẩu.";
    else if (pw.length < 6)
      e.pw = "Mật khẩu tối thiểu 6 ký tự.";

    if (!confirmPw) e.confirmPw = "Vui lòng xác nhận mật khẩu.";
    else if (confirmPw !== pw)
      e.confirmPw = "Mật khẩu không khớp.";

    return e;
  };

  const handleSignup = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setErrors({});
    setLoading(true);

    await new Promise(r => setTimeout(r, 1500));

    setLoading(false);
    setSuccess(true);

    btnRef.current?.classList.add("pulse");

    setTimeout(() => {
      setSuccess(false);
      btnRef.current?.classList.remove("pulse");

      // 👉 chuyển sang login sau khi đăng ký
      navigate("/login");
    }, 2000);
  };

  return (
    <div className="glass fade-up" style={{
      width:"100%", maxWidth:430,
      borderRadius:28,
      border:`1px solid rgba(77,67,81,.18)`,
      boxShadow:"0 48px 120px rgba(0,0,0,.55), 0 0 80px rgba(109,32,140,.12)",
      overflow:"hidden",
      position:"relative",
    }}>
      <div style={{
        position:"absolute", top:-70, left:"50%", transform:"translateX(-50%)",
        width:280, height:140,
        background:"radial-gradient(ellipse,rgba(237,177,255,.13) 0%,transparent 70%)",
      }}/>

      <div className="card-pad" style={{ padding:"2.5rem 2.25rem" }}>

        {/* TITLE */}
        <div style={{ textAlign:"center", marginBottom:"1.75rem" }}>
          <div className="hn" style={{
            fontSize:"2rem", fontWeight:700, color:"#edb1ff"
          }}>
            Tạo tài khoản
          </div>
          <p style={{ opacity:.7, fontSize:13 }}>
            Bắt đầu hành trình khám phá vận mệnh
          </p>
        </div>

        {/* NAME */}
        <Field label="Họ tên" icon="person" error={errors.name}>
          <input
            className={`inp${errors.name ? " err" : ""}`}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nguyễn Văn A"
          />
        </Field>

        {/* EMAIL */}
        <div style={{ marginTop:14 }}>
          <Field label="Email" icon="alternate_email" error={errors.email}>
            <input
              className={`inp${errors.email ? " err" : ""}`}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </Field>
        </div>

        {/* PASSWORD */}
        <div style={{ marginTop:14 }}>
          <Field label="Mật khẩu" icon="lock" error={errors.pw}>
            <input
              className={`inp${errors.pw ? " err" : ""}`}
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={e => setPw(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{
                position:"absolute", right:14, top:"50%",
                transform:"translateY(-50%)",
                background:"none", border:"none"
              }}
            >
              <span className="mso">
                {showPw ? "visibility_off" : "visibility"}
              </span>
            </button>
          </Field>
          <StrengthMeter password={pw}/>
        </div>

        {/* CONFIRM PASSWORD */}
        <div style={{ marginTop:14 }}>
          <Field label="Xác nhận mật khẩu" icon="lock" error={errors.confirmPw}>
            <input
              className={`inp${errors.confirmPw ? " err" : ""}`}
              type={showConfirm ? "text" : "password"}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              style={{
                position:"absolute", right:14, top:"50%",
                transform:"translateY(-50%)",
                background:"none", border:"none"
              }}
            >
              <span className="mso">
                {showConfirm ? "visibility_off" : "visibility"}
              </span>
            </button>
          </Field>
        </div>

        {/* SUBMIT */}
        <button
          ref={btnRef}
          className="btn-pri"
          onClick={handleSignup}
          disabled={loading}
          style={{ marginTop:20 }}
        >
          {loading ? "Đang tạo..." :
           success ? "Thành công!" :
           "Đăng ký"}
        </button>

        {/* BACK TO LOGIN */}
        <div style={{ marginTop:16, textAlign:"center" }}>
          <span style={{ fontSize:13 }}>
            Đã có tài khoản?{" "}
            <span
              style={{ color:"#edb1ff", cursor:"pointer" }}
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </span>
          </span>
        </div>

      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════ */
export default function SignUp() {
  return (
    <>
      <GlobalStyles/>
      <div style={{ minHeight:"100vh", position:"relative", background: C.bg }}>
        <Background/>
        <Header/>

        <main style={{
          position:"relative", zIndex:10,
          minHeight:"100vh",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          padding:"88px 24px"
        }}>
          <div style={{ display:"flex", gap:"4rem", maxWidth:880 }}>
            <LeftPanel/>
            <SignupCard/>
          </div>
        </main>
      </div>
    </>
  );
}
