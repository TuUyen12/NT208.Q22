import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Landing page after Google / Facebook OAuth redirect.
// Backend sends: /auth/callback?access_token=...&refresh_token=...
export default function AuthCallback() {
  const { loginWithTokens } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      loginWithTokens(accessToken, refreshToken)
        .then(() => navigate("/", { replace: true }))
        .catch(() => navigate("/login?error=oauth_failed", { replace: true }));
    } else {
      navigate("/login?error=oauth_failed", { replace: true });
    }
  }, [loginWithTokens, navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f131c",
      color: "#edb1ff",
      fontSize: 15,
      fontFamily: "Manrope, sans-serif",
    }}>
      Đang xác thực...
    </div>
  );
}
