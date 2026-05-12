import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage  from "./pages/Home";
import LoginPage from "./pages/Login";
import SignUp from "./pages/SignUp";
import Chatbot from "./pages/Chatbot";
import LaSoTuVi from "./pages/LaSoTuVi";
import MajorStars from "./pages/MajorStars";

/**
 * App.jsx — Central routing configuration
 *
 * Route map:
 *   /           → HomePage
 *   /login      → LoginPage
 *   /signup     → SignUp
 *   /chatbot    → Chatbot
 *   /la-so-tu-vi → LaSoTuVi
 *   /major-stars → MajorStars
 *   *           → Redirect to /  (404 fallback)
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<HomePage  />} />
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/signup"     element={<SignUp />} />
        <Route path="/chatbot"    element={<Chatbot />} />
        <Route path="/la-so-tu-vi" element={<LaSoTuVi />} />
        <Route path="/major-stars" element={<MajorStars />} />

        {/* Catch-all: redirect unknown paths back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
