import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

function hasStoredToken() {
  return !!(localStorage.getItem("access_token") || sessionStorage.getItem("access_token"));
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  // loading is true only when there's a token we need to validate
  const [loading, setLoading] = useState(hasStoredToken);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (!token) return; // loading already false (initialized from hasStoredToken)

    authService.me()
      .then(setUser)
      .catch(clearTokens)
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, remember = false) => {
    const tokens = await authService.login(email, password);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("access_token", tokens.access_token);
    storage.setItem("refresh_token", tokens.refresh_token);
    const me = await authService.me();
    setUser(me);
    return me;
  };

  // Used after OAuth redirect — tokens arrive as URL params
  const loginWithTokens = async (accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    const me = await authService.me();
    setUser(me);
    return me;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const register = (email, password, fullName) =>
    authService.register(email, password, fullName);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithTokens, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
