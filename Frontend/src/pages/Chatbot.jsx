import { useEffect, useRef, useState } from "react";
import { api } from "../config/api";
import { Background, C, GlobalStyles, Header } from "./Login";

const INITIAL_AI_TEXT = "Xin chào! Tôi là chuyên gia Tử Vi của YinYang. Bạn muốn hỏi về điều gì hôm nay?";

const suggestions = [
  "Vận mệnh năm 2026",
  "Sự nghiệp trong 6 tháng tới",
  "Tình duyên và hôn nhân",
  "Lá số hợp tuổi kết hôn",
];

export default function Chatbot() {
  const [messages, setMessages] = useState([{ from: "ai", text: INITIAL_AI_TEXT }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildHistory = (msgs) =>
    msgs
      .slice(0, -1) // exclude the latest user message (sent as `message`)
      .filter(m => m.from !== "thinking")
      .map(m => ({ role: m.from === "ai" ? "model" : "user", text: m.text }));

  const sendText = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { from: "user", text };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { from: "thinking", text: "..." }]);
    setInput("");
    setLoading(true);

    try {
      const result = await api.post("/api/v1/chat/", {
        message: text,
        history: buildHistory(nextMessages),
      });
      setMessages([...nextMessages, { from: "ai", text: result.reply }]);
    } catch {
      setMessages([...nextMessages, { from: "ai", text: "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại." }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => sendText(input.trim());

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", position: "relative", background: C.bg }}>
        <Background />
        <Header />

        <main style={{ position: "relative", zIndex: 10, minHeight: "100vh", padding: "100px 24px 48px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "1.75rem" }}>
            <section className="glass" style={{ padding: "2rem", borderRadius: 28, border: "1px solid rgba(77,67,81,.18)" }}>
              <h2 style={{ color: C.primary, marginBottom: "1.25rem" }}>Chatbot AI</h2>
              <p style={{ fontFamily: "Manrope, sans-serif", color: C.onSurfaceVariant, lineHeight: 1.8, marginBottom: "1.5rem" }}>
                Đặt câu hỏi nhanh và nhận phản hồi tức thì. Sử dụng gợi ý bên dưới để bắt đầu hoặc xem lại lịch sử trò chuyện.
              </p>

              <div style={{ display: "grid", gap: "0.85rem", marginBottom: "1.5rem" }}>
                {suggestions.map(text => (
                  <button
                    key={text}
                    className="btn-soc"
                    style={{ justifyContent: "flex-start", color: C.primary, borderColor: "rgba(237,177,255,.25)", fontWeight: 600 }}
                    onClick={() => sendText(text)}
                    disabled={loading}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </section>

            <section className="glass" style={{ display: "flex", flexDirection: "column", height: "100%", borderRadius: 28, border: "1px solid rgba(77,67,81,.18)" }}>
              <div style={{ padding: "1.5rem 1.75rem", borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 700, color: C.onSurface }}>Giao diện nhắn tin AI</div>
                  <div style={{ fontFamily: "Manrope, sans-serif", color: C.onSurfaceVariant, fontSize: 13, marginTop: 6 }}>Trò chuyện nhanh, xem lịch sử và khám phá câu trả lời chuyên sâu.</div>
                </div>
                <span className="mso" style={{ fontSize: 22, color: C.primary }}>chat</span>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "1.4rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem", minHeight: 400 }}>
                {messages.map((message, index) => (
                  <div key={index} style={{ display: "flex", justifyContent: message.from === "ai" || message.from === "thinking" ? "flex-start" : "flex-end" }}>
                    <div style={{
                      maxWidth: "82%",
                      padding: "1rem 1.15rem",
                      borderRadius: 20,
                      background: message.from === "user" ? C.primary : C.surfaceLow,
                      color: message.from === "user" ? "#111" : C.onSurface,
                      boxShadow: "0 18px 40px rgba(0,0,0,.12)",
                      opacity: message.from === "thinking" ? 0.5 : 1,
                    }}>
                      <div style={{ fontSize: 13.5, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{message.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding: "1.25rem 1.75rem", borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input
                  className="inp"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                  placeholder="Nhập câu hỏi của bạn..."
                  style={{ flex: 1, paddingRight: 20, margin: 0 }}
                  disabled={loading}
                />
                <button className="btn-pri" onClick={sendMessage} disabled={loading} style={{ width: 140, padding: "0.9rem 1rem" }}>
                  {loading ? "Đang gửi..." : "Gửi"}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
