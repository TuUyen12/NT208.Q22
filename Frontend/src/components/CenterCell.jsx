import React from "react";

import {
  styles,
} from "../styles/chartStyles";

import {
  translateChineseDate,
  timeToIndex,
  TIME_RANGES,
} from "../utils/translate";

import { translateNayin } from "../pages/translations";

const CURRENT_YEAR = new Date().getFullYear();

// ============================================================
// CRow COMPONENT
// ============================================================

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
// CENTER CELL
// ============================================================

const CenterCell = ({
  personal,
  astrolabe,
  raw,
}) => {
  const { soul, body, fiveElementsClass, chineseDate } = astrolabe;
  const nayin = raw?.chineseDateName || raw?.nayin || "";
  const nayinVi = translateNayin(nayin) || nayin;
  const lunarDate = chineseDate ? translateChineseDate(chineseDate) : "";
  const timeIdx = timeToIndex(personal.time);
  const timeName = TIME_RANGES[timeIdx];
  const nguHanh = fiveElementsClass || "";

  const formatDob = (dob) => {
    const [y, m, d] = dob.split("-");
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  };

  return (
    <div style={styles.centerCell}>
      <div style={{ fontSize: "0.58rem", letterSpacing: "0.2em", color: "#7c6dba", marginBottom: 4, textTransform: "uppercase" }}>
        Tử Vi Đẩu Số
      </div>

      <div
        style={{
          fontFamily: "'Newsreader', serif",
          fontSize: "1.6rem",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "0.02em",
          lineHeight: 1.2,
          marginBottom: 10,
        }}
      >
        {personal.name}
      </div>

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

export default CenterCell;