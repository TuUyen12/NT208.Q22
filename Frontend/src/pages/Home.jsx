import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ NEW IMPORT

/* ─────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────────*/
const C = {
  background:               "#0f131c",
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
      font-size: 0.875rem; text-decoration: none; transition: color 0.3s;
    }
    .nav-link:hover { color: ${C.primary}; }
    .field-input, .field-select {
      width: 100%; background: ${C.surfaceContainerLowest};
      border: none; border-radius: 0.75rem;
      padding: 1rem 1.25rem; color: ${C.onSurface};
      font-family: 'Manrope', sans-serif; font-size: 0.95rem;
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
    @media (max-width: 768px) {
      .hero-title { font-size: 3.5rem !important; }
      .nav-links { display: none; }
    }
  `}</style>
);

/* ─────────────────────── Header ──────────────────────── */
// ✅ CHANGED: Accepts onLoginClick prop — keeps UI unchanged, adds navigation behaviour
const Header = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const navItems = [
    { label: "Tra cứu", to: "/" },
    { label: "Chatbot", to: "/chatbot" },
    { label: "14 Chính tinh", to: "/major-stars" },
    { label: "Blog", to: "/" },
    { label: "Liên hệ", to: "contact" },
  ];

  return (
    <nav style={{
      position: "fixed", top: 0, width: "100%", zIndex: 50,
      background: "rgba(15,19,28,0.8)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: "0 32px 64px rgba(49,53,63,0.06)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1rem 2rem", maxWidth: "80rem", margin: "0 auto",
      }}>
        <div  
          className="font-headline"
          style={{ fontFamily: "Cinzel, serif", fontSize: "2.5rem" }}
        >
          YinYang
        </div>

        <div className="nav-links" style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          {navItems.map(item => (
            <span
              key={item.label}
              className="nav-link"
              style={{ cursor: "pointer" }}
              onClick={() => 
                {
                  if (item.to === "contact") 
                    {
                      const el = document.getElementById("contact");
                      window.scrollTo
                      ({
                        top: el.offsetTop - 80,
                        behavior: "smooth"
                      });
                    } else 
                      {
                        navigate(item.to);
                      }
              }}
            >
              {item.label}
            </span>
          ))}
        </div>

        {/* ✅ CHANGED: onClick wired to onLoginClick prop */}
        <button
          className="btn-primary"
          style={{ padding: "0.5rem 1.5rem", fontSize: "0.95rem", borderRadius: "0.75rem", fontFamily: "'Manrope', sans-serif" }}
          onClick={onLoginClick}
        >
          Login
        </button>
      </div>
    </nav>
  );
};

/* ─────────────────────── Hero / Banner ──────────────────────── */
const HeroSection = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", dob: "", time: "", gender: "Nam", year: "2024 (Giáp Thìn)" });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGetChartClick = () => {
    if (!form.name || !form.dob || !form.time) {
      alert("Vui lòng nhập đầy đủ thông tin (Họ tên, Ngày sinh, Giờ sinh)");
      return;
    }
    // Lưu dữ liệu vào localStorage
    localStorage.setItem("lasotuvi_form", JSON.stringify(form));
    navigate("/la-so-tu-vi");
  };

  return (
    <section style={{
      position: "relative", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", padding: "6rem 1.5rem 4rem",
    }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img
          src="/background2.png"
          alt="dark background"
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }}
        />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${C.background}, transparent, ${C.background})` }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: "60rem", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 className="font-headline hero-title" style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "5.5rem", color: C.primary, letterSpacing: "-0.02em",
            marginBottom: "1rem", textShadow: "0 0 80px rgba(237,177,255,0.2)", lineHeight: 1.1,
          }}>
            LÁ SỐ TỬ VI
          </h1>
          <p style={{ color: C.onSurfaceVariant, fontSize: "1.1rem", maxWidth: "38rem", margin: "0 auto", fontWeight: 300, letterSpacing: "0.02em", lineHeight: 1.7 }}>
            Khám phá bí mật vận mệnh qua bản đồ sao phương Đông cổ xưa, được giải mã bằng trí tuệ nhân tạo hiện đại.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "3rem", borderRadius: "2rem", border: `1px solid rgba(77,67,81,0.1)`, boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
            {[
              { label: "Họ và Tên", name: "name", type: "text",  placeholder: "Nguyễn Văn A" },
              { label: "Ngày sinh", name: "dob",  type: "date",  placeholder: "" },
              { label: "Giờ sinh",  name: "time", type: "time",  placeholder: "" },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.primary, textTransform: "uppercase", marginBottom: "0.5rem", marginLeft: "0.25rem" }}>{label}</label>
                <input className="field-input" type={type} name={name} placeholder={placeholder} value={form[name]} onChange={handleChange} style={type === "date" || type === "time" ? { colorScheme: "dark" } : {}} />
              </div>
            ))}
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.primary, textTransform: "uppercase", marginBottom: "0.5rem", marginLeft: "0.25rem" }}>Giới tính</label>
              <select className="field-select" name="gender" value={form.gender} onChange={handleChange}>
                <option>Nam</option><option>Nữ</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.primary, textTransform: "uppercase", marginBottom: "0.5rem", marginLeft: "0.25rem" }}>Năm tra cứu</label>
              <select className="field-select" name="year" value={form.year} onChange={handleChange}>
                <option>2024 (Giáp Thìn)</option>
                <option>2025 (Ất Tỵ)</option>
                <option>2026 (Bính Ngọ)</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn-primary" style={{ width: "100%", padding: "1rem", fontSize: "1rem", fontFamily: "'Manrope', sans-serif" }} onClick={handleGetChartClick}>
                Giải Mã Lá Số
              </button>
            </div>
          </div>
        </div>
      </div>
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
  <section style={{ padding: "6rem 2rem", maxWidth: "80rem", margin: "0 auto" }}>
    <div style={{ display: "flex", flexDirection: "column", marginBottom: "4rem", gap: "1rem" }}>
      <div style={{ maxWidth: "38rem" }}>
        <h2 className="font-headline" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: C.onSurface, marginBottom: "1rem", lineHeight: 1.2 }}>
          Khám phá bản thân qua các khía cạnh
        </h2>
        <p style={{ color: C.onSurfaceVariant, fontWeight: 300, lineHeight: 1.8 }}>
          Thấu hiểu các mảnh ghép cuộc đời thông qua lăng kính Tử Vi Đẩu Số. Mỗi lá số là một hành trình riêng biệt được khắc họa bởi các vì tinh tú.
        </p>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem" }}>
      {insightItems.map(({ icon, title, desc }) => (
        <div key={title} className="insight-card">
          <div className="glow-spot" />
          <div style={{ background: "rgba(88,61,95,0.3)", width: "4rem", height: "4rem", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontSize: "2rem", marginBottom: "1.5rem" }}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <h3 className="font-headline" style={{ fontSize: "1.5rem", color: C.onSurface, marginBottom: "0.75rem" }}>{title}</h3>
          <p style={{ color: C.onSurfaceVariant, fontSize: "0.875rem", lineHeight: 1.7 }}>{desc}</p>
        </div>
      ))}
    </div>
  </section>
);

/* ─────────────────────── 12 Con Giáp ──────────────────────── */
const zodiacData = [
  { name: "Tý",   src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBiBbdK0GFybMBvvC7xljMxFgXIIPEzW9-5nkC2zwEsJzLUKYG-bZBiTdFugNZ0BIHL9VleTEvzefFDUP4v75CesO6nEgvl8nDMGfg0I7GRzEN7Y7guLdGiT2NPjqRGYjkMV2tCm-cukh7fQQYJWz7lGS3bvyzaDjgHj8Y7Ecr7A8hlD52EwqLgYFLrJsl80eJb1rAkKM2ZWrOaLwbkJN-N_uX4va8FEbnFXQqQMPdK4aHWrUfIZz_nmG9THxz7NGpMbGdVZSL1PVQ" },
  { name: "Sửu",  src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjG88jpcqvsSa8fLHkwUOn0Xf_k4I24vuu_0Xq38hWZnskg9y5TQEgSTIiTgjQiILUWbyni-5WecNJdFCtKt5wOfrjdWKQInV06MnAvBMqZY2UcbAfBEC8HrnJKXI60EQhww6XribVZuw0kRzQ4V2mDiBvl9_W0BPk7S53_NJ18MeYwJ5-e449TePK2AbC_CntQGsCiBD-8Maml_RJ3k1xzB0AdG-ckbhCUsMdIwy-agDPfrTA6ArAx6tRcRHbd3gcGqcP5oX_37A" },
  { name: "Dần",  src: "https://lh3.googleusercontent.com/aida-public/AB6AXuADY4ItE5M7WTc2oQC9vHff_JFWdCWB_iO2AAtFeg-dWTlqA6lYdr5m6WhticNQUzl5cWLaScJTAh8l2kbEduQaBZPaHaHTngmmr7x92FVzvkUxvQn8Ppkb02j8tPDh5wTHSkUQIIpP9lLaCPQ-QR8Yw1F2Gd3wdNbaeU49NxwCN094QiRhxe9j1vQ0imgFtj_Qu7JAK6nJ8VZEN1E3lkNxHiNcuc5rBvxJK12tZoflcJRKG64mzOHAK2gV9PqR_7V6yxF-i-GferQ" },
  { name: "Mão",  src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCW9N6ws5NzhzlPs1h4ug9Z9IYCIMLXeqP6_Q9k164u39eW6tVWR_tT4x5879wpWgJPQcO8wzkxv7g0HzA83nOnrd1Gb2EQLrg5LUytpEXdP-RmmRqr-cJVF3lPye2yVDXqlGbGyRl-LehabvLPsb4-4dY1dxw1DXx5vg5aa59ozQJx1PyxzXGWJ-MGk7j-k5_YtIzb--brosVYaEEfbSE106PEyDz4pKsYnPASsr_O_7-UyECcOGb2HhTOc3mcSXRrtpmXWkeGk8c" },
  { name: "Thìn", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwHRy8cSr3i3Wm7iFlpnSTL4ighVTCu3U3eqzCgBLdrHq73hlWkCRCyYMFYmStAFe0mcEQCRx8hF0YQ6zc6E6njT9nCcIlcwAT5dWwCtpbv7g0P_3ucqOGL5PfwO04qXoCZ0dwrQZi53qgbDIcxdxZHJNPbHzQcxqess1JPlrw-SEqFNbQtlhPScjcOJ9IfMy8X390Q2dLCejeGN7bTaxkq1cw_j7h2oNhf8P7j3lqigOhMvg878yAavvN5X4uIdbAdUAvlO5E4Z4" },
  { name: "Tỵ",   src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAn4AAnZTT-Kb--zyRUEs74fhQTPdmEF3tZX4B6D-ERlHMiXWmGV9sZuOeZGP3MVe7543VdgdpDes5K8tCWgA2gq7Yg5xabVnMt6tAC_5QFG2BWzwsWwloYFrhf3NKdNaCgv-ZFHjtvUDYY_qgNVuGZ5IGLoBE6EzvU7kYPe_-7KumqyUhRb6BlDtO2vehcIIiH5M4DD2xOM8pdrJB8cyMj5cP0ljVMi7svcZWxiH1k1ZOlrLNygTfOrPCcNrjuoMvkCWB7G3cnRrs" },
  { name: "Ngọ",  src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCl9oVs38MgOYvRh0MlEu5r7TooUoJfDjPgJKrV4Oz2OJ8Y_1GKF8zkdMugv4P2HlN1sAXrMikaNH5J7LshWiKMBs4pFb6KjgWWT3Y8seJU8hWHxg1PpdyjRHQKoAPVLwjvzqJTBvC9s1aSBDnweIG8Ax95l3OoeBVEIjSZhVRJUSLuXrzH5Mens6n6uUzxaxp4FgdILUib2aawnnzV0N2WXWHU2cIwHkZLfduOft3eUrvavMWRkdNgoqEkQ0nVVtyuchJlfrycOTc" },
  { name: "Mùi",  src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFTRqd6-MNS1oxDjnd7ZB2tcGTLRdHAVneKQ13HdhukXtB4Gvd-8SAPhOZ1Fq6ENjNerZAmcYYUmAjcNXmH5wqKUANj4aAknOXoxnukuuBgtYiuMWMusWdXfuUi7ol8UM74jIfW2vyol0Q5P8sDIMJtGQnCES5pyCgyDX-7IPda0DwgYskqa5tRE41pTWuvV2ewMrBsccn0YDg7c3RL1mfmSPUtBc3H33H6blFXoIBUHFiklCzau_qDZ5-ToO9zCyGEXLyh4jLeLE" },
  { name: "Thân", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1aP2tGYrwUiL7KDCoHbBnowIvJYuucSjO-IOp1ZIWhIigCtLnZSHC0AtCKpDOkSLeitGnrdbJg1ZBkjDfdpT2Qm04TE40w4t78syut5t5u_4d6jAR2wQ5-tf_vp28LqFf5SZ7GX9wgk_wzzZ1sFCeu_gXD2aupRvvdlTf7SiD_1uAfiYMmRLrmoPwis5Jg4Etei3mxt_NJ4FLS67p6ybj27WKxW7GNnGaib3od7MCgtQZ4keG8rtHzgnwCEihr99g39FRLZn143c" },
  { name: "Dậu",  src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBNXhK7ivo5peXrna2Q2_fXqBVOJRU-uL78HGlYz0ykMM_zEYyehYUXTE1j7bykBdRQOjy3dRzs8YqR-FBZnEeheAhSXhQDR_32V-igqIIiOh_2i5xFwVFB8-bT3BTTu4SjhKKA3mgi-TdEHzpsWpX_ObbFX6SNeLJOrPMsDcYDZae1bX9ZhNLaott7MnYqIWnppSg3NTZS1SZGUSa7Ankb32XqIFn899ixr-CLN0drp_ynU0d1ZoSYEJjQwwuA4wc_EP7_zrTILio" },
  { name: "Tuất", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbsozK-p2KIXvoc2mOxxkUEIVJtgbRpG4Ap5GiVR3G3-0VsoNmXJRsS-4eMIeBLbr45_ihdmeZiaOaaEt1-XPvkj7wIfybzkkdVxNyc7jrQsMnbpdlhx3GomJ6VwFrOItsiJL6ieWNwzTbbWuUC40U3R1zARfni2KRvp44p5T-7FijyBaAyZfW87PhyFddMON840l9ceSXJftRSpnzn3Iy-KpKGzhe86YZ47IYLQ9MMbpS2QgNgRVfEhXxAlk5TZ1CgFK5zAFnRFk" },
  { name: "Hợi",  src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCBZnrk1B1-gl3PR5DOAOTi97LQLDcPt6Y8js_J7fiP9FC8oWd3RIpZVNOporodYoKEAT9XlmDpqUzzqqOGE-NaZCsuFkvh06H12QtJc35eV4k_IvaVjvoKwE3mb_IbJEbCe5k-xtL0yCcjm9jXKkPPBK2jo4Ao5WC1g9BXTBvZwPCVx-yE5GchRpHy7LUKH7128mgaO161EPYbFBQbSxkStCnyR56GfJsEzMgHaFUFT2p-ObG2P0BdSfFqFQlWgpB-H8kwS7cOpAs" },
];

const ZodiacSection = () => (
  <section style={{ padding: "6rem 0", background: C.surfaceContainerLowest, position: "relative", overflow: "hidden" }}>
    <div className="celestial-glow" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
    <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 2rem", position: "relative", zIndex: 10 }}>
      <div style={{ textAlign: "center", marginBottom: "5rem" }}>
        <h2 className="font-headline" style={{ fontFamily: "Cormorant Garamond, serif",fontSize: "clamp(2.5rem, 4vw, 3.5rem)", color: C.primary, marginBottom: "1.5rem" }}>12 con giáp</h2>
        <div style={{ width: "6rem", height: "4px", background: C.primaryContainer, borderRadius: "9999px", margin: "0 auto 1.5rem" }} />
        <p style={{ color: C.onSurfaceVariant, maxWidth: "30rem", margin: "0 auto", lineHeight: 1.8 }}>
          Vòng quay 12 linh vật biểu tượng cho các tính cách và vận mệnh riêng biệt trong văn hóa Á Đông.
        </p>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1.5rem", marginBottom: "4rem" }}>
        {zodiacData.map(({ name, src }) => (
          <div key={name} className="zodiac-card">
            <img src={src} alt={name} />
            <span className="font-headline" style={{ fontSize: "1.15rem", color: C.onSurface }}>{name}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <button className="btn-outline" style={{ padding: "1rem 2.5rem", fontSize: "1rem", fontFamily: "'Manrope', sans-serif" }}>
          Tìm hiểu thêm
        </button>
      </div>
    </div>

  </section>
);

/* ─────────────────────── Footer ──────────────────────── */
const Footer = () => {
  const navigate = useNavigate();
  const serviceLinks = [
    { label: "Tra cứu", to: "/" },
    { label: "Chatbot", to: "/chatbot" },
    { label: "14 Chính tinh", to: "/major-stars" },
  ];
  const infoLinks = [
    { label: "Blog", to: "/" },
    { label: "Về YinYang", to: "/" },
    { label: "Điều khoản", to: "/" },
  ];

  return (
    <footer style={{ width: "100%", padding: "4rem 2rem", background: C.surfaceContainerLowest, fontFamily: "'Manrope', sans-serif", color: C.onSurfaceVariant, borderTop: `1px solid rgba(77,67,81,0.15)` }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "3rem", maxWidth: "80rem", margin: "0 auto" }}>
        <div>
          <div id="contact"  className="font-headline" style={{ fontFamily: "Cinzel, serif",  fontSize: "2rem", fontWeight: 700, color: C.primary, marginBottom: "1rem" }}>YinYang</div>
          <p style={{ fontSize: "0.875rem", opacity: 0.6, lineHeight: 1.7 }}>Kết nối trí tuệ cổ xưa với công nghệ hiện đại để soi sáng con đường của bạn.</p>
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
                  onClick={() => navigate(item.to)}
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
                  onClick={() => navigate(item.to)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ color: C.primary, fontWeight: 700, marginBottom: "1.5rem" }}>Liên hệ</h4>
          <div style={{ display: "flex", gap: "1rem" }}>
            {["alternate_email", "share"].map(icon => (
              <a key={icon} href="#" style={{ background: C.surfaceContainer, width: "2.5rem", height: "2.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: C.onSurfaceVariant, fontSize: "1rem", textDecoration: "none", transition: "background 0.2s" }}
                 onMouseEnter={e => (e.currentTarget.style.background = C.primaryContainer)}
                 onMouseLeave={e => (e.currentTarget.style.background = C.surfaceContainer)}>
                <span className="material-symbols-outlined">{icon}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "80rem", margin: "4rem auto 0", paddingTop: "2rem", borderTop: `1px solid rgba(77,67,81,0.1)`, textAlign: "center", opacity: 0.4, fontSize: "0.75rem" }}>
        © 2024 YinYang Astrology. All rights reserved.
      </div>

    </footer>
  );
};

/* ─────────────────────── HomePage (root) ──────────────────────── */
export default function HomePage() {
  // ✅ NEW: useNavigate hook — must be used inside a <Router> context (provided by App.jsx)
  const navigate = useNavigate();

  // ✅ NEW: navigation handler — passed as prop to Header
  const handleLoginClick = () => navigate("/login");

  return (
    <>
      <FontLoader />
      <div style={{ background: C.background, minHeight: "100vh" }}>
        {/* ✅ CHANGED: onLoginClick prop added — all other UI is identical */}
        <Header onLoginClick={handleLoginClick} />
        <main style={{ paddingTop: "4rem" }}>
          <HeroSection />
          <InsightsSection />
          <ZodiacSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
