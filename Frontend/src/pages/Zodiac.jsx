import { Background, C, GlobalStyles, Header } from "./Login";
export default function Zodiac() {
  return (
    <>
      <GlobalStyles />
        <div style={{ minHeight: "100vh", position: "relative", background: C.bg }}>
            <Background />
            <Header />
            <main style={{ position: "relative", zIndex: 10, minHeight: "100vh", padding: "120px 2rem 3rem" }}>
                
            </main>
        </div>
    </>
  );
}
