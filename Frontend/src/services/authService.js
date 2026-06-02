import { api, API_BASE } from "../config/api";

export const authService = {
  register: (email, password, fullName) =>
    api.post("/api/v1/auth/register", { email, password, full_name: fullName }, { auth: false }),

  login: (email, password) =>
    api.post("/api/v1/auth/login", { email, password }, { auth: false }),

  me: () => api.get("/api/v1/auth/me"),

  updateProfile: (data) => api.patch("/api/v1/auth/me", data),

  changePassword: (currentPassword, newPassword) =>
    api.put("/api/v1/auth/me/password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  deleteMe: () => api.delete("/api/v1/auth/me"),

  googleLoginUrl: () => `${API_BASE}/api/v1/auth/google/login`,

  forgotPassword: (email) =>
    api.post("/api/v1/auth/forgot-password", { email }, { auth: false }),

  resetPassword: (token, newPassword) =>
    api.post("/api/v1/auth/reset-password", { token, new_password: newPassword }, { auth: false }),
};
