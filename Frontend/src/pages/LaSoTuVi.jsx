import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { astro } from "iztro";
import { GlobalStyles } from "./Login";
import { chartService } from "../services/chartService";

import {
  translateAstrolabe,
  EARTHLY_BRANCHES,
  translateNayin,
  translateStarName,
  timeToIndex,
  TIME_RANGES,
  translateStemBranch,
  translateChineseDate,
  MAJOR_BRIGHTNESS_COLOR,
  getMinorStarColor,
  calcTuanKhong,
  BRANCH_MONTH,
  translateStem,
  translateBranch,
  translateTruongSinh,
  translateThanSat,
} from "./translations";

import { styles, newPaletteStyles, CURRENT_YEAR } from "./Styles";

// ============================================================
// POSITION
// ============================================================

const BRANCH_POSITION = {
  巳: [0, 0],
  午: [0, 1],
  未: [0, 2],
  申: [0, 3],

  酉: [1, 3],
  戌: [2, 3],
  亥: [3, 3],
  子: [3, 2],

  丑: [3, 1],
  寅: [3, 0],
  卯: [2, 0],
  辰: [1, 0],
};

const BRANCH_ORDER = [
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
];

// ============================================================
// UTIL
// ============================================================

const formatDate = (s) => {
  const [y, m, d] = s.split("-");
  return `${y}-${parseInt(m)}-${parseInt(d)}`;
};

// ============================================================
// GENERATE CHART
// ============================================================

const generateChartData = (name, dob, time, gender) => {
  try {
    const raw = astro.astrolabeBySolarDate(
      formatDate(dob),
      timeToIndex(time),
      gender === "Nam" ? "male" : "female",
      false,
      "zh-CN"
    );

    const translated = translateAstrolabe(raw);

    translated.palaces = translated.palaces.map((p, i) => {
      const rawPalace = raw?.palaces?.[i] || {};

      return {
        ...p,

        rawEarthlyBranch: rawPalace.earthlyBranch,

        heavenlyStem: rawPalace.heavenlyStem,

        heavenlyStemVi: translateStem(rawPalace.heavenlyStem),

        earthlyBranchVi: translateBranch(rawPalace.earthlyBranch),

        changsheng12Vi: translateTruongSinh(rawPalace.changsheng12),

        boshi12Vi: translateStarName(rawPalace.boshi12),

        jiangqian12Vi: translateThanSat(rawPalace.jiangqian12),
      };
    });

    return {
      raw,
      astrolabe: translated,
      personal: { name, dob, time, gender },
    };
  } catch (err) {
    console.error(err);
    return null;
  }
};

// ============================================================
// COMPONENTS
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

  const allMinor = [
    ...(palace.minorStars || []),
    ...(palace.adjectiveStars || []),
  ];

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

        boxShadow: isMenh
          ? "0 0 0 1px rgba(237,177,255,0.4)"
          : isBody
          ? "0 0 0 1px rgba(103,232,249,0.3)"
          : "none",
      }}
    >
      <div style={newPaletteStyles.content}>
        <div style={newPaletteStyles.Header}>
          <span style={newPaletteStyles.StemBranch}>
            {translateStemBranch(
              rawPalace?.heavenlyStem,
              rawBranch
            )}
          </span>

          <span style={newPaletteStyles.PalaceName}>
            {isMenh && (
              <span
                style={{
                  fontSize: "10px",
                  background: "#edb1ff",
                  color: "#4c1d95",
                  borderRadius: 4,
                  padding: "0 3px",
                  marginRight: 3,
                }}
              >
                M
              </span>
            )}

            {isBody && (
              <span
                style={{
                  fontSize: "10px",
                  background: "#a5f3fc",
                  color: "#0c4a6e",
                  borderRadius: 4,
                  padding: "0 3px",
                  marginRight: 3,
                }}
              >
                T
              </span>
            )}

            {isTuan && (
              <span
                style={{
                  fontSize: "10px",
                  background: "#6ee7b7",
                  color: "#064e3b",
                  borderRadius: 4,
                  padding: "0 3px",
                  marginRight: 3,
                }}
              >
                Tuần
              </span>
            )}

            {palace.name}
          </span>

          <span style={newPaletteStyles.Age}>
            {palace.decadal?.range
              ? `${palace.decadal.range[0]}-${palace.decadal.range[1]}`
              : palace.ageRange || ""}
          </span>
        </div>

        <div style={newPaletteStyles.MainStars}>
          {majorStars.length > 0 ? (
            majorStars.map((star, i) => (
              <div key={i}>
                <span
                  style={{
                    color:
                      MAJOR_BRIGHTNESS_COLOR[
                        star.brightnessAbbr
                      ] || "#47A0A5",

                    fontWeight: 700,
                  }}
                >
                  {star.name}
                </span>

                {star.brightnessAbbr && (
                  <span
                    style={{
                      fontSize: "11px",
                      opacity: 0.7,
                      marginLeft: 3,

                      color:
                        MAJOR_BRIGHTNESS_COLOR[
                          star.brightnessAbbr
                        ] || "#888",
                    }}
                  >
                    ({star.brightnessAbbr})
                  </span>
                )}

                {star.mutagen && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#f0abfc",
                      background: "#f0abfc18",
                      padding: "0 3px",
                      borderRadius: 3,
                      marginLeft: 3,
                    }}
                  >
                    {star.mutagen}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div
              style={{
                fontSize: "14px",
                color: "#aaa",
                fontStyle: "italic",
              }}
            >
              — không chính tinh —
            </div>
          )}
        </div>

        {allMinor.length > 0 && (
          <div style={newPaletteStyles.sideContainer}>
            <div style={newPaletteStyles.LeftStars}>
              {leftMinor.map((star, i) => (
                <div
                  key={i}
                  style={{
                    color: getMinorStarColor(star.name),
                  }}
                >
                  {star.name}

                  {star.brightnessAbbr && (
                    <span
                      style={{
                        fontSize: "9px",
                        opacity: 0.6,
                        marginLeft: 2,
                      }}
                    >
                      ({star.brightnessAbbr})
                    </span>
                  )}

                  {star.mutagen && (
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#f0abfc",
                        marginLeft: 2,
                      }}
                    >
                      {star.mutagen}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div style={newPaletteStyles.RightStars}>
              {rightMinor.map((star, i) => (
                <div
                  key={i}
                  style={{
                    color: getMinorStarColor(star.name),
                  }}
                >
                  {star.name}

                  {star.brightnessAbbr && (
                    <span
                      style={{
                        fontSize: "9px",
                        opacity: 0.6,
                        marginLeft: 2,
                      }}
                    >
                      ({star.brightnessAbbr})
                    </span>
                  )}

                  {star.mutagen && (
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#f0abfc",
                        marginLeft: 2,
                      }}
                    >
                      {star.mutagen}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            fontSize: "10px",
            color: "#5D277B",
            fontFamily: "Manrope, sans-serif",
            paddingTop: 4,
          }}
        >
          {firstLine && <div>{firstLine}</div>}

          {palace.boshi12Vi && (
            <div>{palace.boshi12Vi}</div>
          )}

          {palace.jiangqian12Vi && (
            <div>{palace.jiangqian12Vi}</div>
          )}

          {isCurrentYear && (
            <div
              style={{
                background: "#fbbf2420",
                border: "1px solid #fbbf2460",
                borderRadius: 4,
                padding: "1px 5px",
                width: "fit-content",
                color: "#b45309",
                fontWeight: 700,
              }}
            >
              TH {CURRENT_YEAR}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CRow = ({ label, value, highlight }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8,
      padding: "2px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}
  >
    <span
      style={{
        color: "#5a5a7a",
        fontSize: "0.6rem",
        flexShrink: 0,
      }}
    >
      {label}
    </span>

    <span
      style={{
        color: highlight ? "#d8b4fe" : "#c4c4d4",
        fontSize: "0.63rem",
        fontWeight: highlight ? 600 : 400,
        textAlign: "right",
      }}
    >
      {value}
    </span>
  </div>
);

const CenterCell = ({ personal, astrolabe, raw }) => {
  const {
    soul,
    body,
    fiveElementsClass,
    chineseDate,
  } = astrolabe;

  const nayin =
    raw?.chineseDateName || raw?.nayin || "";

  const nayinVi =
    translateNayin(nayin) || nayin;

  const lunarDate = chineseDate
    ? translateChineseDate(chineseDate)
    : "";

  const timeIdx = timeToIndex(personal.time);

  const timeName = TIME_RANGES[timeIdx];

  const nguHanh = fiveElementsClass || "";

  const formatDob = (dob) => {
    const [y, m, d] = dob.split("-");

    return `${d.padStart(2, "0")}/${m.padStart(
      2,
      "0"
    )}/${y}`;
  };

  return (
    <div
      style={{
        ...styles.centerCell,

        background: "#FEFBFF",

        border: "1.5px solid #9C46BE",

        borderRadius: "10px",

        boxShadow: "none",

        backdropFilter: "none",
      }}
    >
      <div
        style={{
          fontSize: "0.58rem",
          letterSpacing: "0.2em",
          color: "#9C46BE",
          marginBottom: 4,
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        Tử Vi Đẩu Số
      </div>

      <div
        style={{
          fontFamily: "'Newsreader', serif",
          fontSize: "1.6rem",
          fontWeight: 700,
          color: "#5D277B",
          letterSpacing: "0.02em",
          lineHeight: 1.2,
          marginBottom: 10,
          textAlign: "center",
        }}
      >
        {personal.name}
      </div>

      <div
        style={{
          width: "100%",
          background: "#FFF8FD",
          border: "1px solid #E7C7F3",
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 10,
          fontSize: "0.65rem",
        }}
      >
        <CRow
          label="Dương lịch"
          value={formatDob(personal.dob)}
        />

        <CRow
          label="Âm lịch"
          value={lunarDate || "—"}
        />

        <CRow
          label="Giờ sinh"
          value={`${personal.time} · ${timeName}`}
        />

        <CRow
          label="Giới tính"
          value={personal.gender}
        />
      </div>

      {(nguHanh || nayinVi) && (
        <div
          style={{
            width: "100%",
            background: "#FFF8FD",
            border: "1px solid #E7C7F3",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 10,
            fontSize: "0.65rem",
          }}
        >
          {nguHanh && (
            <CRow
              label="Ngũ hành cục"
              value={nguHanh}
              highlight
            />
          )}

          {nayinVi && (
            <CRow
              label="Nạp âm mệnh"
              value={nayinVi}
            />
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          width: "100%",
        }}
      >
        {soul && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "8px 12px",
              borderRadius: 8,

              background: "#F7E8FF",

              border: "1px solid #EDB1FF",

              color: "#6D208C",
            }}
          >
            <span
              style={{
                opacity: 0.7,
                fontSize: "0.55rem",
              }}
            >
              Mệnh chủ
            </span>

            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              {soul}
            </span>
          </div>
        )}

        {body && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "8px 12px",
              borderRadius: 8,

              background: "#ECFEFF",

              border: "1px solid #A5F3FC",

              color: "#0C4A6E",
            }}
          >
            <span
              style={{
                opacity: 0.7,
                fontSize: "0.55rem",
              }}
            >
              Thân chủ
            </span>

            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              {body}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "5px 16px",
          borderRadius: 999,

          border: "1px solid #FBBF24",

          background: "#FFF8E6",

          color: "#B45309",

          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
        }}
      >
        NĂM {CURRENT_YEAR}
      </div>
    </div>
  );
};

const Legend = () => (
  <div
    style={{
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
    }}
  >
    {[
      {
        color: "#f9e4ff",
        label: "Chính tinh Miếu (M)",
      },

      {
        color: "#c4b5fd",
        label: "Vượng (V) / Đắc (Đ)",
      },

      {
        color: "#9c86e3",
        label: "Bình (B) / Hãm (H)",
      },

      {
        color: "#4ade80",
        label: "Cát tinh",
      },

      {
        color: "#f87171",
        label: "Hung tinh",
      },

      {
        color: "#93c5fd",
        label: "Trung tính",
      },

      {
        color: "#f0abfc",
        label: "Tứ hóa",
      },

      {
        color: "#edb1ff",
        label: "Cung Mệnh",
      },

      {
        color: "#a5f3fc",
        label: "Thân cung",
      },

      {
        color: "#6ee7b7",
        label: "Tuần không",
      },

      {
        color: "#fbbf24",
        label: "Tiểu hạn",
      },
    ].map(({ color, label }) => (
      <span
        key={label}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: color,
            display: "inline-block",
            flexShrink: 0,
          }}
        />

        {label}
      </span>
    ))}
  </div>
);

// ============================================================
// FONT LOADER
// ============================================================

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        background: #0f131c;
        color: #dfe2ef;
        font-family: 'Manrope', sans-serif;
      }

      .font-headline {
        font-family: 'Cormorant Garamond', serif;
      }

      .nav-link {
        color: #d0c2d3;
        font-family: 'Manrope', sans-serif;
        font-size: 0.9rem;
        text-decoration: none;
        transition: color 0.3s;
      }

      .nav-link:hover {
        color: #edb1ff;
      }

      .btn-primary {
        background: linear-gradient(135deg, #edb1ff, #6d208c);
        color: white;
        border: none;
        border-radius: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: box-shadow 0.3s, transform 0.15s;
      }

      .btn-primary:hover {
        box-shadow: 0 0 30px -5px rgba(237,177,255,0.4);
      }

      .btn-primary:active {
        transform: scale(0.98);
      }

      @media (max-width: 768px) {
        .nav-links {
          display: none;
        }
      }
    `}</style>
  );
}

// ============================================================
// HEADER
// ============================================================

function NewHeader({ onLoginClick }) {
  const navigate = useNavigate();

  const navItems = [
    { label: "Tra cứu", to: "/" },
    { label: "Chatbot", to: "/chatbot" },
    { label: "14 Chính tinh", to: "/major-stars" },
    { label: "Blog", to: "/" },
    { label: "Liên hệ", to: "contact" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 50,
        background: "rgba(15,19,28,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          className="font-headline"
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "2.5rem",
            color: "#FFFFFF",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          YinYang
        </div>

        <div
          className="nav-links"
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          {navItems.map((item) => (
            <span
              key={item.label}
              className="nav-link"
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (item.to === "contact") {
                  const el =
                    document.getElementById("contact");

                  if (el) {
                    window.scrollTo({
                      top: el.offsetTop - 80,
                      behavior: "smooth",
                    });
                  }
                } else {
                  navigate(item.to);
                }
              }}
            >
              {item.label}
            </span>
          ))}
        </div>

        <button
          className="btn-primary"
          style={{
            padding: "0.55rem 1.5rem",
            fontSize: "0.95rem",
            borderRadius: "0.75rem",
            fontFamily: "'Manrope', sans-serif",
          }}
          onClick={onLoginClick}
        >
          Login
        </button>
      </div>
    </nav>
  );
}

// ============================================================
// AI INTERPRETATION
// ============================================================

function AIInterpretation({ data }) {
  if (!data) return null;

  const sections = [
    { key: "overall", label: "Tổng quan" },

    { key: "cung_menh", label: "Cung Mệnh" },

    { key: "cung_tai_bach", label: "Tài Bạch" },

    { key: "cung_quan_loc", label: "Quan Lộc" },

    { key: "cung_phu_the", label: "Phu Thê" },

    { key: "dai_han", label: "Đại Hạn" },

    { key: "luu_y", label: "Lưu Ý" },
  ].filter((s) => data[s.key]);

  if (sections.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "3rem",
        background: "rgba(15,17,28,0.7)",
        border:
          "1px solid rgba(100,80,130,0.25)",
        borderRadius: 14,
        padding: "1.5rem 2rem",
        backdropFilter: "blur(12px)",
        color: "#d0c2d3",
        maxWidth: "800px",
        marginInline: "auto",
      }}
    >
      <h2
        style={{
          color: "#edb1ff",
          fontFamily: "'Newsreader', serif",
          fontSize: "1.4rem",
          marginBottom: "1.5rem",
          letterSpacing: "0.04em",
          textAlign: "center",
        }}
      >
        ✦ Luận Giải Tử Vi
      </h2>

      {sections.map(({ key, label }) => (
        <div
          key={key}
          style={{ marginBottom: "1.4rem" }}
        >
          <div
            style={{
              color: "#c4b5fd",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "0.4rem",
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontSize: "0.9rem",
              lineHeight: 1.75,
              whiteSpace: "pre-wrap",
              opacity: 0.9,
            }}
          >
            {data[key]}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================

export default function LaSoTuVi() {
  const navigate = useNavigate();

  const location = useLocation();

  const [chartData, setChartData] =
    useState(null);

  const [error, setError] = useState(null);

  const [interpretation, setInterpretation] =
    useState(null);

  const [interpreting, setInterpreting] =
    useState(false);

  useEffect(() => {
    const formData = location.state;

    if (!formData) {
      setError("Không có dữ liệu");
      return;
    }

    try {
      const {
        name,
        birthDate,
        birthHour,
        gender,
      } = formData;

      const genderVi =
        gender === "male" ? "Nam" : "Nữ";

      const chart = generateChartData(
        name,
        birthDate,
        birthHour,
        genderVi
      );

      if (!chart?.astrolabe?.palaces?.length) {
        setError("Không tạo được lá số");
      } else {
        setChartData(chart);

        setInterpreting(true);

        chartService
          .save({
            name,
            gender: gender,
            dob_solar: birthDate,
            birth_hour: birthHour,
            chart_matrix: JSON.parse(
              JSON.stringify(chart.raw)
            ),
          })
          .then((saved) => {
            return chartService.interpret(
              saved.chart_id
            );
          })
          .then((res) => {
            if (
              !res.interpretation?._fallback
            ) {
              setInterpretation(
                res.interpretation
              );
            }
          })
          .catch((err) =>
            console.warn(
              "AI interpretation unavailable:",
              err
            )
          )
          .finally(() =>
            setInterpreting(false)
          );
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi dữ liệu");
    }
  }, [location.state]);

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10131B",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "#fff",
          }}
        >
          <p
            style={{
              color: "#fca5a5",
              marginBottom: "1rem",
            }}
          >
            {error}
          </p>

          <button
            onClick={() => navigate("/")}
            style={{
              padding: "8px 20px",
              borderRadius: 99,
              border:
                "1px solid rgba(167,139,250,0.4)",
              background: "transparent",
              color: "#c4b5fd",
              cursor: "pointer",
            }}
          >
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#c4b5fd",
          background: "#10131B",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "1.2rem",
              marginBottom: 8,
            }}
          >
            ✦
          </div>

          Đang tạo lá số...
        </div>
      </div>
    );
  }

  const { astrolabe, personal, raw } =
    chartData;

  const palaceByBranch = {};

  const rawPalaceByBranch = {};

  raw.palaces.forEach((rp, i) => {
    const translatedPalace =
      astrolabe.palaces[i];

    palaceByBranch[rp.earthlyBranch] =
      translatedPalace;

    rawPalaceByBranch[rp.earthlyBranch] = rp;
  });

  const menhBranch = raw.palaces.find(
    (p) => p.name === "命宫"
  )?.earthlyBranch;

  const bodyBranch =
    raw.earthlyBranchOfBodyPalace;

  const birthYear = parseInt(
    personal.dob.split("-")[0]
  );

  const currentAge =
    CURRENT_YEAR - birthYear;

  const tieuHanMonth =
    ((currentAge - 1) % 12) + 1;

  const tieuHanBranch = Object.entries(
    BRANCH_MONTH
  ).find(([, m]) => m === tieuHanMonth)?.[0];

  let tuanKhong = null;

  try {
    if (
      raw.rawDaysStemBranchIndex !==
      undefined
    ) {
      const stemIdx =
        raw.rawDaysStemBranchIndex % 10;

      const branchIdx =
        raw.rawDaysStemBranchIndex % 12;

      tuanKhong = calcTuanKhong(
        stemIdx,
        branchIdx
      );
    }
  } catch (e) {
    console.error(e);
  }

  const renderGrid = () => {
    const cells = [];

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const isCenter =
          (row === 1 || row === 2) &&
          (col === 1 || col === 2);

        if (isCenter) {
          if (row === 1 && col === 1) {
            cells.push(
              <CenterCell
                key="center"
                personal={personal}
                astrolabe={astrolabe}
                raw={raw}
              />
            );
          }

          continue;
        }

        const rawBranch =
          BRANCH_ORDER.find(
            (b) =>
              BRANCH_POSITION[b][0] === row &&
              BRANCH_POSITION[b][1] === col
          );

        const palace =
          palaceByBranch[rawBranch];

        const rawPalace =
          rawPalaceByBranch[rawBranch];

        cells.push(
          <PalaceCell
            key={`${row}-${col}`}
            palace={palace}
            rawPalace={rawPalace}
            rawBranch={rawBranch}
            tuanKhong={tuanKhong}
            isMenh={
              rawBranch === menhBranch
            }
            isBody={
              rawBranch === bodyBranch
            }
            isCurrentYear={
              rawBranch === tieuHanBranch
            }
          />
        );
      }
    }

    return cells;
  };

  return (
    <>
      <GlobalStyles />

      <FontLoader />

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          paddingTop: "120px",
          paddingBottom: "80px",

          background:
            "linear-gradient(to bottom, #10131B 0%, #3D2352 45%, #5D277B 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-200px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(237,177,255,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "-300px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "900px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(237,177,255,0.10) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <NewHeader
          onLoginClick={() =>
            navigate("/login")
          }
        />

        <main
          style={{
            padding: "0 1rem 4rem",
            maxWidth: 1300,
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              maxWidth: 1160,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "1rem",
              }}
            >
              <h1
                style={{
                  fontSize: "72px",
                  fontWeight: 700,
                  letterSpacing: "4px",
                  color: "#FFFFFF",
                  fontFamily:
                    "Cormorant Garamond, serif",
                  textShadow:
                    "0 0 40px rgba(237,177,255,0.25)",
                  marginBottom: "8px",
                }}
              >
                LÁ SỐ TỬ VI
              </h1>

              <h3
                style={{
                  fontSize: "16px",
                  lineHeight: 1.5,
                  color: "#E6D8F0",
                  maxWidth: "560px",
                  marginInline: "auto",
                  marginBottom: "32px",
                }}
              >
                Khám phá bản đồ định mệnh của bạn
                qua hệ thống Tử Vi Đông Phương cổ
                xưa, được giải mã dưới lăng kính
                của YinYang.
              </h3>
            </div>

            <div
              style={{
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              <button
                onClick={async () => {
                  const element =
                    document.querySelector(
                      "#chart-wrapper"
                    );

                  if (!element) return;

                  const html2canvas = (
                    await import("html2canvas")
                  ).default;

                  const canvas =
                    await html2canvas(element, {
                      scale: 2,
                      useCORS: true,
                      backgroundColor: null,
                    });

                  const image =
                    canvas.toDataURL("image/png");

                  const link =
                    document.createElement("a");

                  link.href = image;

                  link.download =
                    "la-so-tu-vi.png";

                  link.click();
                }}
                style={{
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  padding: "12px 20px",
                  borderRadius: "12px",

                  background:
                    "linear-gradient(135deg, #EDB1FF 0%, #9C46BE 100%)",

                  color: "#FFFFFF",

                  fontSize: "14px",
                  fontWeight: 700,
                  fontFamily:
                    "Manrope, sans-serif",

                  boxShadow:
                    "0 8px 24px rgba(156,70,190,0.35)",
                }}
              >
                ⬇ Tải Lá Số
              </button>
            </div>

            <div
              id="chart-wrapper"
              style={{
                padding: "5px",
                background: "#FFFBF5",
                borderRadius: "14px",
                overflow: "hidden",

                boxShadow:
                  "0 0 40px rgba(237,177,255,0.12)",

                border:
                  "1px solid rgba(255,255,255,0.08)",

                width: "fit-content",

                margin: "0 auto",
              }}
            >
              <div style={styles.gridWrapper}>
                {renderGrid()}
              </div>
            </div>

            <Legend />

            {interpreting && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "2rem",
                  color: "#a78bfa",
                  fontSize: "0.82rem",
                  letterSpacing: "0.06em",
                }}
              >
                ✦ Đang phân tích lá số...
              </div>
            )}

            {interpretation && (
              <AIInterpretation
                data={interpretation}
              />
            )}

            <div
              style={{
                textAlign: "center",
                marginTop: "1rem",
              }}
            >
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "8px 24px",
                  borderRadius: 99,

                  border:
                    "1px solid rgba(167,139,250,0.35)",

                  background: "transparent",

                  color: "#c4b5fd",

                  cursor: "pointer",

                  fontSize: "0.78rem",

                  transition:
                    "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgba(167,139,250,0.1)";

                  e.currentTarget.style.borderColor =
                    "rgba(167,139,250,0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "transparent";

                  e.currentTarget.style.borderColor =
                    "rgba(167,139,250,0.35)";
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