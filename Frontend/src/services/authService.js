import { api, API_BASE } from "../config/api";

export const authService = {
  register: (email, password, fullName) =>
    api.post("/api/v1/auth/register", { email, password, full_name: fullName }, { auth: false }),

  login: (email, password) =>
    api.post("/api/v1/auth/login", { email, password }, { auth: false }),

  me: () => api.get("/api/v1/auth/me"),

  deleteMe: () => api.delete("/api/v1/auth/me"),

  googleLoginUrl: () => `${API_BASE}/api/v1/auth/google/login`,
};
