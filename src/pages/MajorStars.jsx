import { useNavigate } from "react-router-dom";
import { Background, C, GlobalStyles, Header } from "./Login";

// 14 Chính Tinh - Major Stars in Purple Star Astrology
const majorStarsData = [
  {
    name: "Tử Vi",
    chinese: "紫微",
    character: "Anh trai Chu Vũ Vương",
    meaning: "Hoàng Đế",
    description: "Sao chính của vũ trụ, đại diện cho sự chỉ huy, lãnh đạo, quyền lực và vận mệnh tối cao. Là sao quý nhất, xác định bản chất tính cách và hướng đi của con đường cuộc sống.",
    house: "Tâm chỉ",
    color: "#edb1ff"
  },
  {
    name: "Thiên Cơ",
    chinese: "天機",
    character: "Quân Sư / Thái Sư nhà Chu",
    meaning: "Trí Tuệ",
    description: "Sao thể hiện sự thông minh, sáng tạo, linh hoạt và khôn ngoan. Mang lại khả năng lập kế hoạch, phân tích sâu sắc và hiểu biết rộng mở về cuộc sống.",
    house: "Sáng tạo",
    color: "#d3bcfc"
  },
  {
    name: "Vũ Khúc",
    chinese: "武曲",
    character: "Chu Vũ Vương",
    meaning: "Quân Tướng",
    description: "Sao biểu thị sự kiên cường, quyết đoán, tràng năng lực hành động. Mạnh mẽ, dứt khoát, không sợ khó khăn, có khả năng lãnh đạo và chinh phục mục tiêu.",
    house: "Hành Động",
    color: "#ff9d8f"
  },
  {
    name: "Phá Quân",
    chinese: "破軍",
    character: "Trụ Vương",
    meaning: "Chiến Binh Phá Hoại",
    description: "Sao mang tính chất phá vỡ, thay đổi, cách tân và đưa lại sự mới mẻ. Đại diện cho sự phá phách, quyết tâm thay đổi và bắt đầu lại từ đầu.",
    house: "Biến Động",
    color: "#ffb4ab"
  },
  {
    name: "Thiên Lương",
    chinese: "天梁",
    character: "Cựu tổng binh nhà Thương",
    meaning: "Dũng Mãnh",
    description: "Sao duy dương của hệ thống, mang tính trường thọ, an toàn và bảo vệ. Là sao của vui vẻ, tinh thần thích ứng và khả năng vượt qua thử thách.",
    house: "Bảo Vệ",
    color: "#ffc8c8"
  },
  {
    name: "Thái Âm",
    chinese: "太陰",
    character: "Phu Nhân Hoàng Phi Hổ",
    meaning: "Phương Ẩm",
    description: "Sao duy âm của hệ thống, thể hiện sự trầm tĩnh, nhu mỹ, công ích và sự tích lũy. Mang lại những giá trị chân thực, sẻ chia và mối quan hệ gia đình.",
    house: "Tích Lũy",
    color: "#c4d4ff"
  },
  {
    name: "Thất Sát",
    chinese: "七殺",
    character: "Thủ Lĩnh Cấm Quân",
    meaning: "Quân Tướng Hùng Mạnh",
    description: "Sao của sự quyết liệt, mạnh mẽ lôi cuốn và bá chủ. Biểu thị khát vọng cao, dự vô bẩn, dứt khoát trong quyết định và sân sàng rủi ro.",
    house: "Thống Lĩnh",
    color: "#ffcb69"
  },
  {
    name: "Thiên Đồng",
    chinese: "天同",
    character: "Cha của Chu Vũ Vương",
    meaning: "Vui Vẻ",
    description: "Sao mang lại niềm vui, lạc quan, yêu thương và sự bảo vệ. Trưởng thành, giấu diếu và có khả năng nuôi dưỡng, giáo dục những người xung quanh.",
    house: "Hạnh Phúc",
    color: "#b8e5c9"
  },
  {
    name: "Cự Môn",
    chinese: "巨門",
    character: "Vợ của Khương Tử Nha (Thiên Cơ)",
    meaning: "Nói Lên Sự Thật",
    description: "Sao của sự chân thật lộ liễu, không giấu giếm, khéo léo công việc miệng. Biểu thị khả năng giao tiếp, thuyết phục và sư sâu sắc nhưng có thể gây hiểu lầm.",
    house: "Giao Tiếp",
    color: "#d4c9ff"
  },
  {
    name: "Liêm Trinh",
    chinese: "廉貞",
    character: "Gian thần nhà Thương",
    meaning: "Hạnh Phúc Giàu Có",
    description: "Sao của tính cách kiên nguyên, liêm khiết và có nguyên tắc cao. Mang tính quyết đoán, không dễ thỏa hiệp nhưng đáng tin cậy và có trách nhiệm.",
    house: "Nguyên Tắc",
    color: "#ffb8d1"
  },
  {
    name: "Thiên Phủ",
    chinese: "天府",
    character: "Hoàng Hậu / Lãnh Thổ Chủ",
    meaning: "Kho Tàng",
    description: "Sao của sự tích trữ, giàu có, an toàn và ổn định. Thể hiện yêu tiền, quản lý tốt, bảo vệ tài sản và có khả năng tích lũy sự giàu có.",
    house: "Tài Phú",
    color: "#ffe8aa"
  },
  {
    name: "Đấu Mủ",
    chinese: "鬥牲",
    character: "Tước Chủ",
    meaning: "Đấu Tranh",
    description: "Sao của sự cạnh tranh, không nhân nhượng, dốc hết mình trong công việc. Có năng lực mạnh, dám chọn cách khác, và khát vọng cao độc lập.",
    house: "Cạnh Tranh",
    color: "#e0b0ff"
  },
  {
    name: "Tham Lương",
    chinese: "貪狼",
    character: "Tướng Tham Dục",
    meaning: "Tham Vọng",
    description: "Sao của sự thầm khát, hứng thú, nhiều đam mê và ngoại tình. Biểu thị sự năng động, đa tài, nhưng cũng có thể bất ổn định và dễ bị cám dỗ.",
    house: "Đa Tài",
    color: "#ffb347"
  },
  {
    name: "Tú Khúc",
    chinese: "祿存",
    character: "Sao Lộc",
    meaning: "Mùa Vụ Luân Hồi",
    description: "Sao của sự may mắn, phúc lộc, cơ hội và tài lộc. Mang lại những dễ dàng, vinh dự và sự như ý trong công danh và sự nghiệp.",
    house: "Luân Hồi",
    color: "#90ee90"
  },
  {
    name: "Hóa Quyền",
    chinese: "化權",
    character: "Quyền Lực",
    meaning: "Biến Hóa Quyền Lực",
    description: "Sao của sự nổi tiếng, ảnh hưởng, lãnh đạo và kiểm soát. Thể hiện khả năng cuốn hút, thuyết phục và tập trung lực lượng để hoàn thành mục tiêu.",
    house: "Ảnh Hưởng",
    color: "#ffd4a3"
  }
];

const MajorStars = () => {
  const navigate = useNavigate();

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
                HỆ THỐNG SAO
              </div>
              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "3.5rem", fontStyle: "italic", fontWeight: 500, color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "1rem" }}>
                  14 Chính Tinh
                </h1>
                <p style={{fontFamily: "Manrope, sans-serif", fontSize: "1rem", color: C.onSurfaceVariant, maxWidth: "600px", lineHeight: 1.8 }}>
                  Tìm hiểu về 14 sao chính trong hệ thống Tử Vi Đẩu Số. Mỗi ngôi sao đại diện cho một khía cạnh khác nhau của tính cách, vận mệnh và con đường cuộc đời của bạn.
                </p>
              </div>
            </div>

            {/* STARS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", marginBottom: "4rem" }}>
              {majorStarsData.map((star, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "2rem",
                    background: "rgba(88,61,95,.25)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(237,177,255,.15)",
                    borderRadius: "1.5rem",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(237,177,255,.4)";
                    e.currentTarget.style.background = "rgba(88,61,95,.35)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(237,177,255,.15)";
                    e.currentTarget.style.background = "rgba(88,61,95,.25)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Star indicator */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "4px",
                      background: star.color,
                      opacity: 0.6,
                    }}
                  />

                  {/* Star name */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: C.primary }}>
                      {star.name}
                    </h3>
                    <span style={{ fontSize: "0.875rem", color: C.onSurfaceVariant, opacity: 0.7 }}>
                      {star.chinese}
                    </span>
                  </div>

                  {/* Character info */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", color: C.onSurfaceVariant, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                      Nhân vật
                    </div>
                    <p style={{ fontSize: "0.875rem", color: C.onSurfaceVariant }}>
                      {star.character}
                    </p>
                  </div>

                  {/* Meaning */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", color: star.color, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                      Ý Nghĩa
                    </div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: C.primary }}>
                      {star.meaning}
                    </p>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: "0.875rem", color: C.onSurfaceVariant, lineHeight: 1.7, marginBottom: "1rem" }}>
                    {star.description}
                  </p>

                  {/* House info */}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid rgba(237,177,255,.1)" }}>
                    <div style={{ fontSize: "0.75rem", color: C.onSurfaceVariant }}>
                      <strong style={{ color: C.primary }}>Cung:</strong> {star.house}
                    </div>
                  </div>
                </div>
              ))}
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
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 30px rgba(237,177,255,.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                Quay Lại Trang Chủ
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default MajorStars;
