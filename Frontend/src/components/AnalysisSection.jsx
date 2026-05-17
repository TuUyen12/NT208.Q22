export default function AnalysisSection({ sections }) {
  return (
    <div style={styles.wrapper}>
      {/* Title */}
      <div style={styles.headerRow}>
        <div style={styles.line} />

        <h2 style={styles.title}>
          Luận Giải Tổng Thể
        </h2>

        <div style={styles.line} />
      </div>

      {/* Sections */}
      <div style={styles.sectionList}>
        {sections.map((section, index) => (
          <div
            key={index}
            style={styles.card}
          >
            <h3 style={styles.cardTitle}>
              {section.title}
            </h3>

            <p style={styles.content}>
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",

    zIndex: 2,

    maxWidth: "1200px",

    margin: "80px auto 0",

    paddingBottom: "120px",
  },

  headerRow: {
    display: "flex",

    alignItems: "center",

    gap: "24px",

    marginBottom: "40px",
  },

  line: {
    flex: 1,

    height: "1px",

    background:
      "rgba(255,255,255,0.18)",
  },

  title: {
    color: "#FFFFFF",

    fontSize: "72px",

    fontWeight: 500,

    fontStyle: "italic",

    whiteSpace: "nowrap",

    fontFamily:
      "Judson, serif",

    textShadow:
      "0 0 30px rgba(255,255,255,0.08)",
  },

  sectionList: {
    display: "flex",

    flexDirection: "column",

    gap: "28px",
  },

  card: {
    padding: "28px 32px",

    borderRadius: "24px",

    background:
      "linear-gradient(135deg, rgba(34,0,52,0.95) 0%, rgba(102,36,138,0.95) 100%)",

    border:
      "1px solid rgba(255,255,255,0.06)",

    boxShadow:
      "0 10px 40px rgba(0,0,0,0.22)",

    backdropFilter: "blur(10px)",
  },

  cardTitle: {
    color: "#FFFFFF",

    fontSize: "30px",

    fontStyle: "italic",

    fontWeight: 500,

    marginBottom: "18px",

    fontFamily:
      "Judson, serif",
  },

  content: {
    color: "rgba(255,255,255,0.92)",

    fontSize: "16px",

    lineHeight: 1.9,

    whiteSpace: "pre-line",
  },
};