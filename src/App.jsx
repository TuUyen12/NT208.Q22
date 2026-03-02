import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import LaSoTuVi from "./pages/LaSoTuVi";


function App() {
  // Vẫn giữ dòng kiểm tra trạng thái để dùng cho việc ẩn/hiện nút Đăng nhập sau này
  const isAuth = localStorage.getItem("isAuth") === "true";

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Trang mặc định (/) bây giờ là Trang Chủ. Ai cũng có thể vào xem. */}
        <Route path="/" element={<Home />} />
        
        {/* 2. Trang Đăng Nhập (/login). Nếu đã login rồi mà cố mở lại trang này thì đẩy về Trang Chủ */}
        <Route
          path="/login"
          element={isAuth ? <Navigate to="/" /> : <Login />}
        />
        <Route path="/laso" element={<LaSoTuVi />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;