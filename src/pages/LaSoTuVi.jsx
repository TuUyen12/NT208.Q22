import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { astro } from "iztro";
import avatarImg from "../assets/avatar.jpg";

// ---------------------------------------------------------------------------
// Tên cung bằng tiếng Việt (ánh xạ từ tên tiếng Trung của iztro)
// ---------------------------------------------------------------------------
const PALACE_VI = {
  "命宫": "MỆNH",
  "兄弟": "HUYNH ĐỆ",
  "夫妻": "PHU THÊ",
  "子女": "TỬ NỮ",
  "财帛": "TÀI BẠCH",
  "疾厄": "TẬT ÁCH",
  "迁移": "THIÊN DI",
  "仆役": "NÔ BỘC",
  "官禄": "QUAN LỘC",
  "田宅": "ĐIỀN TRẠCH",
  "福德": "PHÚC ĐỨC",
  "父母": "PHỤ MẪU",
};

// Tên Địa Chi tiếng Việt theo thứ tự iztro (bắt đầu từ Dần = index 0)
const CHI_VI = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"];

// Ánh xạ cung index (0=Dần…11=Sửu) → vị trí CSS Grid [gridRow, gridColumn] (1-indexed)
// Bố cục 4×4: viền ngoài = 12 cung, trung tâm 2×2 = thông tin lá số
const GRID_POS = [
  [4, 4], // 0: Dần
  [3, 4], // 1: Mão
  [2, 4], // 2: Thìn
  [1, 4], // 3: Tỵ
  [1, 3], // 4: Ngọ
  [1, 2], // 5: Mùi
  [1, 1], // 6: Thân
  [2, 1], // 7: Dậu
  [3, 1], // 8: Tuất
  [4, 1], // 9: Hợi
  [4, 2], // 10: Tý
  [4, 3], // 11: Sửu
];

// Màu nền cho cung đặc biệt
const PALACE_COLORS = {
  "命宫": "#051A30",
  "官禄": "#1a3a5c",
  "财帛": "#1a3a5c",
  "夫妻": "#1a3a5c",
};

// ---------------------------------------------------------------------------
// Định dạng ngày từ HTML date input (YYYY-MM-DD) → iztro (YYYY-M-D)
// ---------------------------------------------------------------------------
function toIztroDate(htmlDate) {
  const [y, m, d] = htmlDate.split("-").map(Number);
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Component một ô cung
// ---------------------------------------------------------------------------
function PalaceCell({ palace, isMain }) {
  const palaceNameVI = PALACE_VI[palace.name] || palace.name;
  const chi = CHI_VI[palace.index] || "";
  const bgColor = PALACE_COLORS[palace.name] || (isMain ? "#0d2b4a" : "#0d2b4a");

  const majorStars = palace.majorStars?.filter(s => s.name) ?? [];
  const minorStars = palace.minorStars?.filter(s => s.name) ?? [];

  return (
    <div style={{
      ...styles.palaceCell,
      gridRow: GRID_POS[palace.index][0],
      gridColumn: GRID_POS[palace.index][1],
      backgroundColor: bgColor,
      border: isMain ? "2px solid #f0c060" : "1px solid #2a4a6a",
    }}>
      {/* Tiêu đề cung */}
      <div style={styles.palaceHeader}>
        <span style={styles.palaceName}>{palaceNameVI}</span>
        <span style={styles.palaceChi}>{chi}</span>
      </div>

      {/* Chính tinh */}
      <div style={styles.majorStarsContainer}>
        {majorStars.map((star, i) => (
          <div key={i} style={styles.majorStar}>
            <span style={styles.starName}>{star.name}</span>
            {star.brightness && (
              <span style={styles.starBrightness}>{star.brightness}</span>
            )}
          </div>
        ))}
      </div>

      {/* Phụ tinh */}
      {minorStars.length > 0 && (
        <div style={styles.minorStarsContainer}>
          {minorStars.slice(0, 4).map((star, i) => (
            <span key={i} style={styles.minorStar}>{star.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trang chính
// ---------------------------------------------------------------------------
export default function LaSoTuVi() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = localStorage.getItem("isAuth") === "true";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { name, date, timeIndex, gender, viewYear } = location.state || {};

  // Tính lá số bằng iztro
  const { astrolabe, error } = useMemo(() => {
    if (!date || timeIndex == null || !gender) {
      return { astrolabe: null, error: "Thiếu thông tin đầu vào." };
    }
    try {
      const result = astro.astrolabeBySolarDate(
        toIztroDate(date),
        timeIndex,
        gender,
        true,        // fixLeap: xử lý tháng nhuận
        "zh-CN",     // ngôn ngữ (iztro chưa hỗ trợ tiếng Việt)
      );
      return { astrolabe: result, error: null };
    } catch (e) {
      return { astrolabe: null, error: e.message };
    }
  }, [date, timeIndex, gender]);

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    setIsMenuOpen(false);
    navigate(0);
  };

  // Nếu không có dữ liệu, quay về trang chủ
  if (!date) {
    return (
      <div style={styles.errorScreen}>
        <p>Vui lòng nhập thông tin trên trang chủ trước.</p>
        <button style={styles.backBtn} onClick={() => navigate("/")}>← Quay lại</button>
      </div>
    );
  }

  const solarDateDisplay = date ? new Date(date + "T12:00:00").toLocaleDateString("vi-VN") : "";
  const genderDisplay = gender === "male" ? "Nam" : "Nữ";
  const chiDisplay = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"][timeIndex] || "";

  return (
    <div style={styles.pageContainer}>
      {/* ===== HEADER ===== */}
      <header style={styles.header}>
        <div style={styles.logo} onClick={() => navigate("/")}>YIN♾️YANG</div>

        <nav style={styles.navMenu}>
          <span style={styles.navLink}>TRA CỨU ▾</span>
          <span style={styles.navLink}>CHATBOT</span>
          <span style={styles.navLink}>14 CHÍNH TINH</span>
          <span style={styles.navLink}>BLOG</span>
          <span style={styles.navLink}>VỀ YIN♾️YANG ▾</span>
        </nav>

        <div style={styles.authSection}>
          {isAuth ? (
            <div style={styles.userProfile}>
              <div style={styles.avatarWrapper} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <img src={avatarImg} alt="Avatar" style={styles.avatarImage} />
                <span style={styles.userName}>Me</span>
                <span style={styles.arrowDown}>▼</span>
              </div>
              {isMenuOpen && (
                <div style={styles.dropdownMenu}>
                  <div style={styles.dropdownItem}>👤 Thông tin cá nhân</div>
                  <div style={styles.dropdownItem}>🕒 Lịch sử</div>
                  <div style={styles.dropdownItem}>⚙️ Cài đặt</div>
                  <div style={styles.dropdownDivider} />
                  <div style={{ ...styles.dropdownItem, color: "#e74c3c", fontWeight: "bold" }} onClick={handleLogout}>
                    🚪 Đăng xuất
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate("/login")} style={styles.loginButton}>Đăng nhập</button>
          )}
        </div>
      </header>

      {/* ===== NỘI DUNG ===== */}
      <section style={styles.mainSection}>
        <h1 style={styles.pageTitle}>LÁ SỐ TỬ VI CỦA BẠN</h1>

        {/* Thông tin người xem */}
        <div style={styles.infoCard}>
          <h2 style={styles.fullName}>{name || "Ẩn danh"}</h2>
          <div style={styles.infoRow}>
            <span style={styles.infoItem}><strong>Ngày sinh:</strong> {solarDateDisplay}</span>
            <span style={styles.infoItem}><strong>Giờ:</strong> Giờ {chiDisplay}</span>
            <span style={styles.infoItem}><strong>Giới tính:</strong> {genderDisplay}</span>
            {astrolabe && (
              <>
                <span style={styles.infoItem}><strong>Âm lịch:</strong> {astrolabe.lunarDate}</span>
                <span style={styles.infoItem}><strong>Mệnh:</strong> {astrolabe.fiveElementsClass}</span>
              </>
            )}
          </div>
        </div>

        {/* Lỗi tính toán */}
        {error && (
          <div style={styles.errorBox}>
            <p>Không thể tính lá số: {error}</p>
          </div>
        )}

        {/* Bảng lá số 4×4 */}
        {astrolabe && (
          <div style={styles.boardWrapper}>
            <div style={styles.board}>
              {/* 12 ô cung */}
              {astrolabe.palaces.map((palace) => (
                <PalaceCell
                  key={palace.index}
                  palace={palace}
                  isMain={palace.name === "命宫"}
                />
              ))}

              {/* Ô trung tâm (2×2) */}
              <div style={styles.centerBox}>
                <div style={styles.centerTitle}>TỬ VI</div>
                <div style={styles.centerName}>{name || "Ẩn danh"}</div>
                <div style={styles.centerInfo}>{solarDateDisplay}</div>
                <div style={styles.centerInfo}>Giờ {chiDisplay} · {genderDisplay}</div>
                {astrolabe.soul && (
                  <div style={styles.centerBadge}>Thân: {astrolabe.soul}</div>
                )}
                {astrolabe.body && (
                  <div style={styles.centerBadge}>Mệnh: {astrolabe.body}</div>
                )}
              </div>
            </div>

            <p style={styles.noteText}>
              * Tên sao hiển thị theo chữ Hán (iztro). Nhấp vào từng cung để xem giải nghĩa.
            </p>
          </div>
        )}

        <button style={styles.backBtn} onClick={() => navigate("/")}>← Lập lại lá số</button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={styles.footer}>
        <div style={styles.footerBottom}>
          <h2 style={styles.footerLogo}>YIN♾️YANG</h2>
          <p style={{ color: "#D0D9E0", margin: 0 }}>contact@yinyang.vn</p>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
  pageContainer: {
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#0a1628",
    color: "white",
  },

  /* Header */
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    backgroundColor: "#051A30",
    color: "white",
    flexWrap: "wrap",
    gap: "15px",
  },
  logo: { fontSize: "24px", fontWeight: "bold", letterSpacing: "2px", cursor: "pointer" },
  navMenu: { display: "flex", gap: "25px", alignItems: "center" },
  navLink: { fontSize: "13px", fontWeight: "600", color: "#D0D9E0", cursor: "pointer" },
  authSection: { position: "relative" },
  loginButton: {
    backgroundColor: "transparent", color: "white", border: "1px solid white",
    padding: "8px 20px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold",
  },
  userProfile: { position: "relative" },
  avatarWrapper: {
    display: "flex", alignItems: "center", gap: "10px", cursor: "pointer",
    padding: "5px 15px 5px 5px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "25px",
  },
  avatarImage: { width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" },
  userName: { fontSize: "14px", fontWeight: "bold" },
  arrowDown: { fontSize: "10px", color: "#D0D9E0" },
  dropdownMenu: {
    position: "absolute", top: "120%", right: 0, backgroundColor: "white",
    borderRadius: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", width: "200px", zIndex: 9999,
  },
  dropdownItem: { padding: "15px 20px", fontSize: "14px", cursor: "pointer", color: "#051A30" },
  dropdownDivider: { height: "1px", backgroundColor: "#eee" },

  /* Main */
  mainSection: { padding: "40px 20px", textAlign: "center" },
  pageTitle: { fontSize: "26px", marginBottom: "24px", color: "#f0c060", textTransform: "uppercase" },

  /* Info card */
  infoCard: {
    backgroundColor: "#0d2240", border: "1px solid #2a4a6a",
    padding: "20px 30px", borderRadius: "12px",
    maxWidth: "700px", margin: "0 auto 30px auto",
  },
  fullName: { fontSize: "24px", fontWeight: "bold", color: "#f0c060", marginBottom: "14px" },
  infoRow: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" },
  infoItem: { fontSize: "14px", color: "#c8d8e8", backgroundColor: "#1a3a5c", padding: "6px 14px", borderRadius: "20px" },

  /* Error */
  errorBox: { backgroundColor: "#3a1010", border: "1px solid #a03030", padding: "16px", borderRadius: "8px", maxWidth: "500px", margin: "0 auto 20px auto" },
  errorScreen: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "16px", color: "white" },

  /* Board */
  boardWrapper: { maxWidth: "960px", margin: "0 auto" },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridTemplateRows: "repeat(4, minmax(150px, auto))",
    gap: "2px",
    backgroundColor: "#061020",
    border: "2px solid #2a4a6a",
    borderRadius: "8px",
    overflow: "hidden",
  },

  /* Palace cell */
  palaceCell: {
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minHeight: "150px",
    overflow: "hidden",
  },
  palaceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    paddingBottom: "4px",
    marginBottom: "4px",
  },
  palaceName: { fontSize: "11px", fontWeight: "bold", color: "#f0c060", textTransform: "uppercase" },
  palaceChi: { fontSize: "11px", color: "#8aacca" },

  /* Stars */
  majorStarsContainer: { display: "flex", flexDirection: "column", gap: "2px" },
  majorStar: { display: "flex", alignItems: "baseline", gap: "4px" },
  starName: { fontSize: "13px", fontWeight: "bold", color: "#e8f4ff" },
  starBrightness: { fontSize: "10px", color: "#f0c060" },
  minorStarsContainer: { display: "flex", flexWrap: "wrap", gap: "2px", marginTop: "4px" },
  minorStar: { fontSize: "10px", color: "#8aacca", backgroundColor: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: "3px" },

  /* Center box: occupies grid rows 2-3, columns 2-3 */
  centerBox: {
    gridRow: "2 / 4",
    gridColumn: "2 / 4",
    backgroundColor: "#051A30",
    border: "2px solid #f0c060",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "16px",
  },
  centerTitle: { fontSize: "22px", fontWeight: "bold", letterSpacing: "4px", color: "#f0c060" },
  centerName: { fontSize: "18px", fontWeight: "bold", color: "white" },
  centerInfo: { fontSize: "13px", color: "#8aacca" },
  centerBadge: { fontSize: "12px", color: "#f0c060", backgroundColor: "rgba(240,192,96,0.15)", padding: "4px 12px", borderRadius: "12px" },

  noteText: { fontSize: "12px", color: "#5a7a9a", marginTop: "12px", textAlign: "center" },
  backBtn: {
    marginTop: "24px", padding: "12px 32px", backgroundColor: "#f0c060", color: "#051A30",
    border: "none", borderRadius: "25px", cursor: "pointer", fontWeight: "bold", fontSize: "15px",
  },

  /* Footer */
  footer: { backgroundColor: "#051A30", padding: "30px", textAlign: "center" },
  footerBottom: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  footerLogo: { fontSize: "24px", fontWeight: "bold", letterSpacing: "3px", margin: 0, color: "white" },
};
