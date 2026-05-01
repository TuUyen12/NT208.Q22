import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { astro } from "iztro";
import { Background, C, GlobalStyles, Header } from "./Login";
import {
  translateAstrolabe,
  EARTHLY_BRANCHES,
  BRIGHTNESS_COLOR,
  HEAVENLY_STEMS,
  NAYIN,
  translateNayin,
} from "./translations";

// ============================================================
// VỊ TRÍ 12 ĐỊA CHI TRÊN BẢNG 4×4
// ============================================================
const BRANCH_POSITION = {
  巳: [0, 0], 午: [0, 1], 未: [0, 2], 申: [0, 3],
  酉: [1, 3], 戌: [2, 3], 亥: [3, 3], 子: [3, 2],
  丑: [3, 1], 寅: [3, 0], 卯: [2, 0], 辰: [1, 0],
};
const BRANCH_ORDER = ["巳","午","未","申","酉","戌","亥","子","丑","寅","卯","辰"];

const BRANCH_MONTH = {
  寅: 1, 卯: 2, 辰: 3, 巳: 4, 午: 5, 未: 6,
  申: 7, 酉: 8, 戌: 9, 亥: 10, 子: 11, 丑: 12,
};

// ============================================================
// TUẦN KHÔNG (旬空)
// ============================================================
const calcTuanKhong = (stemIdx, branchIdx) => {
  const tuanStart = ((branchIdx - stemIdx % 10) + 12 * 2) % 12;
  const empty1 = (tuanStart + 10) % 12;
  const empty2 = (tuanStart + 11) % 12;
  const branches = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  return new Set([branches[empty1], branches[empty2]]);
};

// ============================================================
// TIỆN ÍCH
// ============================================================
const timeToIndex = (t) => {
  if (!t) return 0;
  const h = parseInt(t.split(":")[0]);
  if (h >= 23 || h < 1) return 0;
  if (h < 3) return 1; if (h < 5) return 2; if (h < 7) return 3;
  if (h < 9) return 4; if (h < 11) return 5; if (h < 13) return 6;
  if (h < 15) return 7; if (h < 17) return 8; if (h < 19) return 9;
  if (h < 21) return 10; return 11;
};
const genderToEn = (g) => (g === "Nam" ? "male" : "female");
const formatDate = (s) => {
  const [y, m, d] = s.split("-");
  return `${y}-${parseInt(m)}-${parseInt(d)}`;
};

// ============================================================
// PHÂN LOẠI SAO
// ============================================================
const GOOD_MINOR = new Set([
  "Văn Xương","Văn Khúc","Tả Phụ","Hữu Bật","Thiên Khôi","Thiên Việt",
  "Lộc Tồn","Thiên Mã","Hóa Lộc","Hóa Quyền","Hóa Khoa",
  "Thiên Hỷ","Hồng Loan","Long Trì","Phụng Các","Thiên Quan","Thiên Phúc",
  "Ân Quang","Thiên Quý","Tam Thai","Bát Tọa","Đài Phụ","Phong Cáo",
  "Thanh Long","Long Đức","Thiên Đức","Nguyệt Đức","Hỷ Thần",
  "Thiên Diêu","Thiên Vu","Giải Thần","Niên Giải",
]);
const BAD_MINOR = new Set([
  "Hóa Kỵ","Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp",
  "Thiên Hình","Âm Sát","Cô Thần","Quả Tú","Phá Toái","Đại Hao","Tiểu Hao",
  "Phi Liêm","Kiếp Sát","Tai Sát","Thiên Sát","Bệnh Phù","Bạch Hổ",
  "Tang Môn","Điếu Khách","Tuế Phá","Quán Sách","Hối Khí","Hàm Trì",
]);

const minorColor = (name, isMutagen) => {
  if (isMutagen) return "#f0abfc"; // tứ hóa
  if (BAD_MINOR.has(name)) return "#f87171";
  if (GOOD_MINOR.has(name)) return "#4ade80";
  return "#60a5fa";
};

// Màu độ sáng chính tinh
const MAJOR_BRIGHTNESS_COLOR = {
  "M": "#f9e4ff",  // Miếu – rực nhất
  "V": "#d8b4fe",  // Vượng
  "Đ": "#e9d5ff",  // Đắc
  "B": "#c4b5fd",  // Bình
  "H": "#9c86e3",  // Hãm
  "R": "#7c6dba",  // Rất hãm
};

// ============================================================
// GENERATE + TRANSLATE CHART
// ============================================================
const generateChartData = (name, dob, time, gender) => {
  try {
    const raw = astro.astrolabeBySolarDate(
      formatDate(dob), timeToIndex(time), genderToEn(gender), false, "zh-CN"
    );
    const translated = translateAstrolabe(raw);
    return { raw, astrolabe: translated, personal: { name, dob, time, gender } };
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Dịch ngày âm lịch
const translateChineseDate = (str) => {
  if (!str) return "";
  const NUMS = {
    "〇":"0","一":"1","二":"2","三":"3","四":"4","五":"5",
    "六":"6","七":"7","八":"8","九":"9","十":"10",
    "十一":"11","十二":"12","十三":"13","十四":"14","十五":"15",
    "十六":"16","十七":"17","十八":"18","十九":"19","二十":"20",
    "二十一":"21","二十二":"22","二十三":"23","二十四":"24","二十五":"25",
    "二十六":"26","二十七":"27","二十八":"28","二十九":"29","三十":"30",
  };
  let result = str
    .replace(/年/g, " Năm ")
    .replace(/月/g, " Tháng ")
    .replace(/日/g, " Ngày ");
  Object.entries(HEAVENLY_STEMS).forEach(([k, v]) => { result = result.replace(new RegExp(k, "g"), v); });
  Object.entries(EARTHLY_BRANCHES).forEach(([k, v]) => { result = result.replace(new RegExp(k, "g"), v); });
  ["三十","二十九","二十八","二十七","二十六","二十五","二十四","二十三","二十二","二十一","二十",
   "十九","十八","十七","十六","十五","十四","十三","十二","十一","十",
   "九","八","七","六","五","四","三","二","一"].forEach((k) => {
    if (NUMS[k]) result = result.replace(new RegExp(k, "g"), NUMS[k]);
  });
  return result.trim();
};

const CURRENT_YEAR = new Date().getFullYear();

const TIME_RANGES = [
  "Tý (23–01h)","Sửu (01–03h)","Dần (03–05h)","Mão (05–07h)",
  "Thìn (07–09h)","Tỵ (09–11h)","Ngọ (11–13h)","Mùi (13–15h)",
  "Thân (15–17h)","Dậu (17–19h)","Tuất (19–21h)","Hợi (21–23h)",
];

// ============================================================
// COMPONENT: MinorStarPill
// ============================================================
const MinorStarPill = ({ star }) => {
  const isMutagen = !!star.mutagen;
  const col = minorColor(star.name, isMutagen);
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      padding: "1px 5px",
      borderRadius: 4,
      background: `${col}14`,
      border: `1px solid ${col}40`,
      fontSize: "0.6rem",
      color: col,
      lineHeight: 1.6,
      whiteSpace: "nowrap",
    }}>
      {star.name}
      {star.brightnessAbbr && (
        <span style={{ opacity: 0.7, fontSize: "0.5rem" }}>
          {star.brightnessAbbr}
        </span>
      )}
    </span>
  );
};

// ============================================================
// COMPONENT: MajorStar
// ============================================================
const MajorStarRow = ({ star }) => {
  const color = MAJOR_BRIGHTNESS_COLOR[star.brightnessAbbr] || "#e2e8f0";
  const isMutagen = !!star.mutagen;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{
        fontSize: "0.82rem",
        fontWeight: 700,
        color: color,
        fontFamily: "'Newsreader', serif",
        letterSpacing: "0.01em",
      }}>
        {star.name}
      </span>
      {star.brightnessAbbr && (
        <span style={{
          fontSize: "0.52rem",
          color: color,
          opacity: 0.75,
          background: `${color}20`,
          padding: "0 3px",
          borderRadius: 3,
          border: `1px solid ${color}30`,
        }}>
          {star.brightnessAbbr}
        </span>
      )}
      {isMutagen && (
        <span style={{
          fontSize: "0.5rem",
          color: "#f0abfc",
          background: "#f0abfc18",
          border: "1px solid #f0abfc40",
          padding: "0 3px",
          borderRadius: 3,
        }}>
          {star.mutagen}
        </span>
      )}
    </div>
  );
};

// ============================================================
// COMPONENT: PalaceCell
// ============================================================
const PalaceCell = ({ palace, isMenh, isBody, tuanKhong, rawBranch, isCurrentYear }) => {
  if (!palace) return <div style={styles.cell} />;

  const isTuan = tuanKhong?.has(rawBranch);
  const decRange = palace.decadal?.range;
  const decStem = palace.decadal?.heavenlyStem || "";
  const month = BRANCH_MONTH[rawBranch];
  const majorStars = palace.majorStars || [];
  const minorStars = palace.minorStars || [];
  const adjStars = palace.adjectiveStar || [];
  const allMinor = [...minorStars, ...adjStars];

  // Tứ hóa nổi bật (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ)
  const tuHoaInMajor = majorStars.filter(s => s.mutagen);
  const tuHoaInMinor = allMinor.filter(s => s.mutagen);

  // Tính khung viền
  let borderStyle = "1px solid rgba(255,255,255,0.06)";
  if (isMenh) borderStyle = "2px solid rgba(237,177,255,0.55)";
  else if (isBody) borderStyle = "2px solid rgba(103,232,249,0.45)";
  else if (isCurrentYear) borderStyle = "2px solid rgba(251,191,36,0.4)";

  let cellBg = "rgba(20,22,32,0.7)";
  if (isMenh) cellBg = "rgba(60,30,80,0.55)";
  else if (isBody) cellBg = "rgba(20,50,65,0.55)";

  return (
    <div style={{
      ...styles.cell,
      border: borderStyle,
      background: cellBg,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Corner glow */}
      {(isMenh || isBody) && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "40%", pointerEvents: "none",
          background: isMenh
            ? "linear-gradient(180deg,rgba(237,177,255,0.06) 0%,transparent 100%)"
            : "linear-gradient(180deg,rgba(103,232,249,0.05) 0%,transparent 100%)",
        }} />
      )}

      {/* ── HEADER: Cung tên + Chi ── */}
      <div style={styles.cellHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {isMenh && <span style={styles.badge.menh}>Mệnh</span>}
          {isBody && <span style={styles.badge.body}>Thân</span>}
          {isTuan && <span style={styles.badge.tuan}>旬</span>}
        </div>
        <span style={{ ...styles.earthlyBranch }}>
          {palace.earthlyBranch}
        </span>
      </div>

      {/* Tên cung */}
      <div style={{
        fontSize: "0.78rem",
        fontWeight: 700,
        fontFamily: "'Newsreader', serif",
        color: isMenh ? "#e9d5ff" : isBody ? "#a5f3fc" : "#c4b5fd",
        marginBottom: 3,
        letterSpacing: "0.02em",
      }}>
        {palace.name}
      </div>

      {/* Đại hạn */}
      {decStem && decRange && (
        <div style={styles.decadalBar}>
          <span style={styles.decadalStem}>{decStem}</span>
          <span style={styles.decadalRange}>
            {decRange[0]}–{decRange[1]}
          </span>
        </div>
      )}

      {/* ── CHÍNH TINH ── */}
      <div style={styles.majorSection}>
        {majorStars.length > 0 ? (
          majorStars.map((s, i) => <MajorStarRow key={i} star={s} />)
        ) : (
          <span style={{ fontSize: "0.6rem", color: "#4a4a5a", fontStyle: "italic" }}>
            — không chính tinh —
          </span>
        )}
      </div>

      {/* ── PHÂN CÁCH ── */}
      {allMinor.length > 0 && <div style={styles.divider} />}

      {/* ── SAO PHỤ (dạng pills wrap) ── */}
      {allMinor.length > 0 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          rowGap: 2,
        }}>
          {allMinor.map((s, i) => <MinorStarPill key={i} star={s} />)}
        </div>
      )}

      {/* ── FOOTER: Tháng + Tiểu hạn ── */}
      <div style={{
        marginTop: "auto",
        paddingTop: 4,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
      }}>
        {month && (
          <span style={styles.monthTag}>T.{month}</span>
        )}
        {isCurrentYear && (
          <span style={{
            fontSize: "0.55rem",
            color: "#fbbf24",
            background: "#fbbf2418",
            border: "1px solid #fbbf2440",
            padding: "1px 4px",
            borderRadius: 3,
          }}>
            Tiểu hạn {CURRENT_YEAR}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================
// COMPONENT: CenterCell
// ============================================================
const CenterCell = ({ personal, astrolabe, raw }) => {
  const { soul, body, fiveElementsClass, chineseDate } = astrolabe;

  // Nạp âm
  const nayin = raw?.chineseDateName || raw?.nayin || "";
  const nayinVi = translateNayin(nayin) || nayin;

  // Âm lịch
  const lunarDate = chineseDate ? translateChineseDate(chineseDate) : "";

  // Giờ sinh chữ
  const timeIdx = timeToIndex(personal.time);
  const timeName = TIME_RANGES[timeIdx];

  const formatDob = (dob) => {
    const [y, m, d] = dob.split("-");
    return `${d.padStart(2,"0")}/${m.padStart(2,"0")}/${y}`;
  };

  // Ngũ hành cục
  const nguHanh = fiveElementsClass || "";

  return (
    <div style={styles.centerCell}>
      {/* Tiêu đề nhỏ */}
      <div style={{ fontSize: "0.58rem", letterSpacing: "0.2em", color: "#7c6dba", marginBottom: 4, textTransform: "uppercase" }}>
        Tử Vi Đẩu Số
      </div>

      {/* Tên chủ nhân */}
      <div style={{
        fontFamily: "'Newsreader', serif",
        fontSize: "1.6rem",
        fontWeight: 700,
        color: "#fff",
        letterSpacing: "0.02em",
        lineHeight: 1.2,
        marginBottom: 10,
      }}>
        {personal.name}
      </div>

      {/* Thông tin cá nhân */}
      <div style={{
        width: "100%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "10px 12px",
        marginBottom: 10,
        fontSize: "0.65rem",
      }}>
        <CRow label="Dương lịch" value={formatDob(personal.dob)} />
        <CRow label="Âm lịch" value={lunarDate || "—"} />
        <CRow label="Giờ sinh" value={`${personal.time} · ${timeName}`} />
        <CRow label="Giới tính" value={personal.gender} />
      </div>

      {/* Ngũ hành cục + Nạp âm */}
      {(nguHanh || nayinVi) && (
        <div style={{
          width: "100%",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 10,
          fontSize: "0.65rem",
        }}>
          {nguHanh && <CRow label="Ngũ hành cục" value={nguHanh} highlight />}
          {nayinVi && <CRow label="Nạp âm mệnh" value={nayinVi} />}
        </div>
      )}

      {/* Mệnh chủ / Thân chủ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {soul && (
          <div style={styles.center.badge("#d8b4fe", "#4c1d95")}>
            <span style={{ opacity: 0.65, fontSize: "0.55rem" }}>Mệnh chủ</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{soul}</span>
          </div>
        )}
        {body && (
          <div style={styles.center.badge("#a5f3fc", "#0c4a6e")}>
            <span style={{ opacity: 0.65, fontSize: "0.55rem" }}>Thân chủ</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{body}</span>
          </div>
        )}
      </div>

      {/* Năm hiện tại */}
      <div style={{
        padding: "5px 16px",
        borderRadius: 999,
        border: "1px solid rgba(251,191,36,0.3)",
        color: "#fbbf24",
        fontSize: "0.65rem",
        letterSpacing: "0.12em",
      }}>
        NĂM {CURRENT_YEAR}
      </div>
    </div>
  );
};

const CRow = ({ label, value, highlight }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
    padding: "2px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  }}>
    <span style={{ color: "#5a5a7a", fontSize: "0.6rem", flexShrink: 0 }}>{label}</span>
    <span style={{
      color: highlight ? "#d8b4fe" : "#c4c4d4",
      fontSize: "0.63rem",
      fontWeight: highlight ? 600 : 400,
      textAlign: "right",
    }}>
      {value}
    </span>
  </div>
);

// ============================================================
// STYLES
// ============================================================
const styles = {
  gridWrapper: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
  },

  cell: {
    minHeight: 200,
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    borderRadius: 10,
    background: "rgba(20,22,32,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.06)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },

  cellHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    minHeight: 18,
  },

  earthlyBranch: {
    fontSize: "0.65rem",
    color: "#5a5a7a",
    fontFamily: "'Courier New', monospace",
  },

  badge: {
    menh: {
      fontSize: "0.52rem",
      padding: "1px 5px",
      borderRadius: 4,
      background: "rgba(237,177,255,0.15)",
      border: "1px solid rgba(237,177,255,0.4)",
      color: "#e9d5ff",
      fontWeight: 700,
      letterSpacing: "0.05em",
    },
    body: {
      fontSize: "0.52rem",
      padding: "1px 5px",
      borderRadius: 4,
      background: "rgba(103,232,249,0.12)",
      border: "1px solid rgba(103,232,249,0.35)",
      color: "#a5f3fc",
      fontWeight: 700,
    },
    tuan: {
      fontSize: "0.52rem",
      padding: "1px 4px",
      borderRadius: 4,
      background: "rgba(110,231,183,0.1)",
      border: "1px solid rgba(110,231,183,0.3)",
      color: "#6ee7b7",
      fontWeight: 700,
    },
  },

  decadalBar: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginBottom: 5,
    padding: "2px 6px",
    borderRadius: 5,
    background: "rgba(237,177,255,0.06)",
    border: "1px solid rgba(237,177,255,0.12)",
    width: "fit-content",
  },
  decadalStem: {
    fontSize: "0.65rem",
    color: "#edb1ff",
    fontWeight: 600,
  },
  decadalRange: {
    fontSize: "0.55rem",
    color: "#a78bfa",
    fontFamily: "'Courier New', monospace",
  },

  majorSection: {
    marginBottom: 4,
    minHeight: 22,
  },

  divider: {
    height: 1,
    background: "rgba(255,255,255,0.06)",
    margin: "5px 0",
  },

  monthTag: {
    fontSize: "0.55rem",
    color: "#4a4a6a",
    fontFamily: "'Courier New', monospace",
  },

  centerCell: {
    gridColumn: "2 / 4",
    gridRow: "2 / 4",
    borderRadius: 14,
    padding: "1.5rem",
    background: "rgba(15,17,28,0.85)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(100,80,130,0.25)",
    boxShadow: "0 0 60px rgba(120,80,200,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  center: {
    badge: (color, bg) => ({
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2,
      padding: "6px 14px",
      borderRadius: 8,
      background: `${bg}55`,
      border: `1px solid ${color}30`,
      color: color,
      flex: 1,
    }),
  },
};

// ============================================================
// LEGEND
// ============================================================
const Legend = () => (
  <div style={{
    marginTop: 12,
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    justifyContent: "center",
    fontSize: "0.6rem",
    color: "rgba(255,255,255,0.35)",
    padding: "8px 16px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.05)",
  }}>
    {[
      { color: "#f9e4ff", label: "Chính tinh Miếu (M)" },
      { color: "#c4b5fd", label: "Vượng (V) / Đắc (Đ)" },
      { color: "#9c86e3", label: "Bình (B) / Hãm (H)" },
      { color: "#4ade80", label: "Cát tinh" },
      { color: "#f87171", label: "Hung tinh" },
      { color: "#60a5fa", label: "Trung tính" },
      { color: "#f0abfc", label: "Tứ hóa" },
      { color: "#edb1ff", label: "Cung Mệnh" },
      { color: "#a5f3fc", label: "Thân cung" },
      { color: "#6ee7b7", label: "旬 Tuần không" },
      { color: "#fbbf24", label: "Tiểu hạn" },
    ].map(({ color, label }) => (
      <span key={label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{
          width: 8, height: 8, borderRadius: 2,
          background: color, display: "inline-block", flexShrink: 0,
        }} />
        {label}
      </span>
    ))}
  </div>
);

// ============================================================
// MAIN EXPORT
// ============================================================
export default function LaSoTuVi() {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("lasotuvi_form");
    if (!saved) { setError("Không có dữ liệu."); return; }
    try {
      const parsed = JSON.parse(saved);
      const chart = generateChartData(parsed.name, parsed.dob, parsed.time, parsed.gender);
      if (!chart?.astrolabe?.palaces?.length) {
        setError("Không tạo được lá số. Vui lòng thử lại.");
      } else {
        setChartData(chart);
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi dữ liệu.");
    }
  }, []);

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <p style={{ color: "#fca5a5", marginBottom: "1rem" }}>{error}</p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "8px 20px", borderRadius: 99,
            border: "1px solid rgba(167,139,250,0.4)",
            background: "transparent", color: "#c4b5fd", cursor: "pointer",
          }}
        >
          ← Quay lại
        </button>
      </div>
    </div>
  );

  if (!chartData) return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center", color: "#c4b5fd",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.2rem", marginBottom: 8 }}>✦</div>
        Đang tạo lá số...
      </div>
    </div>
  );

  const { astrolabe, personal, raw } = chartData;

  // Map palace theo địa chi gốc (raw)
  const palaceByBranch = {};
  astrolabe.palaces.forEach((p, i) => {
    const rb = raw.palaces[i]?.earthlyBranch;
    if (rb) palaceByBranch[rb] = p;
  });

  // Cung Mệnh, Thân cung
  const menhBranch = raw.palaces.find(p => p.name === "命宫")?.earthlyBranch;
  const bodyBranch = raw.earthlyBranchOfBodyPalace;

  // Cung tiểu hạn năm hiện tại
  // Tiểu hạn: mỗi năm cung tiểu hạn tính từ cung Dần (寅) của tuổi 1
  // Cách đơn giản: tính offset từ tuổi hiện tại
  const birthYear = parseInt(personal.dob.split("-")[0]);
  const currentAge = CURRENT_YEAR - birthYear;
  // Tiểu hạn bắt đầu từ cung Mệnh, theo chiều thuận/nghịch tuỳ gender
  // Cách xác định: cung tiểu hạn là cung có tháng tương ứng với (tuổi % 12)
  // Đơn giản hơn: cung có BRANCH_MONTH = (currentAge % 12) hoặc 12 nếu 0
  const tieuHanMonth = ((currentAge - 1) % 12) + 1;
  const tieuHanBranch = Object.entries(BRANCH_MONTH).find(([b, m]) => m === tieuHanMonth)?.[0];

  // Tuần không
  let tuanKhong = null;
  try {
    if (raw.rawDaysStemBranchIndex !== undefined) {
      const stemIdx = raw.rawDaysStemBranchIndex % 10;
      const branchIdx = raw.rawDaysStemBranchIndex % 12;
      tuanKhong = calcTuanKhong(stemIdx, branchIdx);
    }
  } catch (_) {}

  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const isCenter = (row === 1 || row === 2) && (col === 1 || col === 2);
        if (isCenter) {
          if (row === 1 && col === 1) {
            cells.push(
              <CenterCell key="center" personal={personal} astrolabe={astrolabe} raw={raw} />
            );
          }
          continue;
        }
        const rawBranch = BRANCH_ORDER.find(
          (b) => BRANCH_POSITION[b][0] === row && BRANCH_POSITION[b][1] === col
        );
        const palace = rawBranch ? palaceByBranch[rawBranch] : null;
        cells.push(
          <PalaceCell
            key={`${row}-${col}`}
            palace={palace}
            isMenh={rawBranch === menhBranch}
            isBody={rawBranch === bodyBranch}
            tuanKhong={tuanKhong}
            rawBranch={rawBranch}
            isCurrentYear={rawBranch === tieuHanBranch}
          />
        );
      }
    }
    return cells;
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", background: C.bg }}>
        <Background />
        <Header />

        <main style={{ padding: "130px 1rem 4rem", maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>

            {/* Tiêu đề */}
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <h1 style={{
                fontSize: "1.5rem",
                color: C.primary,
                margin: 0,
                fontFamily: "'Newsreader', serif",
                letterSpacing: "0.04em",
              }}>
                Lá Số Tử Vi
              </h1>
              <p style={{
                color: "rgba(255,255,255,0.3)",
                marginTop: 4,
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
              }}>
                {personal.name} · {personal.dob} · {personal.time} · {personal.gender}
              </p>
            </div>

            {/* Bảng 4×4 */}
            <div style={styles.gridWrapper}>
              {renderGrid()}
            </div>

            {/* Chú thích */}
            <Legend />

            {/* Nút điều hướng */}
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "8px 24px",
                  borderRadius: 99,
                  border: "1px solid rgba(167,139,250,0.35)",
                  background: "transparent",
                  color: "#c4b5fd",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(167,139,250,0.1)";
                  e.currentTarget.style.borderColor = "rgba(167,139,250,0.6)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(167,139,250,0.35)";
                }}
              >
                ← Nhập lại
              </button>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}