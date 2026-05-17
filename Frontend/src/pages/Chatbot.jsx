import { useState } from "react";
import { Background, C, GlobalStyles, Header } from "./Login";

const initialMessages = [
  { from: "ai", text: "Xin chào! Tôi là Chatbot YinYang. Bạn muốn hỏi về điều gì hôm nay?" },
  { from: "user", text: "Vận mệnh năm 2026" },
  { from: "ai", text: "Năm 2026 với bạn có nhiều cơ hội chuyển biến. Hãy tập trung vào sức khỏe và mối quan hệ để duy trì năng lượng tích cực." },
];

const suggestions = [
  "Vận mệnh năm 2026",
  "Sự nghiệp trong 6 tháng tới",
  "Tình duyên và hôn nhân",
  "Lá số hợp tuổi kết hôn",
];

const recentTopics = [
  "Vận mệnh 2026",
  "Tình duyên tháng 5",
  "Công việc và thành công",
];

export default function Chatbot() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const addMessage = (from, text) => {
    setMessages(prev => [...prev, { from, text }]);
  };

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addMessage("user", trimmed);
    setInput("");

    window.setTimeout(() => {
      addMessage("ai", "Đây là gợi ý trả lời AI cho câu hỏi của bạn. Hãy xem chi tiết bên dưới và đặt thêm câu hỏi nếu cần.");
    }, 650);
  };

  const handleSuggestion = (text) => {
    addMessage("user", text);
    window.setTimeout(() => {
      addMessage("ai", `Gợi ý trả lời cho: ${text}. Hãy xem kỹ các điểm nổi bật và đặt câu hỏi tiếp theo để AI trợ giúp chi tiết hơn.`);
    }, 650);
  };

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
                    onClick={() => handleSuggestion(text)}
                  >
                    {text}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: "1rem" }}>
                <h3 style={{ color: C.onSurface, marginBottom: "1rem" }}>Lịch sử chat</h3>
                <div style={{ display: "grid", gap: "0.85rem" }}>
                  {recentTopics.map(topic => (
                    <div key={topic} style={{ padding: "0.95rem 1rem", borderRadius: 16, background: C.surfaceLowest, border: `1px solid rgba(237,177,255,.12)` }}>
                      <span style={{ color: C.onSurfaceVariant }}>{topic}</span>
                    </div>
                  ))}
                </div>
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

              <div style={{ flex: 1, overflowY: "auto", padding: "1.4rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {messages.map((message, index) => (
                  <div key={index} style={{ display: "flex", justifyContent: message.from === "ai" ? "flex-start" : "flex-end" }}>
                    <div style={{ maxWidth: "82%", padding: "1rem 1.15rem", borderRadius: 20, background: message.from === "ai" ? C.surfaceLow : C.primary, color: message.from === "ai" ? C.onSurface : "#111", boxShadow: "0 18px 40px rgba(0,0,0,.12)" }}>
                      <div style={{ fontSize: 13.5, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{message.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "1.25rem 1.75rem", borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input
                  className="inp"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                  placeholder="Nhập câu hỏi của bạn..."
                  style={{ flex: 1, paddingRight: 20, margin: 0 }}
                />
                <button className="btn-pri" onClick={sendMessage} style={{ width: 140, padding: "0.9rem 1rem" }}>
                  Gửi
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
