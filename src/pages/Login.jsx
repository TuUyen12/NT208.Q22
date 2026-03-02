import { useState } from "react";
import { useNavigate } from "react-router-dom";
import moonImg from "../assets/moon.png"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault(); 
    localStorage.setItem("isAuth", "true");
    navigate("/");
  };

  return (
    <div style={styles.container}>
      
      {/* PHẦN TRÊN: Ảnh trang trí và Tiêu đề căn giữa */}
      <div style={styles.topSection}>
        <img src={moonImg} alt="Mặt trăng Tử Vi" style={styles.moonImage} />
      </div>

      {/* PHẦN DƯỚI: Khung Đăng Nhập */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Đăng nhập</h3>

        <form onSubmit={handleLogin}>
    
          {/* Email / SĐT */}
          <div style={styles.inputGroup}>
            <input
              type="text"
              placeholder="Email hoặc số điện thoại"
              value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            />
          </div>

          {/* Mật khẩu */}
            <div style={styles.inputGroup}>
              <input
                type="password"
                placeholder="Mật khẩu"
                style={styles.input}
              />
            </div>

          {/* Button đăng nhập */}
            <button type="submit" style={styles.submitButton}>
              Đăng nhập
            </button>

          {/* Quên mật khẩu */}
            <div style={styles.forgotWrapper}>
            <span style={styles.forgotText}>Quên mật khẩu?</span>
            </div>

        </form>

        {/* Social login nằm dưới cùng */}
        <button style={{ ...styles.socialButton, backgroundColor: "#3B5E99" }}>
          Đăng nhập bằng Facebook
        </button>

        <button style={{ ...styles.socialButton, backgroundColor: "#C56336" }}>
          Đăng nhập bằng Google
        </button>

      </div>

    </div>
  );
}

// BỘ TÙY CHỈNH GIAO DIỆN MỚI (CĂN GIỮA DỌC)
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column", // Xếp các khối theo chiều dọc
    alignItems: "center",    // Căn giữa theo chiều ngang
    justifyContent: "center",// Căn giữa theo chiều dọc
    backgroundColor: "#FDF6EA", 
    fontFamily: "Arial, sans-serif",
    color: "#333",
    padding: "20px", // Giữ khoảng cách an toàn 2 bên cho mobile
  },
  topSection: {
    textAlign: "center",
    marginBottom: "30px", // Khoảng cách từ chữ xuống form đăng nhập
  },
  moonImage: {
    width: "500px", // Bạn có thể tăng giảm số này để ảnh to/nhỏ theo ý muốn
    height: "auto",
    marginBottom: "15px",
  },
  heading: {
    fontSize: "28px",
    fontWeight: "normal",
    lineHeight: "1.4",
    color: "#333",
    margin: "0",
  },
  forgotWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "10px",
    marginBottom: "20px",
  },

  forgotText: {
    fontSize: "13px",
    color: "#051A30",
    cursor: "pointer",
  },

  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "15px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)", 
    width: "100%",
    maxWidth: "400px",
    boxSizing: "border-box", // Ép khung không bị tràn viền
  },
  cardTitle: {
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "20px",
    color: "#333",
  },
  socialButton: {
    width: "100%",
    padding: "12px",
    color: "white",
    border: "none",
    borderRadius: "5px",
    marginBottom: "15px",
    fontSize: "15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
  icon: {
    marginRight: "10px",
    fontSize: "18px",
  },
  divider: {
    textAlign: "center",
    fontSize: "13px",
    color: "#666",
    margin: "25px 0",
  },
  inputGroup: {
    position: "relative",
    marginBottom: "20px",
  },
  label: {
    position: "absolute",
    top: "-10px",
    left: "15px",
    backgroundColor: "white",
    padding: "0 5px",
    fontSize: "12px",
    color: "#666",
  },
  input: {
    width: "100%",
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    boxSizing: "border-box",
    outline: "none",
    fontSize: "14px",
  },
  submitButton: {
    width: "100%",
    padding: "15px",
    backgroundColor: "#051A30", 
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  }
};