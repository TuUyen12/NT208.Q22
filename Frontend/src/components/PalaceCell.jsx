// PalaceCell.jsx
import {
  translateStar,
  translateBrightness,
  translateMutagen,
} from "../utils/translateData";

export default function PalaceCell({
  StemBranch,
  PalaceName,
  Age,
  majorStarsFull = [],
  minorStarsFull = [],
  adjectiveStarsFull = [],
}) {
 
const formatStar = (star) => {
  let name = translateStar(star.name);

  if (star.brightness) {
    const brightFull = translateBrightness(star.brightness); 
    
    const brightAbbrMap = {
      'miếu': 'M',
      'vượng': 'V',
      'đắc': 'Đ',
      'bình': 'B',
      'hãm': 'H'
    };
    const brightAbbr = brightAbbrMap[brightFull];
    if (brightAbbr) {
      name += ` (${brightAbbr})`;
    }
  }
  return name;
};

  // Chính tinh (giữa)
  const mainStarNames = majorStarsFull.map(formatStar);
  // Phụ tinh (bên trái)
  const minorStarNames = minorStarsFull.map(formatStar);
  // Tạp diệu (bên phải)
  const adjectiveStarNames = adjectiveStarsFull.map(formatStar);
  console.log({ StemBranch, PalaceName, Age });
  return (
    <div style={styles.cell}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.Header}>
          <span style={styles.StemBranch}>{StemBranch}</span>
          <span style={styles.PalaceName}>{PalaceName}</span>
          <span style={styles.Age}>{Age}</span>
        </div>

        {/* Main stars */}
        <div style={styles.MainStars}>
          {mainStarNames.map((star, i) => (
            <div key={i}>{star}</div>
          ))}
        </div>

        {/* Side stars: Left = minorStars, Right = adjectiveStars */}
        <div style={styles.sideContainer}>
          <div style={styles.LeftStars}>
            {minorStarNames.map((star, i) => (
              <div key={i}>{star}</div>
            ))}
          </div>
          <div style={styles.RightStars}>
            {adjectiveStarNames.map((star, i) => (
              <div key={i}>{star}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  cell: {
    width: "228px",
    height: "319px",
    background: "#FEFBFF",
    border: "1.5px solid #9C46BE",
    borderRadius: "10px",
    padding: "6px",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  Header: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  StemBranch: {
    width: "60px",
    fontSize: "11px",
    color: "#ED9B59",
    fontWeight: 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  PalaceName: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "18px",
    fontWeight: 700,
    color: "#111",
  },
  Age: {
    width: "50px",
    textAlign: "right",
    fontSize: "12px",
    fontWeight: 700,
    color: "#111",
  },
  MainStars: {
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    color: "#47A0A5",
    fontSize: "16px",
    lineHeight: 1.15,
    fontWeight: 500,
    fontFamily: "Montserrat, serif",
    minHeight: "48px",
  },
  sideContainer: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
    overflow: "hidden",
  },
  LeftStars: {
    width: "48%",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontSize: "12px",
    lineHeight: 1.2,
    fontFamily: "Montserrat, serif",
    fontWeight: 700,
    color: "#EA87AB",
  },
  RightStars: {
    width: "48%",
    display: "flex",
    flexDirection: "column",
    //alignItems: "flex-end",
    gap: "2px",
    //textAlign: "right",
    fontSize: "12px",
    lineHeight: 1.2,
    fontFamily: "Montserrat, serif",
    fontWeight: 700,
    color: "#709AE4",
  },
};