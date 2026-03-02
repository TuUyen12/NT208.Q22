import { useState } from "react";
import { useNavigate } from "react-router-dom";
import avatarImg from "../assets/avatar.jpg";
import laSoImg from "../assets/LaSo.png"; // 🔥 ảnh lá số của bạn

export default function LaSoTuVi() {
  const navigate = useNavigate();
  const isAuth = localStorage.getItem("isAuth") === "true";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    setIsMenuOpen(false);
    navigate(0);
  };

  return (
    <div style={styles.pageContainer}>
      {/* ================= HEADER (GIỐNG HOME) ================= */}
      <header style={styles.header}>
        <div style={styles.logo}>YIN♾️YANG</div>

        <nav style={styles.navMenu}>
          <span style={styles.navLink}>SẢN PHẨM ▾</span>
          <span style={styles.navLink}>HỎI, ĐÁP</span>
          <span style={styles.navLink}>14 CHÍNH TINH</span>
          <span style={styles.navLink}>BLOG</span>
          <span style={styles.navLink}>VỀ YIN♾️YANG ▾</span>
        </nav>

        <div style={styles.authSection}>
          {isAuth ? (
            <div style={styles.userProfile}>
              <div
                style={styles.avatarWrapper}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <img src={avatarImg} alt="Avatar" style={styles.avatarImage} />
                <span style={styles.userName}>Me</span>
                <span style={styles.arrowDown}>▼</span>
              </div>

              {isMenuOpen && (
                <div style={styles.dropdownMenu}>
                  <div style={styles.dropdownItem}>👤 Thông tin cá nhân</div>
                  <div style={styles.dropdownItem}>🕒 Lịch sử</div>
                  <div style={styles.dropdownItem}>⚙️ Cài đặt</div>
                  <div style={styles.dropdownDivider}></div>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      color: "#e74c3c",
                      fontWeight: "bold",
                    }}
                    onClick={handleLogout}
                  >
                    🚪 Đăng xuất
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleLoginClick} style={styles.loginButton}>
              Đăng nhập
            </button>
          )}
        </div>
      </header>

      {/* ================= NỘI DUNG LÁ SỐ ================= */}
      <section style={styles.mainSection}>
        <h1 style={styles.pageTitle}>LÁ SỐ TỬ VI CỦA BẠN</h1>

        <div style={styles.infoCard}>
          <h2 style={styles.fullName}>Nguyễn Văn A</h2>

          <p style={styles.infoText}>
            <strong>Ngày sinh:</strong> 1/1/2004
          </p>
          <p style={styles.infoText}>
            <strong>Giờ sinh:</strong> 0 giờ 0 phút
          </p>
          <p style={styles.infoText}>
            <strong>Giới tính:</strong> Nam
          </p>
        </div>

        <div style={styles.imageWrapper}>
          <img src={laSoImg} alt="Lá số tử vi" style={styles.laSoImage} />
        </div>
        
      </section>
      
      

      {/*  PHẦN CHÂN TRANG (FOOTER) */}
      <footer style={styles.footer}>
        <div style={styles.footerTop}>
          <div style={styles.footerColInfo}>
            <p style={styles.footerIntro}>
              YinYang là nền tảng tử vi cho thế hệ mới, khám phá tử vi truyền thống chính tông qua lăng kính khoa học hiện đại.
            </p>
            <div style={styles.socialIcons}>
              <span style={styles.iconCircle}>f</span>
              <span style={styles.iconCircle}>ig</span>
              <span style={styles.iconCircle}>t</span>
              <span style={styles.iconCircle}>in</span>
            </div>
            <p style={styles.footerEmail}>contact@yinyang.vn</p>
          </div>

          <div style={styles.footerCol}>
            <h4 style={styles.footerColTitle}>VỀ YIN♾️YANG</h4>
            <p style={styles.footerLink}>Chúng tôi</p>
            <p style={styles.footerLink}>Đối tác</p>
            <p style={styles.footerLink}>Bảo mật</p>
            <p style={styles.footerLink}>Điều khoản dịch vụ</p>
          </div>

          <div style={styles.footerCol}>
            <h4 style={styles.footerColTitle}>NỘI DUNG</h4>
            <p style={styles.footerLink}>Hỏi, đáp</p>
            <p style={styles.footerLink}>Blog</p>
            <p style={styles.footerLink}>12 Con giáp</p>
            <p style={styles.footerLink}>14 Chính tinh</p>
            <p style={styles.footerLink}>Đánh giá</p>
          </div>

          <div style={styles.footerCol}>
            <h4 style={styles.footerColTitle}>SẢN PHẨM</h4>
            <p style={styles.footerLink}>Tử vi cá nhân</p>
            <p style={styles.footerLink}>Tử vi tương hợp</p>
          </div>

          <div style={styles.footerColNewsletter}>
            <h4 style={styles.footerColTitle}>Nhận tin tức tử vi từ YIN♾️YANG</h4>
            <div style={styles.newsletterInputContainer}>
              <input 
                type="email" 
                placeholder="email-cua-ban@gmail.com" 
                style={styles.newsletterInput} 
              />
              <button style={styles.newsletterBtn}>➤</button>
            </div>
          </div>
        </div>

        <div style={styles.footerDivider}></div>

        <div style={styles.footerBottom}>
          <h2 style={styles.footerLogoBottom}>YIN♾️YANG</h2>
        </div>
      </footer>
    </div>
  );
}
const styles = {
  pageContainer: {
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#FDF9F1",
  },

  /* ===== HEADER ===== */
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    backgroundColor: "#051A30",
    color: "white",
    flexWrap: "wrap",
  },

  logo: {
    fontSize: "24px",
    fontWeight: "bold",
    letterSpacing: "2px",
    cursor: "pointer",
  },

  navMenu: {
    display: "flex",
    gap: "25px",
    alignItems: "center",
  },

  navLink: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#D0D9E0",
    cursor: "pointer",
  },

  authSection: { position: "relative" },

  loginButton: {
    backgroundColor: "transparent",
    color: "white",
    border: "1px solid white",
    padding: "8px 20px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  userProfile: { position: "relative" },

  avatarWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    padding: "5px 15px 5px 5px",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: "25px",
  },

  avatarImage: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  userName: {
    fontSize: "14px",
    fontWeight: "bold",
  },

  arrowDown: {
    fontSize: "10px",
    color: "#D0D9E0",
  },

  dropdownMenu: {
    position: "absolute",
    top: "120%",
    right: 0,
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    width: "200px",
    overflow: "hidden",
    zIndex: 9999, 
    },

  dropdownItem: {
    padding: "15px 20px",
    fontSize: "14px",
    cursor: "pointer",
    color: "#051A30", 
    },

  dropdownDivider: {
    height: "1px",
    backgroundColor: "#eee",
  },

  /* ===== MAIN CONTENT ===== */
  mainSection: {
    padding: "60px 20px",
    textAlign: "center",
  },

  pageTitle: {
    fontSize: "30px",
    marginBottom: "40px",
    color: "#051A30",
    textTransform: "uppercase",
  },

  infoCard: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "15px",
    maxWidth: "500px",
    margin: "0 auto 40px auto",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  fullName: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#051A30", // 🔥 trùng màu header
    marginBottom: "20px",
  },

  infoText: {
    fontSize: "16px",
    marginBottom: "10px",
  },

  imageWrapper: {
    maxWidth: "800px",
    margin: "0 auto",
  },

  laSoImage: {
    width: "100%",
    borderRadius: "15px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  },

  /* ===== FOOTER ===== */
  footer: {
    backgroundColor: "#051A30",
    color: "white",
    padding: "50px 30px 20px 30px",
    fontSize: "14px",
    marginTop: 0, 
  },
  footerTop: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    maxWidth: "1200px",
    margin: "0 auto",
    gap: "30px",
  },
  footerColInfo: {
    flex: "2 1 250px",
  },
  footerIntro: {
    lineHeight: "1.6",
    color: "#D0D9E0",
    marginBottom: "20px",
  },
  socialIcons: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
  },
  iconCircle: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    backgroundColor: "#295985",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontWeight: "bold",
  },
  footerEmail: {
    color: "white",
    textDecoration: "underline",
    cursor: "pointer",
  },
  footerCol: {
    flex: "1 1 120px",
  },
  footerColTitle: {
    color: "#D0D9E0",
    fontSize: "13px",
    marginBottom: "20px",
    textTransform: "uppercase",
  },
  footerLink: {
    color: "#D0D9E0",
    marginBottom: "15px",
    cursor: "pointer",
  },
  footerColNewsletter: {
    flex: "1 1 250px",
  },
  newsletterInputContainer: {
    display: "flex",
    backgroundColor: "white",
    borderRadius: "5px",
    overflow: "hidden",
    marginTop: "10px",
  },
  newsletterInput: {
    flex: 1,
    padding: "12px 15px",
    border: "none",
    outline: "none",
    fontSize: "14px",
  },
  newsletterBtn: {
    backgroundColor: "white",
    border: "none",
    padding: "0 15px",
    cursor: "pointer",
    fontSize: "18px",
    color: "#051A30",
  },
  footerDivider: {
    height: "1px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    margin: "40px auto 30px auto",
    maxWidth: "1200px",
  },
  footerBottom: {
    textAlign: "center",
  },
  footerLogoBottom: {
    fontSize: "28px",
    fontWeight: "bold",
    letterSpacing: "3px",
    margin: 0,
  },
};
