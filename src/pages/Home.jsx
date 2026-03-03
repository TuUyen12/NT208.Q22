import { useState } from "react"; 
import { useNavigate } from "react-router-dom";
import zodiacBanner from "../assets/12ConGiap.png";
//  1. IMPORT ẢNH 
import avatarImg from "../assets/avatar.jpg"; 

export default function Home() {
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
      {/* 1. THANH ĐIỀU HƯỚNG (HEADER) */}
      <header style={styles.header}>
        <div style={styles.logo}>YIN♾️YANG</div>
        
        <nav style={styles.navMenu}>
          <span style={styles.navLink}>TRA CỨU ▾</span>
          <span style={styles.navLink}>CHATBOT</span>
          <span style={styles.navLink}>14 CHÍNH TINH</span>
          <span style={styles.navLink}>BLOG</span>
          <span style={styles.navLink}>VỀ YIN♾️YANG ▾</span>
        </nav>

        {/* 🔥 KHU VỰC TÀI KHOẢN */}
        <div style={styles.authSection}>
          {isAuth ? (
            <div style={styles.userProfile}>
              <div 
                style={styles.avatarWrapper} 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
              >
                {/* ẢNH AVATAR VÀ TÊN MỚI THÊM Ở ĐÂY */}
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
                    style={{ ...styles.dropdownItem, color: "#e74c3c", fontWeight: "bold" }} 
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

      {/* 2. PHẦN BANNER CHÍNH (YinYang SECTION) */}
      <section style={styles.yinyangSection}>
        <h1 style={styles.mainTitle}>LÁ SỐ TỬ VI</h1>
        <p style={styles.subTitle}>
          Bản đồ vận mệnh chuẩn xác nhất. Biết mệnh để nắm bắt cơ hội, giải hạn.
        </p>

        {/* 3. KHUNG FORM NHẬP LIỆU */}
        <div style={styles.formCard}>
          <input type="text" placeholder="Họ và tên (*)" style={styles.inputFull} />
          
          <div style={styles.row}>
            <input type="date" style={styles.inputHalf} />
            <select style={styles.inputHalf}>
              <option>Giờ sinh</option>
              <option>Tý (23h - 1h)</option>
              <option>Sửu (1h - 3h)</option>
            </select>
          </div>

          <div style={styles.row}>
            <select style={styles.inputHalf}>
              <option>Giới tính (*)</option>
              <option>Nam</option>
              <option>Nữ</option>
            </select>
            <select style={styles.inputHalf}>
              <option>Năm xem (*)</option>
              <option>2024</option>
              <option>2025</option>
            </select>
          </div>

          <button style={styles.submitButton}onClick={() => navigate("/laso")}
            >Lập lá số</button>
          
          <p style={styles.linkText}>Cách lấy lá số chuẩn xác nhất?</p>
        </div>
      </section>

      {/* 4. PHẦN TÍNH NĂNG */}
      <section style={styles.featuresSection}>
        <h2 style={{ color: "#051A30", fontSize: "20px", marginBottom: "20px" }}>
          Khám phá bản thân qua các khía cạnh
        </h2>
        <div style={styles.featureGrid}>
          <div style={styles.featureItem}>💞 Tình duyên</div>
          <div style={styles.featureItem}>💼 Sự nghiệp</div>
          <div style={styles.featureItem}>💰 Tài lộc</div>
          <div style={styles.featureItem}>🏥 Sức khỏe</div>
        </div>
      </section>

      {/* 5. PHẦN 12 CON GIÁP */}
      <section style={styles.zodiacSection}>
        <div style={styles.col}>
          <img 
          src={zodiacBanner} 
          alt="12 Con Giáp Tử Vi" 
          style={styles.zodiacImage} 
        />
        <button style={styles.zodiacButton}>Tìm hiểu thêm</button>
        </div>
      </section>

      {/* 6. PHẦN CHÂN TRANG (FOOTER) */}
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
            <p style={styles.footerLink}>Chat bot</p>
            <p style={styles.footerLink}>Blog</p>
            <p style={styles.footerLink}>12 Con giáp</p>
            <p style={styles.footerLink}>14 Chính tinh</p>
            <p style={styles.footerLink}>Đánh giá</p>
          </div>

          <div style={styles.footerCol}>
            <h4 style={styles.footerColTitle}>TRA CỨU</h4>
            <p style={styles.footerLink}>Tử vi cá nhân</p>
            <p style={styles.footerLink}>Xem tử vi trọn đời</p>
            <p style={styles.footerLink}>Tra cứu bản đồ sao</p>
            <p style={styles.footerLink}>Tra cứu thần số học</p>
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

// BỘ CÔNG CỤ TRANG TRÍ MỚI NHẤT
const styles = {
  pageContainer: {
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#FDF9F1",
    margin: 0,
    padding: 0,
    overflowX: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    backgroundColor: "#051A30",
    color: "white",
    flexWrap: "wrap",
    gap: "15px",
    position: "relative",
    zIndex: 100,
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
    flexWrap: "wrap",
    justifyContent: "center",
  },
  navLink: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#D0D9E0",
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "0.3s",
  },
  
  /* --- CÁC STYLE CHO AVATAR VÀ TÊN --- */
  authSection: {
    position: "relative",
  },
  col: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",   // căn giữa button
  },
  loginButton: {
    backgroundColor: "transparent",
    color: "white",
    border: "1px solid white",
    padding: "8px 20px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  userProfile: {
    position: "relative",
    display: "inline-block",
  },
  avatarWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px", // Tăng khoảng cách giữa ảnh, tên và mũi tên
    cursor: "pointer",
    padding: "5px 15px 5px 5px", // Đệm trái ít hơn vì có ảnh tròn
    backgroundColor: "rgba(255, 255, 255, 0.1)", 
    borderRadius: "25px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  avatarImage: {
    width: "36px",
    height: "36px",
    borderRadius: "50%", // 🔥 Bí quyết để bo tròn ảnh
    objectFit: "cover", // Cắt ảnh không bị méo tỷ lệ
  },
  userName: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "white",
  },
  arrowDown: {
    fontSize: "10px",
    color: "#D0D9E0",
  },
  /* ----------------------------------- */

  dropdownMenu: {
    position: "absolute",
    top: "130%", 
    right: "0",  
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)", 
    width: "200px",
    overflow: "hidden",
    zIndex: 999, 
  },
  dropdownItem: {
    padding: "15px 20px",
    fontSize: "14px",
    color: "#333",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  dropdownDivider: {
    height: "1px",
    backgroundColor: "#eee",
    margin: "0",
  },
  yinyangSection: {
    background: "linear-gradient(180deg, #051A30 0%, #295985 100%)",
    padding: "40px 20px 60px 20px",
    textAlign: "center",
    color: "white",
  },
  mainTitle: {
    fontSize: "32px",
    margin: "0 0 10px 0",
    textTransform: "uppercase",
  },
  subTitle: {
    fontSize: "14px",
    marginBottom: "30px",
    lineHeight: "1.5",
    opacity: 0.9,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: "15px",
    padding: "20px",
    maxWidth: "400px",
    margin: "0 auto",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  },
  inputFull: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxSizing: "border-box",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
    gap: "10px",
  },
  inputHalf: {
    width: "48%",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxSizing: "border-box",
  },
  submitButton: {
    width: "100%",
    padding: "15px",
    backgroundColor: "#051A30",
    color: "white",
    fontWeight: "bold",
    fontSize: "16px",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    marginTop: "10px",
  },
  linkText: {
    color: "#3879b5ff",
    fontSize: "13px",
    marginTop: "15px",
    textDecoration: "underline",
    cursor: "pointer",
  },
  featuresSection: {
    padding: "40px 20px 60px 20px",
    textAlign: "center",
  },
  featureGrid: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "15px",
    maxWidth: "500px",
    margin: "0 auto",
  },
  featureItem: {
    backgroundColor: "white",
    padding: "15px 20px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    width: "40%",
    fontWeight: "bold",
    color: "#333",
  },
  zodiacSection: { 
    width: "100%",
    margin: "0 auto",
    padding: 30,
    display: "flex",
    flexDirection: "column",   // thêm dòng này
    alignItems: "center",      // căn giữa theo chiều ngang
    backgroundColor: "#d4bfef",
  },

  zodiacImage: {
    width: "100%", 
    height: "auto", 
    objectFit: "cover", 
    display: "block", 
  },
  zodiacButton: {
    width: "20%",
    padding: "15px",
    backgroundColor: "#051A30",
    color: "white",
    fontWeight: "bold",
    fontSize: "16px",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    marginTop: "10px",
  },
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
  }
};