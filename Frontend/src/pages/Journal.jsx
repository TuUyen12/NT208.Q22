import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { journalService } from "../services/journalService";
import { GlobalStyles } from "./Login";

// ─── constants ───────────────────────────────────────────────────────────────

const DOW_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const STAR_META = {
  // Lưu Nhật
  "Lưu Nhật Lộc Tồn":    { icon:"💰", color:"#4ade80"  },
  "Lưu Nhật Kình Dương":  { icon:"⚔",  color:"#f87171"  },
  "Lưu Nhật Đà La":       { icon:"🌑", color:"#a78bfa"  },
  "Lưu Nhật Thiên Mã":    { icon:"🐎", color:"#67e8f9"  },
  "Lưu Nhật Tang Môn":    { icon:"🪦", color:"#94a3b8"  },
  "Lưu Nhật Bạch Hổ":     { icon:"🐯", color:"#fb923c"  },
  // Lưu Nguyệt
  "Lưu Nguyệt Lộc Tồn":   { icon:"💰", color:"#4ade80"  },
  "Lưu Nguyệt Kình Dương": { icon:"⚔",  color:"#f87171"  },
  "Lưu Nguyệt Đà La":      { icon:"🌑", color:"#a78bfa"  },
  "Lưu Nguyệt Thiên Mã":   { icon:"🐎", color:"#67e8f9"  },
  "Lưu Nguyệt Tang Môn":   { icon:"🪦", color:"#94a3b8"  },
  "Lưu Nguyệt Bạch Hổ":    { icon:"🐯", color:"#fb923c"  },
  // Lưu Niên
  "Lưu Niên Lộc Tồn":     { icon:"💰", color:"#4ade80"  },
  "Lưu Niên Kình Dương":   { icon:"⚔",  color:"#f87171"  },
  "Lưu Niên Đà La":        { icon:"🌑", color:"#a78bfa"  },
  "Lưu Niên Thiên Mã":     { icon:"🐎", color:"#67e8f9"  },
  "Lưu Niên Thái Tuế":     { icon:"☀", color:"#fbbf24"  },
  "Lưu Niên Tang Môn":     { icon:"🪦", color:"#94a3b8"  },
  "Lưu Niên Bạch Hổ":      { icon:"🐯", color:"#fb923c"  },
};
const HOA_COLORS = {
  "Hóa Lộc":"#4ade80","Hóa Quyền":"#fbbf24","Hóa Khoa":"#67e8f9","Hóa Kỵ":"#f87171",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function toISO(year, month, day) {
  return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

function todayISO() {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function buildCalendarDays(year, month) {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const offset = firstDow === 0 ? 6 : firstDow - 1;       // Mon-based
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

const MONTH_NAMES = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

// ─── sao luu display ─────────────────────────────────────────────────────────

function StarRow({ name, data }) {
  const meta = STAR_META[name] || { icon:"✦", color:"#c4b5fd" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px",
      borderRadius:6, background:"rgba(255,255,255,0.02)" }}>
      <span style={{ fontSize:"0.85rem", flexShrink:0 }}>{meta.icon}</span>
      <span style={{ fontWeight:700, fontSize:"0.72rem", color:meta.color, flex:1 }}>{name}</span>
      <span style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.3)" }}>
        {data.chi} · cung {data.house}
      </span>
    </div>
  );
}

function TuHoaChips({ tuHoa }) {
  if (!tuHoa || !Object.keys(tuHoa).length) return null;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:6 }}>
      {Object.entries(tuHoa).map(([star, hoa]) => (
        <span key={star} style={{
          fontSize:"0.62rem", padding:"2px 7px", borderRadius:999,
          background:`${HOA_COLORS[hoa]||"#fff"}18`,
          border:`1px solid ${HOA_COLORS[hoa]||"#fff"}35`,
          color: HOA_COLORS[hoa]||"#fff", fontWeight:600,
        }}>{star} {hoa}</span>
      ))}
    </div>
  );
}

function TierCard({ title, subtitle, data, starPrefix }) {
  if (!data) return null;
  if (data.placeholder) {
    return (
      <div style={{ padding:"10px 12px", borderRadius:10,
        background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize:"0.68rem", fontWeight:700, color:"rgba(237,177,255,0.5)",
          letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:5 }}>{title}</div>
        <div style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.25)", lineHeight:1.6 }}>
          {data.message}
        </div>
      </div>
    );
  }
  const starKeys = Object.keys(data).filter(k => k.startsWith(starPrefix) && typeof data[k] === "object" && data[k].chi);
  return (
    <div style={{ padding:"10px 12px", borderRadius:10,
      background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div style={{ fontSize:"0.68rem", fontWeight:700, color:"rgba(237,177,255,0.55)",
          letterSpacing:"0.1em", textTransform:"uppercase" }}>{title}</div>
        <div style={{ fontSize:"0.62rem", color:"rgba(255,255,255,0.25)" }}>{subtitle}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
        {starKeys.map(k => <StarRow key={k} name={k} data={data[k]} />)}
      </div>
      <TuHoaChips tuHoa={data.tu_hoa} />
    </div>
  );
}

function LuuSaoTiers({ luuSao }) {
  if (!luuSao) return (
    <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.2)", padding:"0.5rem 0" }}>
      Lưu ghi chú để xem thông tin sao Lưu.
    </div>
  );
  const nhat   = luuSao.luu_nhat;
  const nguyet = luuSao.luu_nguyet;
  const nien   = luuSao.luu_nien;
  const nhatSub = nhat ? `${nhat.can} ${nhat.chi}` : "";
  const nguyetSub = nguyet && !nguyet.placeholder ? `T.${nguyet.lunar_month} · ${nguyet.can} ${nguyet.chi}` : "";
  const nienSub  = nien ? `${nien.can} ${nien.chi} · ${nien.year}` : "";
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.7rem" }}>
      <TierCard title="Sao Nhật" subtitle={nhatSub} data={nhat} starPrefix="Lưu Nhật" />
      <TierCard title="Sao Nguyệt" subtitle={nguyetSub} data={nguyet} starPrefix="Lưu Nguyệt" />
      <TierCard title="Sao Niên" subtitle={nienSub} data={nien} starPrefix="Lưu Niên" />
    </div>
  );
}

// ─── components ──────────────────────────────────────────────────────────────

function NavBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const navLinks = [
    { label: "Tra cứu", to: "/" },
    { label: "Lá số", to: "/la-so" },
    { label: "Tử vi hôm nay", to: "/daily-horoscope" },
    { label: "Chatbot", to: "/chatbot" },
  ];
  return (
    <nav style={{
      position: "fixed", top: 0, width: "100%", zIndex: 50,
      background: "rgba(15,19,28,0.88)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"0.65rem 1.5rem", maxWidth:"1400px", margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", cursor:"pointer", flexShrink:0 }}
          onClick={() => navigate("/")}>
          <img src="/favicon3.png" alt="logo" style={{ width:"36px", height:"36px", objectFit:"contain" }} />
          <span style={{ fontFamily:"Cinzel,serif", fontSize:"1.65rem", color:"#fff" }}>YinYang</span>
        </div>
        <div style={{ display:"flex", gap:"1.5rem", alignItems:"center" }}>
          {navLinks.map(({ label, to }) => (
            <span key={label} onClick={() => navigate(to)}
              style={{ color:"#d0c2d3", fontFamily:"Manrope,sans-serif", fontSize:"0.9rem",
                cursor:"pointer", textDecoration:"none" }}>
              {label}
            </span>
          ))}
        </div>
        <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
          {user && <span style={{ fontSize:"0.8rem", color:"rgba(237,177,255,0.55)", fontFamily:"Manrope,sans-serif" }}>
            {user.email?.split("@")[0]}
          </span>}
          <button onClick={() => { logout(); navigate("/"); }}
            style={{ background:"linear-gradient(135deg,#edb1ff,#6d208c)", border:"none",
              borderRadius:"0.75rem", color:"#fff", fontWeight:700, cursor:"pointer",
              padding:"0.45rem 1.2rem", fontSize:"0.85rem", fontFamily:"Manrope,sans-serif" }}>
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function Journal() {
  const today = todayISO();
  const [year, setYear]           = useState(() => new Date().getFullYear());
  const [month, setMonth]         = useState(() => new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [logsMap, setLogsMap]         = useState({}); // dateStr → log
  const [text, setText]               = useState("");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [luuSao, setLuuSao]           = useState(null);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [loadingStars, setLoadingStars] = useState(false);
  const saveTimer = useRef(null);

  // load month logs
  useEffect(() => {
    journalService.listMonth(year, month)
      .then((logs) => {
        const map = {};
        logs.forEach((l) => { map[l.log_date] = l; });
        setLogsMap(map);
      })
      .catch(() => {});
  }, [year, month]);

  // load stars whenever selected date changes — independent of entry existence
  useEffect(() => {
    setLuuSao(null);
    setLoadingStars(true);
    journalService.getStars(selectedDate)
      .then(setLuuSao)
      .catch(() => setLuuSao(null))
      .finally(() => setLoadingStars(false));
  }, [selectedDate]);

  // load entry content for selected date
  useEffect(() => {
    setLoadingEntry(true);
    setSaved(false);
    const log = logsMap[selectedDate];
    if (log) {
      setText(log.content ?? "");
      setLoadingEntry(false);
    } else {
      journalService.getDay(selectedDate)
        .then((log) => { setText(log.content ?? ""); })
        .catch(() => { setText(""); })
        .finally(() => setLoadingEntry(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handleSave = useCallback(async (value) => {
    const content = value ?? text;
    setSaving(true);
    try {
      const existing = logsMap[selectedDate];
      let log;
      if (existing) {
        log = await journalService.update(selectedDate, content);
      } else {
        log = await journalService.save(selectedDate, content);
      }
      setLogsMap((m) => ({ ...m, [selectedDate]: log }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [text, selectedDate, logsMap]);

  // auto-save 1.5s after user stops typing
  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => handleSave(val), 1500);
  };

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const calCells = buildCalendarDays(year, month);
  const hasNote = (day) => day && !!logsMap[toISO(year, month, day)]?.content;

  return (
    <>
      <GlobalStyles />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f131c; color: #dfe2ef; font-family: 'Manrope', sans-serif; }
        .journal-textarea {
          width: 100%; min-height: 220px; resize: vertical;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(237,177,255,0.2);
          border-radius: 12px; color: #e2d9f3; padding: 14px 16px;
          font-size: 0.9rem; font-family: 'Manrope', sans-serif; line-height: 1.7;
          outline: none; transition: border-color 0.2s;
        }
        .journal-textarea:focus { border-color: rgba(237,177,255,0.5); }
        .cal-day {
          aspect-ratio: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          border-radius: 8px; cursor: pointer; font-size: 0.82rem;
          color: rgba(255,255,255,0.55); transition: all 0.15s; position: relative;
          border: 1px solid transparent;
        }
        .cal-day:hover { background: rgba(237,177,255,0.08); color: #edb1ff; }
        .cal-day.today { color: #fbbf24; font-weight: 700; }
        .cal-day.selected { background: rgba(237,177,255,0.15); border-color: rgba(237,177,255,0.4); color: #edb1ff; font-weight: 700; }
        .cal-day.has-note::after {
          content: ''; position: absolute; bottom: 4px;
          width: 4px; height: 4px; border-radius: 50%; background: #edb1ff;
        }
      `}</style>

      <NavBar />

      <div style={{ minHeight:"100vh", background:"linear-gradient(to bottom, #10131B 0%, #3D2352 55%, #5D277B 100%)",
        paddingTop:"100px", paddingBottom:"80px" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"0 1.5rem" }}>

          {/* Page header */}
          <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
            <h1 style={{ fontFamily:"Cormorant Garamond, serif", fontSize:"clamp(2.5rem,5vw,4rem)",
              fontWeight:700, color:"#fff", letterSpacing:"4px",
              textShadow:"0 0 40px rgba(237,177,255,0.25)" }}>
              NHẬT KÝ
            </h1>
            <p style={{ color:"rgba(230,216,240,0.65)", fontSize:"0.9rem", marginTop:"0.5rem" }}>
              Ghi lại cảm nhận mỗi ngày, kết hợp với vị trí sao Lưu
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:"2rem", alignItems:"start" }}>

            {/* ── CALENDAR ──────────────────────────────────── */}
            <div style={{ background:"rgba(15,17,28,0.75)", border:"1px solid rgba(100,80,130,0.25)",
              borderRadius:14, padding:"1.5rem", backdropFilter:"blur(12px)" }}>

              {/* month nav */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
                <button onClick={prevMonth} style={{ background:"none", border:"none", color:"rgba(237,177,255,0.6)",
                  cursor:"pointer", fontSize:"1.2rem", lineHeight:1, padding:"4px 8px", borderRadius:6 }}>‹</button>
                <span style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, color:"#edb1ff", fontSize:"0.95rem" }}>
                  {MONTH_NAMES[month-1]} {year}
                </span>
                <button onClick={nextMonth} style={{ background:"none", border:"none", color:"rgba(237,177,255,0.6)",
                  cursor:"pointer", fontSize:"1.2rem", lineHeight:1, padding:"4px 8px", borderRadius:6 }}>›</button>
              </div>

              {/* day-of-week header */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4 }}>
                {DOW_LABELS.map(d => (
                  <div key={d} style={{ textAlign:"center", fontSize:"0.65rem", color:"rgba(255,255,255,0.25)",
                    fontWeight:700, letterSpacing:"0.08em", padding:"4px 0" }}>{d}</div>
                ))}
              </div>

              {/* calendar grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
                {calCells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const iso = toISO(year, month, day);
                  const isToday = iso === today;
                  const isSel = iso === selectedDate;
                  const noteExists = hasNote(day);
                  return (
                    <div key={iso}
                      className={`cal-day${isToday ? " today" : ""}${isSel ? " selected" : ""}${noteExists ? " has-note" : ""}`}
                      onClick={() => setSelectedDate(iso)}>
                      {day}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop:"1.2rem", display:"flex", gap:"1rem", fontSize:"0.65rem",
                color:"rgba(255,255,255,0.3)", justifyContent:"center" }}>
                <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:4, height:4, borderRadius:"50%", background:"#edb1ff", display:"inline-block" }} />
                  Có ghi chú
                </span>
                <span style={{ color:"#fbbf24" }}>Hôm nay</span>
              </div>
            </div>

            {/* ── EDITOR PANEL ──────────────────────────────── */}
            <div style={{ display:"flex", flexDirection:"column", gap:"1.2rem" }}>

              {/* date heading */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:"0.6rem", color:"rgba(237,177,255,0.4)", letterSpacing:"0.14em",
                    textTransform:"uppercase", marginBottom:3 }}>Ghi chú ngày</div>
                  <div style={{ fontSize:"1.1rem", fontWeight:700, color:"#edb1ff", fontFamily:"Manrope,sans-serif" }}>
                    {(() => {
                      const [y,m,d] = selectedDate.split("-");
                      return `${parseInt(d)}/${parseInt(m)}/${y}`;
                    })()}
                  </div>
                </div>
                <div style={{ fontSize:"0.75rem", color: saved ? "#4ade80" : saving ? "#a78bfa" : "rgba(255,255,255,0.2)",
                  transition:"color 0.3s" }}>
                  {saved ? "✓ Đã lưu" : saving ? "Đang lưu..." : "Tự động lưu"}
                </div>
              </div>

              {/* textarea */}
              <div>
                {loadingEntry
                  ? <div style={{ color:"rgba(237,177,255,0.3)", fontSize:"0.8rem", padding:"1rem 0" }}>Đang tải...</div>
                  : <textarea
                      className="journal-textarea"
                      placeholder={`Ghi lại cảm nhận của bạn ngày hôm nay...`}
                      value={text}
                      onChange={handleChange}
                    />
                }
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
                  <button onClick={() => handleSave()}
                    disabled={saving}
                    style={{ background:"linear-gradient(135deg,#edb1ff,#6d208c)", border:"none",
                      borderRadius:8, color:"#fff", fontSize:"0.8rem", fontWeight:700,
                      padding:"7px 18px", cursor:"pointer", opacity: saving ? 0.5 : 1,
                      fontFamily:"Manrope,sans-serif" }}>
                    Lưu
                  </button>
                </div>
              </div>

              {/* Sao Lưu 3 tầng */}
              <div style={{ background:"rgba(15,17,28,0.75)", border:"1px solid rgba(100,80,130,0.25)",
                borderRadius:14, padding:"1.2rem 1.5rem", backdropFilter:"blur(12px)" }}>
                <div style={{ fontSize:"0.6rem", letterSpacing:"0.14em", color:"rgba(237,177,255,0.4)",
                  textTransform:"uppercase", marginBottom:"0.9rem" }}>
                  Sao Lưu · {selectedDate.split("-")[0]}
                </div>
                {loadingStars
                  ? <div style={{ color:"rgba(237,177,255,0.3)", fontSize:"0.75rem" }}>Đang tải...</div>
                  : <LuuSaoTiers luuSao={luuSao} />
                }
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
