import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage    from "./pages/Home";
import LoginPage   from "./pages/Login";
import SignUp      from "./pages/SignUp";
import Chatbot        from "./pages/Chatbot";
import LaSoTuVi       from "./pages/LaSoTuVi";
import MajorStars     from "./pages/MajorStars";
import AuthCallback   from "./pages/AuthCallback";
import DailyHoroscope from "./pages/DailyHoroscope";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"              element={<HomePage />} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/signup"        element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/major-stars"   element={<MajorStars />} />
          <Route path="/chatbot"         element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
          <Route path="/la-so-tu-vi"   element={<ProtectedRoute><LaSoTuVi /></ProtectedRoute>} />
          <Route path="/daily-horoscope" element={<ProtectedRoute><DailyHoroscope /></ProtectedRoute>} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
