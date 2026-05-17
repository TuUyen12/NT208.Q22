import PalaceCell from "./PalaceCell";
import CenterInfo from "./CenterInfo";

export default function ChartLayout({
  palaceData,
  centerInfo,
}) {

  if (!palaceData?.length || !centerInfo) {
    console.log(palaceData);
    console.log(centerInfo);
    return null;
  }
  return (
    <div style={styles.layout}>

      {/* TOP ROW */}
      <div style={{ gridColumn: "1", gridRow: "1" }}>
        <PalaceCell {...palaceData[0]} />
      </div>

      <div style={{ gridColumn: "2", gridRow: "1" }}>
        <PalaceCell {...palaceData[1]} />
      </div>

      <div style={{ gridColumn: "3", gridRow: "1" }}>
        <PalaceCell {...palaceData[2]} />
      </div>

      <div style={{ gridColumn: "4", gridRow: "1" }}>
        <PalaceCell {...palaceData[3]} />
      </div>

      {/* LEFT */}
      <div style={{ gridColumn: "1", gridRow: "2" }}>
        <PalaceCell {...palaceData[4]} />
      </div>

      <div style={{ gridColumn: "1", gridRow: "3" }}>
        <PalaceCell {...palaceData[5]} />
      </div>

      {/* CENTER */}
      <div
        style={{
          gridColumn: "2 / 4",
          gridRow: "2 / 4",
        }}
      >
        <CenterInfo info={centerInfo} />
      </div>

      {/* RIGHT */}
      <div style={{ gridColumn: "4", gridRow: "2" }}>
        <PalaceCell {...palaceData[6]} />
      </div>

      <div style={{ gridColumn: "4", gridRow: "3" }}>
        <PalaceCell {...palaceData[7]} />
      </div>

      {/* BOTTOM */}
      <div style={{ gridColumn: "1", gridRow: "4" }}>
        <PalaceCell {...palaceData[8]} />
      </div>

      <div style={{ gridColumn: "2", gridRow: "4" }}>
        <PalaceCell {...palaceData[9]} />
      </div>

      <div style={{ gridColumn: "3", gridRow: "4" }}>
        <PalaceCell {...palaceData[10]} />
      </div>

      <div style={{ gridColumn: "4", gridRow: "4" }}>
        <PalaceCell {...palaceData[11]} />
      </div>

    </div>
  );
}

const styles = {
  layout: {
    width: "fit-content",

    margin: "0 auto",

    display: "grid",

    gridTemplateColumns: "228px 228px 228px 228px",

    gridTemplateRows: "319px 319px 319px 319px",

    gap: 0,
  },
};