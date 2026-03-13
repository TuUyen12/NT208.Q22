import React from "react";
import "./App.css"; 

export default function App() {
  return (
    <div className="app-container">
      
      <header className="header">
        <div className="logo-container">
          {/* Bạn có thể thay icon này bằng <img src="/yingyang2.png" /> nếu đã bỏ hình vào folder public */}
          <span className="logo-icon">☯️</span> 
          <h2>Tử Vi Yinyang</h2>
        </div>
        <nav className="nav-menu">
          <span>Trang chủ</span>
          <span>Kiến thức</span>
          <span>Liên hệ</span>
          <span>Cài đặt</span>
        </nav>
      </header>

      <main className="hero-section">
        <h1>Khám Phá Lá Số Tử Vi</h1>
        <p>
          Hệ thống luận giải chi tiết cung mệnh, sự nghiệp, tình duyên và gia đạo. 
          Nhập thông tin của bạn để xem tổng quan vận hạn cuộc đời ngay hôm nay.
        </p>

        {/* --- KHUNG NHẬP THÔNG TIN TRUNG TÂM --- */}
        <div className="form-card">
          <div className="form-header">
            <span className="active-tab">Lập Lá Số Cá Nhân</span>
          </div>

          <form className="tuvi-form">
            <div className="input-group">
              <label>Ngày/tháng/năm sinh (Dương lịch)</label>
              <div className="row-3">
                <select>
                  <option value="" disabled selected hidden>Ngày</option>
                  {[...Array(31)].map((_, i) => (
                    <option key={i+1}>{i+1 < 10 ? `0${i+1}` : i+1}</option>
                  ))}
                </select>
                <select>
                  <option value="" disabled selected hidden>Tháng</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1}>Tháng {i+1}</option>
                  ))}
                </select>
                <select>
                  <option value="" disabled selected hidden>Năm</option>
                  <option>2004</option>
                  <option>2005</option>
                  <option>2006</option>
                </select>
              </div>
            </div>

            <div className="row-2">
              <div className="input-group">
                <label>Giờ sinh</label>
                <select>
                  <option value="" disabled selected hidden>Chọn giờ sinh</option>
                  <option>Không rõ giờ</option>
                  <option>Tý (23h - 1h)</option>
                  <option>Sửu (1h - 3h)</option>
                  <option>Dần (3h - 5h)</option>
                  <option>Mão (5h - 7h)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Giới tính</label>
                <select>
                  <option value="" disabled selected hidden>Giới tính</option>
                  <option>Nam</option>
                  <option>Nữ</option>
                </select>
              </div>
            </div>

            <button type="submit" className="submit-btn">Khám phá nào</button>
          </form>
        </div>
      </main>

      <section className="features-section">
        <div className="feature-card">
          <h3>🔮 Luận Giải 12 Cung</h3>
          <p>Phân tích sâu sắc các sao thủ mệnh, thân và các cung liên quan.</p>
        </div>
        <div className="feature-card">
          <h3>📅 Xem Hạn Từng Năm</h3>
          <p>Dự đoán cát hung, sao chiếu mệnh và hạn lưu niên chi tiết.</p>
        </div>
        <div className="feature-card">
          <h3>❤️ Định Hướng</h3>
          <p>Lời khuyên về công danh, sự nghiệp và tình duyên qua góc nhìn Tử Vi.</p>
        </div>
      </section>

    </div>
  );
}