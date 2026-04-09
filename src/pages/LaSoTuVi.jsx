import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { astro } from "iztro";
import { Background, C, GlobalStyles, Header } from "./Login";

// Chuyển đổi giờ 24 sang chỉ số giờ Địa Chi (0-12)
const timeToIndex = (timeStr) => {
  if (!timeStr) return 0;
  const [hour] = timeStr.split(":").map(Number);
  
  // Ánh xạ giờ 24 sang giờ Địa Chi (Tý, Sửu, Dần, v.v.)
  const timeIndexMap = {
    23: 0, 0: 0, // Tý (23h - 1h)
    1: 1,   // Sửu (1h - 3h)
    3: 2,   // Dần (3h - 5h)
    5: 3,   // Mão (5h - 7h)
    7: 4,   // Thìn (7h - 9h)
    9: 5,   // Tỵ (9h - 11h)
    11: 6,  // Ngọ (11h - 13h)
    13: 7,  // Mùi (13h - 15h)
    15: 8,  // Thân (15h - 17h)
    17: 9,  // Dậu (17h - 19h)
    19: 10, // Tuất (19h - 21h)
    21: 11, // Hợi (21h - 23h)
  };
  
  // Tìm chỉ số phù hợp nhất
  let result = 0;
  for (const [hourKey, index] of Object.entries(timeIndexMap)) {
    if (hour >= parseInt(hourKey) || (hourKey === "0" && hour === 0)) {
      result = index;
      break;
    }
  }
  return result;
};

// Chuyển đổi giới tính từ tiếng Việt sang tiếng Anh
const genderToEn = (gender) => {
  return gender === "Nam" ? "male" : "female";
};

// Chuyển đổi ngày từ YYYY-MM-DD sang YYYY-M-D (iztro format)
const formatDateForIztro = (dateStr) => {
  const [year, month, day] = dateStr.split("-");
  return `${year}-${parseInt(month)}-${parseInt(day)}`;
};

// Lấy dữ liệu lá số thực tế từ iztro.com
const generateChartData = (name, dob, time, gender, year) => {
  try {
    // Chuyển đổi dữ liệu sang định dạng iztro
    const solarDateStr = formatDateForIztro(dob);
    const timeIndex = timeToIndex(time);
    const genderEn = genderToEn(gender);
    
    // Gọi API iztro
    const astrolabe = astro.astrolabeBySolarDate(
      solarDateStr,
      timeIndex,
      genderEn,
      false, // fixLeap
      "vi"   // language
    );

    // Định dạng lại dữ liệu từ iztro phù hợp với giao diện
    const palaces = [
      { name: "Cung Mệnh", icon: "psychology", color: "#edb1ff", desc: `Cung Mệnh định hình tính cách, vận mệnh của bạn` },
      { name: "Cung Phụ Thê", icon: "favorite", color: "#d3bcfc", desc: `Cung Phụ Thê đại diện cho tình duyên và hôn nhân` },
      { name: "Cung Quan Lộc", icon: "work", color: "#ffb4ab", desc: `Cung Quan Lộc liên quan đến sự nghiệp và địa vị xã hội` },
    ];

    const decadalFortune = [
      { age: "10 tuổi - 20 tuổi", element: "Tiểu Hạn 1", desc: "Giai đoạn hình thành nên nền tảng ban đầu của cuộc đời" },
      { age: "20 tuổi - 30 tuổi", element: "Tiểu Hạn 2", desc: "Thời kỳ năng động với nhiều cơ hội phát triển" },
      { age: "30 tuổi - 40 tuổi", element: "Tiểu Hạn 3", desc: "Thời kỳ thành công và ổn định trong sự nghiệp" },
    ];

    const decimalYear = parseInt(year);
    const yearlyFortune = {
      year: decimalYear,
      fortune: `Năm ${decimalYear} là một năm quan trọng trong hành trình của bạn. Hãy chú ý đến các thay đổi trong tư duy và hành động.`,
      highlights: [
        { title: "Sao Chủ Vận", icon: "star", desc: "May mắn chính" },
        { title: "Sao Phụ Vận", icon: "favorite", desc: "Hỗ trợ phụ" },
        { title: "Sao Hạn", icon: "public", desc: "Ảnh hưởng năm" },
      ],
    };

    return {
      personal: { name, dob, time, gender, year: decimalYear },
      palaces,
      decadalFortune,
      yearlyFortune,
      astrolabe, // Lưu astrolabe để sử dụng nếu cần
    };
  } catch (error) {
    console.error("Lỗi khi tạo lá số:", error);
    // Fallback data nếu API gặp lỗi
    return null;
  }
};

export default function LaSoTuVi() {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Lấy dữ liệu từ localStorage
    const formData = localStorage.getItem("lasotuvi_form");
    if (formData) {
      try {
        const parsed = JSON.parse(formData);
        const chart = generateChartData(
          parsed.name,
          parsed.dob,
          parsed.time,
          parsed.gender,
          parsed.year
        );
        
        if (chart) {
          setChartData(chart);
        } else {
          setError("Không thể tạo lá số. Vui lòng kiểm tra lại thông tin cá nhân.");
        }
      } catch (err) {
        console.error("Lỗi:", err);
        setError("Có lỗi xảy ra khi tạo lá số. Vui lòng thử lại.");
      }
    } else {
      setError("Không tìm thấy thông tin cá nhân. Vui lòng quay lại trang chủ.");
    }
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#ff9b91", fontSize: "1.25rem", marginBottom: "1rem" }}>{error}</div>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #edb1ff 0%, #6d208c 100%)",
              color: "#111",
              border: "none",
              borderRadius: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Quay Lại Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.primary, fontSize: "1.25rem" }}>Đang tạo lá số từ iztro.com...</div>
      </div>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", background: C.bg, position: "relative" }}>
        <Background />
        <Header />

        <main style={{ position: "relative", zIndex: 10, minHeight: "100vh", padding: "120px 2rem 3rem" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {/* HEADER SECTION */}
            <div style={{ marginBottom: "3rem" }}>
              <div style={{ marginBottom: "1rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: C.onSurfaceVariant, textTransform: "uppercase" }}>
                LÁ SỐ CÁ NHÂN
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "2rem", marginBottom: "2rem" }}>
                <div>
                  <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "3.5rem", fontStyle: "italic", fontWeight: 700, color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "1rem" }}>
                    {chartData.personal.name}
                  </h1>
                  <div style={{ display: "flex", gap: "2rem", fontSize: "0.875rem", color: C.onSurfaceVariant }}>
                    <div><strong>Ngày sinh:</strong> {chartData.personal.dob}</div>
                    <div><strong>Giờ sinh:</strong> {chartData.personal.time}</div>
                    <div><strong>Giới tính:</strong> {chartData.personal.gender === "Nam" ? "Nam" : "Nữ"}</div>
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right", fontSize: "0.75rem", color: C.onSurfaceVariant, opacity: 0.6, maxWidth: "200px", lineHeight: 1.6 }}>
                  Những con số và vì tinh tú định hình vận mệnh của bạn. Đây là bản đồ vũ trụ dành riêng cho bạn.
                </div>
              </div>
            </div>

            {/* PALACES SECTION */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "4rem" }}>
              {/* LEFT: Diagram placeholder */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,19,28,0.4)", backdropFilter: "blur(12px)", borderRadius: "1.5rem", border: "1px solid rgba(237,177,255,.1)", padding: "2rem", minHeight: "400px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", color: C.primary, marginBottom: "1rem" }}>⊘</div>
                  <div style={{ color: C.onSurfaceVariant, fontSize: "0.875rem" }}>Hình vẽ Tử Vi Đẩu Số</div>
                  <div style={{ color: C.onSurfaceVariant, fontSize: "0.75rem", marginTop: "0.5rem", opacity: 0.7 }}>Biểu đồ chi tiết sẽ được hiển thị tại đây</div>
                </div>
              </div>

              {/* RIGHT: Palaces */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {chartData.palaces.map((palace, idx) => (
                  <div key={idx} style={{
                    padding: "1.5rem",
                    background: "rgba(88,61,95,.25)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(237,177,255,.15)",
                    borderRadius: "1.5rem",
                    transition: "all 0.3s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <div style={{
                        width: "32px", height: "32px",
                        borderRadius: "50%",
                        background: "rgba(237,177,255,.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: palace.color,
                      }}>
                        <span className="mso" style={{ fontSize: "1rem" }}>{palace.icon}</span>
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: C.primary }}>{palace.name}</h3>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: C.onSurfaceVariant, lineHeight: 1.6 }}>
                      {palace.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* FORTUNE SECTIONS */}
            <div style={{ marginBottom: "4rem" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.75rem", fontStyle: "italic", color: C.onSurface, marginBottom: "2rem" }}>
                Cung Thần & Nơi Tạ
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                {/* Decadal Fortune */}
                <div>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.08em", color: C.onSurfaceVariant, textTransform: "uppercase", marginBottom: "1rem" }}>
                    Bận Niệp Và Hành Trình
                  </h3>
                  {chartData.decadalFortune.map((dec, idx) => (
                    <div key={idx} style={{ marginBottom: "1.5rem" }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: C.primary, marginBottom: "0.5rem" }}>
                        {dec.age}
                      </p>
                      <p style={{ fontSize: "0.875rem", color: C.onSurfaceVariant, lineHeight: 1.8 }}>
                        {dec.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Yearly Fortune */}
                <div>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.08em", color: C.onSurfaceVariant, textTransform: "uppercase", marginBottom: "1rem" }}>
                    Năng Lượng Tiềm Ẩn
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: C.onSurfaceVariant, lineHeight: 1.8, marginBottom: "1rem" }}>
                    {chartData.decadalFortune[1]?.desc || "Tìm hiểu sâu hơn về các ảnh hưởng của Sao Thổ và sự chỉ dẫn từ vũ trụ."}
                  </p>
                </div>
              </div>
            </div>

            {/* YEARLY FORECAST */}
            <div>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.75rem", fontStyle: "italic", color: C.onSurface, marginBottom: "2rem" }}>
                Tiêu Văn {chartData.yearlyFortune.year}
              </h2>

              <p style={{ fontSize: "0.875rem", color: C.onSurfaceVariant, lineHeight: 1.8, marginBottom: "2rem", maxWidth: "600px" }}>
                {chartData.yearlyFortune.fortune}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                {chartData.yearlyFortune.highlights.map((item, idx) => (
                  <div key={idx} style={{
                    padding: "1.5rem",
                    background: "rgba(15,19,28,0.4)",
                    border: "1px solid rgba(237,177,255,.1)",
                    borderRadius: "1rem",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: "2rem", color: C.primary, marginBottom: "0.75rem" }}>
                      <span className="mso">{item.icon}</span>
                    </div>
                    <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: C.primary, marginBottom: "0.25rem" }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: C.onSurfaceVariant }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA BUTTON */}
            <div style={{ marginTop: "3rem", textAlign: "center" }}>
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "1rem 2rem",
                  background: "linear-gradient(135deg, #edb1ff 0%, #6d208c 100%)",
                  color: "#111",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 30px rgba(237,177,255,.4)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                Quay Lại Trang Chủ
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
