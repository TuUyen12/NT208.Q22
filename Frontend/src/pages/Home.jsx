import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

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
      font-size: 0.875rem; text-decoration: none; transition: color 0.3s;
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
    @media (max-width: 768px) {
      .hero-title { font-size: 3.5rem !important; }
      .nav-links { display: none; }
    }
  `}</style>
);

/* ─────────────────────── Header ──────────────────────── */
const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // ĐÃ ĐỔI: "Blog" thành "12 con giáp" và trỏ ID đến "zodiac"
  const navItems = [
    { label: "Tra cứu", to: "/" },
    { label: "Dịch vụ", to: "services" },
    { label: "Chatbot", to: "/chatbot" },
    { label: "14 Chính tinh", to: "/major-stars" },
    { label: "12 con giáp", to: "zodiac" },
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
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          <img
            src="/favicon3.png"
            alt="logo"
            style={{
              width: "52px",
              height: "52px",
              objectFit: "contain",
            }}
          />

          <div
            className="font-headline"
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "2.5rem",
              color: C.onSurface,
            }}
          >
            YinYang
          </div>
        </div>

        <div className="nav-links" style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          {navItems.map(item => (
            <span
              key={item.label}
              className="nav-link"
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (item.to === "contact" || item.to === "services" || item.to === "zodiac") {
                  const el = document.getElementById(item.to);
                  if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
                } else {
                  navigate(item.to);
                }
              }}
            >
              {item.label}
            </span>
          ))}
        </div>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{
              fontSize: "0.85rem",
              color: "#d0c2d3",
              fontFamily: "'Manrope', sans-serif",
              maxWidth: "160px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {user.full_name || user.email}
            </span>
            <button
              className="btn-outline"
              style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", fontFamily: "'Manrope', sans-serif" }}
              onClick={logout}
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <button
            className="btn-outline"
            style={{ padding: "0.5rem 1.5rem", fontSize: "0.95rem", fontFamily: "'Manrope', sans-serif" }}
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        )}
        
      </div>
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
  const [form, setForm] = useState({ 
    name: "", 
    dob: "", 
    time: "", 
    gender: "Nam", 
    year: currentYear.toString()
  });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const startYear = currentYear - 10;
  const endYear = currentYear + 10;
  const yearOptions = [];
  for (let y = startYear; y <= endYear; y++) {
    const canChi = getCanChi(y);
    yearOptions.push({ value: y, label: `${y} (${canChi})` });
  }

  const handleGetChartClick = () => {
    if (!form.name || !form.dob || !form.time) {
      alert("Vui lòng nhập đầy đủ thông tin (Họ tên, Ngày sinh, Giờ sinh)");
      return;
    }
 
    const formData = {
      name:       form.name,
      birthDate:  form.dob,
      birthHour:  form.time,
      gender:     form.gender === "Nữ" ? "female" : "male",
      targetYear: Number(form.year),
    };
 
    navigate("/la-so-tu-vi", { state: formData });
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

      <div style={{ position: "relative", zIndex: 10, maxWidth: "80rem", width: "100%" }}>
        
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap",
          alignItems: "center", 
          justifyContent: "space-between",
          marginBottom: "4rem",
          gap: "2rem"
        }}>
          {/* Cột trái */}
          <div style={{ textAlign: "left", flex: "1 1 400px" }}>
            <h1 className="font-headline hero-title" style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "7.5rem", color: C.primary, letterSpacing: "-0.02em",
              marginBottom: "1.5rem", textShadow: "0 0 80px rgba(237,177,255,0.2)", lineHeight: 1.1,
            }}>
              LÁ SỐ TỬ VI
            </h1>
            <p style={{ color: C.onSurfaceVariant, fontSize: "1.5rem", maxWidth: "40rem", fontWeight: 300, letterSpacing: "0.02em", lineHeight: 1.8 }}>
              Mỗi vì sao khi bạn chào đời đều mang một thông điệp riêng. Hãy để YinYang giúp bạn giải mã bản đồ sao phương Đông, thấu hiểu bản thân để nắm bắt cơ hội và sống trọn vẹn từng khoảnh khắc.
            </p>
          </div>

          {/* Cột phải: ĐÃ SỬA ảnh thành /favicon3.png theo đúng ý bạn */}
          <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "flex-end" }}>
            <img 
              src="/favicon3.png"
              alt="Minh họa lá số" 
              style={{ 
                width: "100%", 
                maxWidth: "450px", 
                height: "auto", 
                objectFit: "contain"
              }} 
            />
          </div>
        </div>

        <div className="glass-panel" style={{ maxWidth: "70rem", margin: "0 auto", padding: "3rem", borderRadius: "2rem", border: `1px solid rgba(77, 67, 81, 0.12)`, boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "2.5rem" }}>
            {[
              { label: "Họ và Tên", name: "name", type: "text",  placeholder: "Nguyễn Văn A" },
              { label: "Ngày sinh (Dương Lịch)", name: "dob",  type: "date",  placeholder: "" },
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
                {yearOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn-outline" style={{ width: "100%", padding: "1rem", fontSize: "1.3rem", fontFamily: "'Manrope', sans-serif" }} onClick={handleGetChartClick}>
                Giải Mã Lá Số
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
    color: "#d9659e"
  },
  {
    title: "GÓI CƠ BẢN",
    desc: "Tổng quan Vận mệnh, Cá nhân, Sự nghiệp Tiền tài & Tình duyên.",
    stats: "3 MỤC • 16 CHỦ ĐỀ",
    price: "199.000 đ",
    color: "#c37735"
  },
  {
    title: "GÓI NÂNG CAO",
    desc: "Có thêm Vận hạn năm & Tương tác. Giúp định hướng rõ ràng.",
    stats: "5 MỤC • 24 CHỦ ĐỀ",
    price: "299.000 đ",
    color: "#d46b84"
  },
  {
    title: "GÓI TRỌN ĐỜI",
    desc: "Giải mã toàn diện lá số, vận hạn trọn đời, chi tiết từng đại vận.",
    stats: "TẤT CẢ CHỦ ĐỀ",
    price: "499.000 đ",
    color: "#7a5c9e"
  }
];

const ComboSection = () => (
  <section id="services" style={{ 
    position: "relative",
    width: "100%", 
    padding: "6rem 0",
    overflow: "hidden"
  }}>
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      <img
        src="/background1.jpg"
        alt="combo background"
        style={{ 
          width: "100%", 
          height: "100%", 
          objectFit: "cover", 
          filter: "blur(6px)",
          transform: "scale(1.05)"
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "rgba(15, 19, 28, 0.6)" }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${C.background} 0%, transparent 15%, transparent 85%, ${C.background} 100%)` }} />
    </div>

    <div style={{ position: "relative", zIndex: 10, maxWidth: "80rem", margin: "0 auto", padding: "0 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
        <h2 className="font-headline" style={{ fontSize: "2.5rem", color: C.onSurface, fontWeight: 420 }}>
          Combo tiết kiệm
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", color: C.onSurfaceVariant }}>
          <span className="material-symbols-outlined" style={{ cursor: "pointer", fontSize: "1.2rem", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = C.primary} onMouseLeave={e => e.currentTarget.style.color = C.onSurfaceVariant}>arrow_back</span>
          <span style={{ fontSize: "1rem", fontWeight: 500, fontFamily: "'Manrope', sans-serif" }}>4/4</span>
          <span className="material-symbols-outlined" style={{ cursor: "pointer", fontSize: "1.2rem", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = C.primary} onMouseLeave={e => e.currentTarget.style.color = C.onSurfaceVariant}>arrow_forward</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
        {comboData.map((combo, idx) => (
          <div 
            key={idx}
            style={{
              background: "#ffffff",
              border: `1px solid ${combo.color}`,
              borderRadius: "0",
              padding: "2rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "260px",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = `0 15px 30px -10px ${combo.color}80`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div>
              <h3 style={{ color: combo.color, fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem", fontFamily: "'Manrope', sans-serif" }}>
                {combo.title}
              </h3>
              <p style={{ color: "#4a4a4a", fontSize: "0.95rem", lineHeight: 1.6, fontFamily: "'Manrope', sans-serif" }}>
                {combo.desc}
              </p>
            </div>
            
            <div style={{ marginTop: "2.5rem" }}>
              <div style={{ width: "100%", height: "1px", background: "rgba(0,0,0,0.1)", marginBottom: "1.25rem" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Manrope', sans-serif" }}>
                <span style={{ color: combo.color, fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>
                  {combo.stats}
                </span>
                <span style={{ color: combo.color, fontSize: "1.2rem", fontWeight: 700 }}>
                  {combo.price}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

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

const ZodiacSection = () => (
  // ĐỀ VÀO ID: id="zodiac" để liên kết với nút bấm trên menu Header
  <section id="zodiac" style={{ padding: "6rem 0", background: C.surfaceContainerLowest, position: "relative", overflow: "hidden" }}>
    <div className="celestial-glow" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
    <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 2rem", position: "relative", zIndex: 10 }}>
      <div style={{ textAlign: "center", marginBottom: "5rem" }}>
        <h2 className="font-headline" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(2.5rem, 4vw, 3.5rem)", color: C.primary, marginBottom: "1.5rem" }}>12 con giáp</h2>
        <div style={{ width: "6rem", height: "4px", background: C.primaryContainer, borderRadius: "9999px", margin: "0 auto 1.5rem" }} />
        <p style={{ color: C.onSurfaceVariant, maxWidth: "30rem", margin: "0 auto", lineHeight: 1.8 }}>
          Vòng quay 12 linh vật biểu tượng cho các tính cách và vận mệnh riêng biệt trong văn hóa Á Đông.
        </p>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1.5rem", marginBottom: "4rem" }}>
        {zodiacData.map(({ name, src }) => (
          <div key={name} className="zodiac-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                marginBottom: "1.25rem"
              }}
            />
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
    { label: "Dịch vụ", to: "services" },
    { label: "Chatbot", to: "/chatbot" },
    { label: "14 Chính tinh", to: "/major-stars" },
  ];

  // Đồng bộ hóa footer luôn cho xịn
  const infoLinks = [
    { label: "12 con giáp", to: "zodiac" },
    { label: "Về YinYang", to: "/" },
    { label: "Điều khoản", to: "/" },
  ];

  return (
    <footer
      style={{
        width: "100%",
        padding: "4rem 2rem",
        background: C.surfaceContainerLowest,
        fontFamily: "'Manrope', sans-serif",
        color: C.onSurfaceVariant,
        borderTop: `1px solid rgba(77,67,81,0.15)`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "3rem",
          maxWidth: "80rem",
          margin: "0 auto",
        }}
      >
        <div id="contact">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.8rem",
              marginLeft: "1.8rem", 
            }}
          >
            <img
              src="/favicon3.png"
              alt="YinYang Logo"
              style={{
                width: "52px",
                height: "52px",
                objectFit: "contain",
              }}
            />

            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "2.5rem",
                color: C.onSurface,
                lineHeight: 1,
              }}
            >
              YinYang
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", paddingLeft: "5rem" }}>
            {["alternate_email", "share"].map((icon) => (
              <a
                key={icon}
                href="#"
                style={{
                  background: C.surfaceContainer,
                  width: "3.5rem",
                  height: "3.5rem",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.onSurfaceVariant,
                  fontSize: "1rem",
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = C.primaryContainer)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = C.surfaceContainer)
                }
              >
                <span className="material-symbols-outlined">
                  {icon}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ color: C.primary, fontWeight: 700, marginBottom: "1.5rem" }}>
            Dịch vụ
          </h4>
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
                    } else {
                      navigate(item.to);
                    }
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ color: C.primary, fontWeight: 700, marginBottom: "1.5rem" }}>
            Thông tin
          </h4>
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
                    } else {
                      navigate(item.to);
                    }
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          maxWidth: "80rem",
          margin: "4rem auto 0",
          paddingTop: "2rem",
          borderTop: `1px solid rgba(77,67,81,0.1)`,
          textAlign: "center",
          opacity: 0.4,
          fontSize: "0.75rem",
        }}
      >
        © 2024 YinYang Astrology. All rights reserved.
      </div>
    </footer>
  );
};

/* ─────────────────────── HomePage (root) ──────────────────────── */
export default function HomePage() {
  return (
    <>
      <FontLoader />
      <div style={{ background: C.background, minHeight: "100vh" }}>
        <Header />
        <main style={{ paddingTop: "4rem" }}>
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