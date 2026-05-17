// LaSoTuVi.jsx 
import { useNavigate, useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import ChartLayout from "../components/ChartLayout";
import AnalysisSection from "../components/AnalysisSection";
import { generateChartData } from "../services/iztroService";
import { generateInterpretations } from "../services/interpretationService";

// ====================== HEADER COMPONENT ======================
function Header({ onLoginClick }) {
  const navigate = useNavigate();
  const navItems = [
    { label: "Tra cứu", to: "/" },
    { label: "Chatbot", to: "/chatbot" },
    { label: "14 Chính tinh", to: "/major-stars" },
    { label: "Blog", to: "/" },
    { label: "Liên hệ", to: "contact" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 50,
        background: "rgba(15,19,28,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          className="font-headline"
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "2.5rem",
            color: "#FFFFFF",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          YinYang
        </div>
        <div
          className="nav-links"
          style={{ display: "flex", gap: "2rem", alignItems: "center" }}
        >
          {navItems.map((item) => (
            <span
              key={item.label}
              className="nav-link"
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (item.to === "contact") {
                  const el = document.getElementById("contact");
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
        <button
          className="btn-primary"
          style={{
            padding: "0.55rem 1.5rem",
            fontSize: "0.95rem",
            borderRadius: "0.75rem",
            fontFamily: "'Manrope', sans-serif",
          }}
          onClick={onLoginClick}
        >
          Login
        </button>
      </div>
    </nav>
  );
}



// ====================== FONT LOADER ======================
function FontLoader() {
  const C = {
    background: "#0f131c",
    surface: "#0f131c",
    surfaceContainerLowest: "#0a0e17",
    surfaceContainerLow: "#181b25",
    surfaceContainer: "#1c1f29",
    surfaceContainerHigh: "#262a34",
    surfaceContainerHighest: "#31353f",
    primary: "#edb1ff",
    primaryContainer: "#6d208c",
    onPrimary: "#520070",
    onSurface: "#dfe2ef",
    onSurfaceVariant: "#d0c2d3",
    outlineVariant: "#4d4351",
    secondaryContainer: "#583d5f",
  };
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: ${C.background}; color: ${C.onSurface}; font-family: 'Manrope', sans-serif; }
      .font-headline { font-family: 'Cormorant Garamond', serif; }
      .nav-link { color: ${C.onSurfaceVariant}; font-family: 'Manrope', sans-serif; font-size: 0.9rem; text-decoration: none; transition: color 0.3s; }
      .nav-link:hover { color: ${C.primary}; }
      .btn-primary { background: linear-gradient(135deg, ${C.primary}, ${C.primaryContainer}); color: white; border: none; border-radius: 0.75rem; font-weight: 700; cursor: pointer; transition: box-shadow 0.3s, transform 0.15s; }
      .btn-primary:hover { box-shadow: 0 0 30px -5px rgba(237,177,255,0.4); }
      .btn-primary:active { transform: scale(0.98); }
      @media (max-width: 768px) { .nav-links { display: none; } }
    `}</style>
  );
}

// ====================== MAIN COMPONENT ======================
export default function LaSoTuVi() {
  const navigate = useNavigate();
  const location = useLocation();
  const chartRef = useRef(null);
  const [palaceData, setPalaceData] = useState([]);
  const [centerInfo, setCenterInfo] = useState(null);
  const [interpretations, setInterpretations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChart() {
      try {
        const formData = location.state;
        if (!formData) {
          setLoading(false);
          return;
        }
        const result = await generateChartData(formData);
        setPalaceData(result.palaceData);
        setCenterInfo(result.centerInfo);
        // Tạo luận giải từ palaceData
        const interps = generateInterpretations(result.palaceData);
        setInterpretations(interps);
      } catch (error) {
        console.error("LOAD CHART ERROR:", error);
      } finally {
        setLoading(false);
      }
    }
    loadChart();
  }, [location.state]);

  const handleDownloadChart = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = "la-so-tu-vi.png";
    link.click();
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#10131B", color: "white", fontSize: "24px" }}>
        Đang tạo lá số...
      </div>
    );
  }

  const styles = {
    container: {
      position: "relative",
      minHeight: "100vh",
      overflow: "hidden",
      paddingTop: "120px",
      paddingBottom: "80px",
      background: "linear-gradient(to bottom, #10131B 0%, #3D2352 45%, #5D277B 100%)",
    },
    glowTop: {
      position: "absolute",
      top: "-200px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "700px",
      height: "700px",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(237,177,255,0.12) 0%, transparent 70%)",
      pointerEvents: "none",
    },
    glowBottom: {
      position: "absolute",
      bottom: "-300px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "900px",
      height: "900px",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(237,177,255,0.10) 0%, transparent 70%)",
      pointerEvents: "none",
    },
    title: {
      position: "relative",
      zIndex: 2,
      textAlign: "center",
      color: "#FFFFFF",
      fontSize: "72px",
      fontWeight: 700,
      letterSpacing: "4px",
      marginBottom: "32px",
      fontFamily: "Cormorant Garamond, serif",
      textShadow: "0 0 40px rgba(237,177,255,0.25)",
    },
    description: {
      position: "relative",
      zIndex: 2,
      fontSize: "16px",
      lineHeight: 1.5,
      color: "#E6D8F0",
      textAlign: "center",
      maxWidth: "560px",
      marginInline: "auto",
      marginBottom: "40px",
    },
    chartSection: {
      position: "relative",
      zIndex: 2,
      width: "fit-content",
      margin: "0 auto",
    },
    chartToolbar: {
      display: "flex",
      justifyContent: "center",
      marginBottom: "16px",
    },
    downloadButton: {
      border: "none",
      outline: "none",
      cursor: "pointer",
      padding: "12px 20px",
      borderRadius: "12px",
      background: "linear-gradient(135deg, #EDB1FF 0%, #9C46BE 100%)",
      color: "#FFFFFF",
      fontSize: "14px",
      fontWeight: 700,
      fontFamily: "Manrope, sans-serif",
      boxShadow: "0 8px 24px rgba(156,70,190,0.35)",
      transition: "all 0.2s ease",
    },
    chartFrame: {
      position: "relative",
      width: "fit-content",
      padding: "5px",
      background: "#FFFBF5",
      borderRadius: "14px",
      overflow: "hidden",
      boxShadow: "0 0 40px rgba(237,177,255,0.12)",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    legend: {
      textAlign: 'center',
      fontSize: '14px',
      color: '#5D277B',
      padding: '8px 0 4px 0',
      borderTop: '1px solid rgba(156,70,190,0.15)',
      marginTop: '4px',
      fontFamily: 'Manrope, sans-serif',
    },
  };

  return (
    <>
      <Header onLoginClick={() => navigate("/login")} />
      <FontLoader />
      <div style={styles.container}>
        <div style={styles.glowTop} />
        <div style={styles.glowBottom} />
        <h1 style={styles.title}>LÁ SỐ TỬ VI</h1>
        <h3 style={styles.description}>
          Khám phá bản đồ định mệnh của bạn qua hệ thống Tử Vi Đông Phương cổ xưa, được giải mã dưới lăng kính của YinYang.
        </h3>
        <div style={styles.chartSection}>
          <div style={styles.chartToolbar}>
            <button style={styles.downloadButton} onClick={handleDownloadChart}>
              ⬇ Tải Lá Số
            </button>
          </div>
          <div ref={chartRef} style={styles.chartFrame}>
            <ChartLayout palaceData={palaceData} centerInfo={centerInfo} />
            <div style={styles.legend}>
              Miếu (M) - Vượng (V) - Đắc (Đ) - Bình (B) - Hãm (H)
            </div>
          </div>
        </div>
        <AnalysisSection sections={interpretations} />
      </div>
    </>
  );
}