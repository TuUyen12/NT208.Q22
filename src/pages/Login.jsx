import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";


/* ════════════════════════════════════════════════
   DESIGN TOKENS  — mirrors HomePage.jsx exactly
════════════════════════════════════════════════ */
const C = {
  bg:                     "#0f131c",
  surface:                "#0f131c",
  surfaceLowest:          "#0a0e17",
  surfaceLow:             "#181b25",
  surfaceContainer:       "#1c1f29",
  surfaceHigh:            "#262a34",
  surfaceHighest:         "#31353f",
  primary:                "#edb1ff",
  primaryContainer:       "#6d208c",
  onPrimary:              "#520070",
  onSurface:              "#dfe2ef",
  onSurfaceVariant:       "#d0c2d3",
  outline:                "#998d9d",
  outlineVariant:         "#4d4351",
  secondaryContainer:     "#583d5f",
  error:                  "#ffb4ab",
  tertiary:               "#d3bcfc",
};

/* ════════════════════════════════════════════════
   GLOBAL STYLES
════════════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
    body {
      font-family: 'Manrope', sans-serif;
      background: ${C.bg};
      color: ${C.onSurface};
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .hn { font-family: 'Newsreader', serif; }
    .mso {
      font-family: 'Material Symbols Outlined';
      font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
      line-height: 1; display: inline-block; vertical-align: middle;
    }

    /* ── Glass panel (identical to hero form) ── */
    .glass {
      background: rgba(15,19,28,0.75);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
    }

    /* ── Input ── */
    .inp {
      width: 100%;
      background: ${C.surfaceLowest};
      border: 1.5px solid transparent;
      border-radius: 12px;
      padding: 13px 14px 13px 44px;
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
    .inp.err {
      border-color: rgba(255,180,171,.5);
      box-shadow: 0 0 0 3px rgba(255,180,171,.08);
    }

    /* ── Primary gradient button ── */
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

    /* ── Social / outline button ── */
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
      display: flex; align-items: center; justify-content: center; gap: 10px;
      transition: background .2s, border-color .2s;
    }
    .btn-soc:hover {
      background: ${C.surfaceHigh};
      border-color: rgba(237,177,255,.22);
    }

    /* ── Ghost link-style button ── */
    .btn-ghost {
      background: none; border: none;
      color: ${C.primary}; opacity: .85;
      font-family: 'Manrope', sans-serif;
      font-size: 13px;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 3px;
      transition: opacity .2s;
      padding: 0;
    }
    .btn-ghost:hover { opacity: 1; }

    /* ── Custom checkbox ── */
    .cb-wrap {
      display: flex; align-items: center; gap: 9px;
      cursor: pointer; user-select: none;
    }
    .cb-box {
      width: 17px; height: 17px; flex-shrink: 0;
      border-radius: 4px;
      border: 1.5px solid ${C.outlineVariant};
      background: ${C.surfaceLowest};
      display: flex; align-items: center; justify-content: center;
      transition: border-color .2s, background .2s;
    }
    .cb-box.on { background: ${C.primaryContainer}; border-color: ${C.primary}; }

    /* ── Divider ── */
    .divider {
      display: flex; align-items: center; gap: 12px;
      font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
      color: ${C.onSurfaceVariant}; opacity: .45;
    }
    .divider::before, .divider::after {
      content: ''; flex: 1; height: 1px;
      background: ${C.outlineVariant}; opacity: .3;
    }

    /* ── Error text ── */
    .err-txt {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: ${C.error};
      margin-top: 6px; margin-left: 2px;
    }

    /* ── Floating particle stars ── */
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

    /* ── Ambient floating orbs ── */
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

    /* ── Nav link ── */
    .nl {
      color: ${C.onSurfaceVariant}; font-size: 14px;
      text-decoration: none; transition: color .25s;
    }
    .nl:hover { color: ${C.primary}; }

    /* ── Strength bar ── */
    .sbar-track {
      height: 3px; border-radius: 99px;
      background: ${C.surfaceHighest};
      overflow: hidden; flex: 1;
    }
    .sbar-fill {
      height: 100%; border-radius: 99px;
      transition: width .35s, background .35s;
    }

    /* ── Success pulse ── */
    @keyframes successPulse {
      0%   { box-shadow: 0 0 0 0 rgba(237,177,255,.5); }
      70%  { box-shadow: 0 0 0 14px rgba(237,177,255,0); }
      100% { box-shadow: 0 0 0 0 rgba(237,177,255,0); }
    }
    .pulse { animation: successPulse .7s ease-out; }

    /* ── Spinner ── */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner {
      width: 16px; height: 16px; flex-shrink: 0;
      border: 2px solid rgba(255,255,255,.25);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }

    /* ── Fade-in entrance ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp .55s ease both; }
    .fade-up-1 { animation-delay: .05s; }
    .fade-up-2 { animation-delay: .12s; }
    .fade-up-3 { animation-delay: .20s; }

    /* ── Responsive hide ── */
    @media (max-width: 800px) { .hide-sm { display: none !important; } }
    @media (max-width: 480px) { .card-pad { padding: 2rem 1.5rem !important; } }
  `}</style>
);

/* ════════════════════════════════════════════════
   PARTICLES / BACKGROUND
════════════════════════════════════════════════ */
const STARS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  s:  Math.random() * 2.5 + 1,
  t:  `${Math.random() * 100}%`,
  l:  `${Math.random() * 100}%`,
  d:  `${(Math.random() * 4 + 2).toFixed(1)}s`,
  dl: `${(Math.random() * 4).toFixed(1)}s`,
}));

const Background = () => (
  <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden" }}>
    <img
      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAw8NoRR53N9kVzjPIXE5O763r_RODFkTje0VJ-pFHLXZFu750gjYin8lmfGchTK8f-UqaFxGKoZpokS5kee28ndaH0NZQMFcbXM3zvYeeFg_BUPh3BLjvj5PcdPS9oaq7HHBXJ0imlvFyBGzCHB6Ude7ACgx7kTSUx5d_nKWvTTKBI4N7VbU93AJDZ36v9sF5LqVW7sTJ7Rhhb1x0U44DGe2BKv_nP02Dchiniq-AQwgHnlovz99kGL2_bICYi0QKxN3v_Sjxw6xM"
      alt=""
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:.16 }}
    />
    <div style={{
      position:"absolute", inset:0,
      background:`linear-gradient(to bottom,${C.bg} 0%,transparent 35%,transparent 65%,${C.bg} 100%)`,
    }}/>

    {/* Glow orbs */}
    <div className="orb" style={{ width:420, height:420, background:"rgba(109,32,140,.2)",  top:"-100px", left:"-120px", "--d":"8s", "--dl":"0s" }}/>
    <div className="orb" style={{ width:280, height:280, background:"rgba(237,177,255,.07)", bottom:"80px",  right:"-60px",  "--d":"10s","--dl":"2s" }}/>
    <div className="orb" style={{ width:160, height:160, background:"rgba(83,60,115,.28)",  top:"42%",     right:"18%",    "--d":"5s", "--dl":"1s" }}/>

    {/* Stars */}
    {STARS.map(s => (
      <div key={s.id} className="star" style={{ width:s.s, height:s.s, top:s.t, left:s.l, "--d":s.d, "--dl":s.dl }}/>
    ))}
  </div>
);

/* ════════════════════════════════════════════════
   HEADER  — shared design language with HomePage
════════════════════════════════════════════════ */
const Header = () => {
  const navigate = useNavigate();

  return (
    <nav style={{
      position:"fixed", top:0, width:"100%", zIndex:50,
      background:"rgba(15,19,28,.82)",
      backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
      borderBottom:`1px solid rgba(77,67,81,.12)`,
    }}>
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"14px 32px", maxWidth:"1200px", margin:"0 auto",
      }}>
        
        {/* LOGO */}
        <span
          onClick={() => navigate("/")}
          style={{
            textDecoration:"none",
            cursor:"pointer"
          }}
        >
          <span className="hn" style={{
            fontSize:"1.5rem",
            fontWeight:700,
            color:C.primary,
            letterSpacing:"-.01em"
          }}>
            YinYang
          </span>
        </span>

        <div style={{ display:"flex", alignItems:"center", gap:"28px" }}>
          {[
            { label: "Tra cứu", to: "/" },
            { label: "Chatbot", to: "/chatbot" },
            { label: "14 Chính tinh", to: "/" },
          ].map(item => (
            <span
              key={item.label}
              className="nl hide-sm"
              style={{ cursor:"pointer" }}
              onClick={() => navigate(item.to)}
            >
              {item.label}
            </span>
          ))}

          {/* TRANG CHỦ */}
          <span
            onClick={() => navigate("/")}
            className="nl"
            style={{
              display:"flex",
              alignItems:"center",
              gap:4,
              color:C.onSurfaceVariant,
              cursor:"pointer"
            }}
          >
            <span className="mso" style={{ fontSize:16 }}>arrow_back</span>
            <span style={{ fontSize:13 }}>Trang chủ</span>
          </span>
        </div>
      </div>
    </nav>
  );
};
/* ════════════════════════════════════════════════
   PASSWORD STRENGTH METER
════════════════════════════════════════════════ */
const getStrength = pw => {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label:"",      color:"transparent" },
    { label:"Yếu",   color:"#ffb4ab" },
    { label:"Tạm",   color:"#f9a825" },
    { label:"Tốt",   color:C.tertiary },
    { label:"Mạnh",  color:"#81c784" },
  ];
  return { score: s, ...map[s] };
};

const StrengthMeter = ({ password }) => {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
      {[1,2,3,4].map(i => (
        <div key={i} className="sbar-track">
          <div className="sbar-fill" style={{ width: score >= i ? "100%" : "0%", background: color }}/>
        </div>
      ))}
      <span style={{ fontSize:11, color, fontWeight:600, minWidth:36, textAlign:"right" }}>{label}</span>
    </div>
  );
};

/* ════════════════════════════════════════════════
   GOOGLE ICON
════════════════════════════════════════════════ */
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

/* ════════════════════════════════════════════════
   FIELD — reusable labeled input wrapper
════════════════════════════════════════════════ */
const Field = ({ label, icon, error, children }) => (
  <div>
    <label style={{
      display:"block", fontSize:11, fontWeight:700,
      letterSpacing:".12em", textTransform:"uppercase",
      color:C.primary, marginBottom:8, marginLeft:2,
    }}>{label}</label>
    <div style={{ position:"relative" }}>
      <span className="mso" style={{
        position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
        fontSize:18, color:C.onSurfaceVariant, opacity:.5,
        pointerEvents:"none", transition:"color .2s, opacity .2s",
      }}>{icon}</span>
      {children}
    </div>
    {error && (
      <div className="err-txt">
        <span className="mso" style={{ fontSize:13 }}>error</span>
        {error}
      </div>
    )}
  </div>
);

/* ════════════════════════════════════════════════
   LOGIN CARD
════════════════════════════════════════════════ */
const LoginCard = () => {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [pw,       setPw]       = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const btnRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!email.trim())                      e.email = "Vui lòng nhập email.";
    else if (!/\S+@\S+\.\S+/.test(email))   e.email = "Email không hợp lệ.";
    if (!pw)                                e.pw    = "Vui lòng nhập mật khẩu.";
    else if (pw.length < 6)                 e.pw    = "Mật khẩu tối thiểu 6 ký tự.";
    return e;
  };

  const handleLogin = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false); setSuccess(true);
    btnRef.current?.classList.add("pulse");
    setTimeout(() => { setSuccess(false); btnRef.current?.classList.remove("pulse"); }, 2200);
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

      {/* Top glow accent */}
      <div style={{
        position:"absolute", top:-70, left:"50%", transform:"translateX(-50%)",
        width:280, height:140,
        background:"radial-gradient(ellipse,rgba(237,177,255,.13) 0%,transparent 70%)",
        pointerEvents:"none",
      }}/>

      <div className="card-pad" style={{ padding:"2.5rem 2.25rem" }}>

        {/* ── Brand ── */}
        <div className="fade-up-1" style={{ textAlign:"center", marginBottom:"1.75rem" }}>
          <div className="hn" style={{
            fontSize:"2rem", fontWeight:700, color:C.primary,
            letterSpacing:"-.02em", marginBottom:6,
          }}>YinYang</div>
          <p style={{ color:C.onSurfaceVariant, fontSize:13.5, opacity:.78, lineHeight:1.55 }}>
            Chào mừng trở lại — đăng nhập để tiếp tục hành trình
          </p>
        </div>

        {/* ── Social login ── */}
        <div className="fade-up-1" style={{ marginBottom:"1.25rem" }}>
          <button className="btn-soc">
            <GoogleIcon/>
            Tiếp tục với Google
          </button>
        </div>

        <div className="divider fade-up-2" style={{ marginBottom:"1.25rem" }}>Hoặc dùng email</div>

        {/* ── Email ── */}
        <div className="fade-up-2" style={{ marginBottom:"1.1rem" }}>
          <Field label="Email" icon="alternate_email" error={errors.email}>
            <input
              className={`inp${errors.email ? " err" : ""}`}
              type="email"
              placeholder="example@email.com"
              value={email}
              autoComplete="email"
              onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:""})); }}
            />
          </Field>
        </div>

        {/* ── Password ── */}
        <div className="fade-up-2" style={{ marginBottom:"0.6rem" }}>
          <Field label="Mật khẩu" icon="lock" error={errors.pw}>
            <input
              className={`inp${errors.pw ? " err" : ""}`}
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={pw}
              autoComplete="current-password"
              style={{ paddingRight:44 }}
              onChange={e => { setPw(e.target.value); setErrors(p => ({...p, pw:""})); }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{
                position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", cursor:"pointer",
                color:C.onSurfaceVariant, opacity:.55, padding:0, lineHeight:1,
                transition:"opacity .2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity="1")}
              onMouseLeave={e => (e.currentTarget.style.opacity=".55")}
            >
              <span className="mso" style={{ fontSize:18 }}>
                {showPw ? "visibility_off" : "visibility"}
              </span>
            </button>
          </Field>
          <StrengthMeter password={pw}/>
        </div>

        {/* ── Remember + Forgot ── */}
        <div className="fade-up-3" style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:"1.5rem",
        }}>
          <label className="cb-wrap" onClick={() => setRemember(v => !v)}>
            <div className={`cb-box${remember ? " on" : ""}`}>
              {remember && <span className="mso" style={{ fontSize:12, color:"#fff" }}>check</span>}
            </div>
            <span style={{ fontSize:13, color:C.onSurfaceVariant }}>Ghi nhớ đăng nhập</span>
          </label>
          <button className="btn-ghost">Quên mật khẩu?</button>
        </div>

        {/* ── Submit ── */}
        <button
          ref={btnRef}
          className="btn-pri fade-up-3"
          disabled={loading}
          onClick={handleLogin}
          style={{ marginBottom:"1.4rem" }}
        >
          {loading ? (
            <><div className="spinner"/> Đang xử lý...</>
          ) : success ? (
            <><span className="mso" style={{ fontSize:17 }}>check_circle</span> Đăng nhập thành công!</>
          ) : "Đăng nhập"}
        </button>

        {/* ── Divider ── */}
        <div className="divider" style={{ marginBottom:"1.4rem" }}>Chưa có tài khoản?</div>

        {/* ── Register CTA ── */}
        <button
          className="btn-soc"
          style={{ borderColor:`rgba(237,177,255,.2)`, color:C.primary }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=`rgba(237,177,255,.45)`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=`rgba(237,177,255,.2)`; }}
          onClick={() => navigate("/signup")}
        >
          <span className="mso" style={{ fontSize:16 }}>person_add</span>
          Tạo tài khoản miễn phí
        </button>

      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════
   LEFT PANEL — editorial sidebar (desktop only)
════════════════════════════════════════════════ */
const LeftPanel = () => (
  <div className="hide-sm" style={{
    flex:1, maxWidth:440,
    display:"flex", flexDirection:"column", justifyContent:"center",
    padding:"2rem 3rem 2rem 0",
  }}>

    {/* Chip */}
    <div style={{
      display:"inline-flex", alignItems:"center", gap:6,
      background:"rgba(88,61,95,.35)",
      border:`1px solid rgba(237,177,255,.16)`,
      borderRadius:9999, padding:"5px 14px",
      fontSize:11, fontWeight:700, letterSpacing:".1em",
      color:C.primary, textTransform:"uppercase",
      marginBottom:"1.75rem", alignSelf:"flex-start",
    }}>
      <span className="mso" style={{ fontSize:14 }}>auto_awesome</span>
      Tử Vi Đẩu Số · AI
    </div>

    {/* Headline */}
    <h1 className="hn" style={{
      fontSize:"clamp(2.2rem,3.5vw,3.4rem)",
      color:C.onSurface, lineHeight:1.14,
      letterSpacing:"-.02em", marginBottom:"1.4rem",
    }}>
      Khám phá<br/>
      <span style={{ color:C.primary }}>vận mệnh</span><br/>
      của bạn
    </h1>

    <p style={{
      color:C.onSurfaceVariant, fontSize:15, lineHeight:1.8,
      maxWidth:"26rem", marginBottom:"2.2rem",
    }}>
      Đăng nhập để truy cập lá số tử vi cá nhân, nhận phân tích chuyên sâu từ AI và khám phá hành trình vận mệnh riêng của bạn.
    </p>

    {/* Feature list */}
    {[
      { icon:"star",             label:"Lá số Tử Vi cá nhân hóa" },
      { icon:"psychology",       label:"Phân tích AI chuyên sâu" },
      { icon:"self_improvement", label:"12 Cung mệnh chi tiết"   },
      { icon:"chat_bubble",      label:"Chatbot tư vấn 24/7"     },
    ].map(({ icon, label }) => (
      <div key={label} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"1rem" }}>
        <div style={{
          width:34, height:34, borderRadius:9, flexShrink:0,
          background:"rgba(88,61,95,.32)",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:C.primary,
        }}>
          <span className="mso" style={{ fontSize:17 }}>{icon}</span>
        </div>
        <span style={{ color:C.onSurfaceVariant, fontSize:14 }}>{label}</span>
      </div>
    ))}

    {/* Testimonial chip */}
    <div style={{
      marginTop:"2rem",
      padding:"1rem 1.25rem",
      background:"rgba(88,61,95,.18)",
      border:`1px solid rgba(237,177,255,.1)`,
      borderRadius:16,
    }}>
      <div style={{ display:"flex", gap:3, marginBottom:8 }}>
        {[...Array(5)].map((_,i) => (
          <span key={i} className="mso" style={{ fontSize:14, color:"#f9a825" }}>star</span>
        ))}
      </div>
      <p style={{ color:C.onSurfaceVariant, fontSize:13, lineHeight:1.6, fontStyle:"italic" }}>
        "Lá số tử vi trên YinYang chính xác đến kinh ngạc. AI giải mã rất chi tiết và dễ hiểu."
      </p>
      <p style={{ marginTop:8, fontSize:12, color:C.outline }}>— Nguyễn Thị M., Hà Nội</p>
    </div>
  </div>
);

/* ════════════════════════════════════════════════
   ROOT — LoginPage
════════════════════════════════════════════════ */
export default function LoginPage() {
  return (
    <>
      <GlobalStyles/>
      <div style={{ minHeight:"100vh", background:C.bg, position:"relative" }}>
        <Background/>
        <Header/>

        <main style={{
          position:"relative", zIndex:10,
          minHeight:"100vh",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"88px 24px 48px",
        }}>
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"center",
            gap:"4rem", width:"100%", maxWidth:880,
          }}>
            <LeftPanel/>
            <div style={{ flex:"0 0 auto", width:"100%", maxWidth:430 }}>
              <LoginCard/>
            </div>
          </div>
        </main>

        <footer style={{
          position:"relative", zIndex:10,
          textAlign:"center", padding:"1.25rem",
          color:C.onSurfaceVariant, fontSize:12, opacity:.35,
        }}>
          © 2024 YinYang Astrology · All rights reserved.
        </footer>
      </div>
    </>
  );
}

export { C, GlobalStyles, Background, Header, Field, StrengthMeter, LeftPanel };
