export default function CenterInfo({ info }) {
  const rows = [
    ["Mệnh", info.element],
    ["Ngày sinh (DL)", info.solarDate],
    ["Ngày sinh (AL)", info.lunarDate],
    ["Giờ sinh", info.birthHour],
    ["Giới tính", info.destiny],
    ["Năm xem", info.viewYear],
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>YinYang</h2>
      <div style={styles.divider} />
      <div style={styles.infoGrid}>
        {rows.map(([label, value], index) => (
          <div key={index} style={styles.row}>
            <div style={styles.label}>{label}</div>
            <div style={styles.value}>{value || "--"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// styles giữ nguyên
const styles = {
  container: {
    width: "456px",
    height: "638px",
    background: "#FCEEFE",
    border: "1px solid #9C46BE",
    borderRadius: "10px",
    paddingTop: "40px",
    paddingLeft: "48px",
    paddingRight: "48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "hidden",
  },
  title: {
    fontSize: "56px",
    lineHeight: 1,
    color: "#9C46BE",
    fontWeight: 700,
    margin: 0,
    fontFamily: "Cormorant Garamond, serif",
  },
  divider: {
    width: "18px",
    height: "2px",
    background: "#f8b7ea",
    borderRadius: "999px",
    marginTop: "18px",
    marginBottom: "42px",
  },
  infoGrid: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },
  row: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
  },
  label: {
    fontSize: "16px",
    lineHeight: 1.2,
    color: "#827A7A",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  value: {
    fontSize: "22px",
    lineHeight: 1.2,
    color: "#827A7A",
    fontWeight: 700,
    textAlign: "right",
  },
};