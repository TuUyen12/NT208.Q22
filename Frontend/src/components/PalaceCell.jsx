import React from "react";
import {
  newPaletteStyles,
  BRANCH_MONTH,
} from "../styles/chartStyles";
import { translateStemBranch } from "../utils/translate";
import { EARTHLY_BRANCHES } from "../pages/translations";

// ============================================================
// PHÂN LOẠI SAO
// ============================================================

const GOOD_MINOR = new Set([
  "Văn Xương", "Văn Khúc", "Tả Phụ", "Hữu Bật", "Thiên Khôi", "Thiên Việt",
  "Lộc Tồn", "Thiên Mã", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa",
  "Thiên Hỷ", "Hồng Loan", "Long Trì", "Phụng Các", "Thiên Quan", "Thiên Phúc",
  "Ân Quang", "Thiên Quý", "Tam Thai", "Bát Tọa", "Đài Phụ", "Phong Cáo",
  "Thanh Long", "Long Đức", "Thiên Đức", "Nguyệt Đức", "Hỷ Thần",
  "Thiên Diêu", "Thiên Vu", "Giải Thần", "Niên Giải",
]);

const BAD_MINOR = new Set([
  "Hóa Kỵ", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp",
  "Thiên Hình", "Âm Sát", "Cô Thần", "Quả Tú", "Phá Toái", "Đại Hao", "Tiểu Hao",
  "Phi Liêm", "Kiếp Sát", "Tai Sát", "Thiên Sát", "Bệnh Phù", "Bạch Hổ",
  "Tang Môn", "Điếu Khách", "Tuế Phá", "Quán Sách", "Hối Khí", "Hàm Trì",
]);

const getMinorStarColor = (starName) => {
  if (GOOD_MINOR.has(starName)) return "#4ade80";
  if (BAD_MINOR.has(starName)) return "#f87171";
  return "#93c5fd";
};

const MAJOR_BRIGHTNESS_COLOR = {
  "M": "#f9e4ff", "V": "#d8b4fe", "Đ": "#e9d5ff",
  "B": "#c4b5fd", "H": "#9c86e3", "R": "#7c6dba",
};

const CURRENT_YEAR = new Date().getFullYear();

// ============================================================
// PALACE CELL
// ============================================================

const PalaceCell = ({
  palace,
  isMenh,
  isBody,
  tuanKhong,
  rawBranch,
  isCurrentYear,
  rawPalace,
}) => {
  if (!palace) {
    return <div style={newPaletteStyles.cell} />;
  }

  const isTuan = tuanKhong?.has(rawBranch);
  const month = BRANCH_MONTH[rawBranch];
  const majorStars = palace.majorStars || [];
  const allMinor = [...(palace.minorStars || []), ...(palace.adjectiveStars || [])];
  const half = Math.ceil(allMinor.length / 2);
  const leftMinor = allMinor.slice(0, half);
  const rightMinor = allMinor.slice(half);

  const firstLineParts = [
    EARTHLY_BRANCHES[rawBranch] || rawBranch,
    palace.changsheng12Vi,
    month ? `Tháng ${month}` : null,
  ].filter(Boolean);
  const firstLine = firstLineParts.join(" - ");

  return (
    <div
      style={{
        ...newPaletteStyles.cell,
        borderColor: isMenh ? "#edb1ff" : isBody ? "#a5f3fc" : "#9C46BE",
        borderWidth: (isMenh || isBody) ? "2.5px" : "1.5px",
        boxShadow: isMenh
          ? "0 0 0 1px rgba(237,177,255,0.4)"
          : isBody
          ? "0 0 0 1px rgba(103,232,249,0.3)"
          : "none",
      }}
    >
      <div style={newPaletteStyles.content}>
        {/* HEADER */}
        <div style={newPaletteStyles.Header}>
          <span style={newPaletteStyles.StemBranch}>
            {translateStemBranch(rawPalace?.heavenlyStem, rawBranch)}
          </span>
          <span style={newPaletteStyles.PalaceName}>
            {isMenh && <span style={{ fontSize: "10px", background: "#edb1ff", color: "#4c1d95", borderRadius: 4, padding: "0 3px", marginRight: 3 }}>M</span>}
            {isBody && <span style={{ fontSize: "10px", background: "#a5f3fc", color: "#0c4a6e", borderRadius: 4, padding: "0 3px", marginRight: 3 }}>T</span>}
            {isTuan && <span style={{ fontSize: "10px", background: "#6ee7b7", color: "#064e3b", borderRadius: 4, padding: "0 3px", marginRight: 3 }}>Tuần</span>}
            {palace.name}
          </span>
          <span style={newPaletteStyles.Age}>
            {palace.decadal?.range
              ? `${palace.decadal.range[0]}-${palace.decadal.range[1]}`
              : palace.ageRange || ""}
          </span>
        </div>

        {/* MAIN STARS */}
        <div style={newPaletteStyles.MainStars}>
          {majorStars.length > 0 ? (
            majorStars.map((star, i) => (
              <div key={i}>
                <span style={{ color: MAJOR_BRIGHTNESS_COLOR[star.brightnessAbbr] || "#47A0A5", fontWeight: 700 }}>
                  {star.name}
                </span>
                {star.brightnessAbbr && (
                  <span style={{ fontSize: "11px", opacity: 0.7, marginLeft: 3, color: MAJOR_BRIGHTNESS_COLOR[star.brightnessAbbr] || "#888" }}>
                    ({star.brightnessAbbr})
                  </span>
                )}
                {star.mutagen && (
                  <span style={{ fontSize: "10px", color: "#f0abfc", background: "#f0abfc18", padding: "0 3px", borderRadius: 3, marginLeft: 3 }}>
                    {star.mutagen}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div style={{ fontSize: "14px", color: "#aaa", fontStyle: "italic" }}>— không chính tinh —</div>
          )}
        </div>

        {/* SIDE STARS */}
        {allMinor.length > 0 && (
          <div style={newPaletteStyles.sideContainer}>
            <div style={newPaletteStyles.LeftStars}>
              {leftMinor.map((star, i) => (
                <div key={i} style={{ color: getMinorStarColor(star.name) }}>
                  {star.name}
                  {star.brightnessAbbr && <span style={{ fontSize: "9px", opacity: 0.6, marginLeft: 2 }}>({star.brightnessAbbr})</span>}
                  {star.mutagen && <span style={{ fontSize: "9px", color: "#f0abfc", marginLeft: 2 }}>{star.mutagen}</span>}
                </div>
              ))}
            </div>
            <div style={newPaletteStyles.RightStars}>
              {rightMinor.map((star, i) => (
                <div key={i} style={{ color: getMinorStarColor(star.name) }}>
                  {star.name}
                  {star.brightnessAbbr && <span style={{ fontSize: "9px", opacity: 0.6, marginLeft: 2 }}>({star.brightnessAbbr})</span>}
                  {star.mutagen && <span style={{ fontSize: "9px", color: "#f0abfc", marginLeft: 2 }}>{star.mutagen}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM */}
        <div style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          fontSize: "10px",
          color: "#5D277B",
          fontFamily: "Manrope, sans-serif",
          paddingTop: 4,
        }}>
          {firstLine && <div>{firstLine}</div>}
          {palace.boshi12Vi && <div>{palace.boshi12Vi}</div>}
          {palace.jiangqian12Vi && <div>{palace.jiangqian12Vi}</div>}
          {isCurrentYear && (
            <div style={{
              background: "#fbbf2420",
              border: "1px solid #fbbf2460",
              borderRadius: 4,
              padding: "1px 5px",
              width: "fit-content",
              color: "#b45309",
              fontWeight: 700,
            }}>
              TH {CURRENT_YEAR}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PalaceCell);