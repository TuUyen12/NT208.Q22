import { api } from "../config/api";

export const notificationService = {
  list: () => api.get("/api/v1/notifications/"),
  unreadCount: () => api.get("/api/v1/notifications/unread-count"),
  markRead: (id) => api.patch(`/api/v1/notifications/${id}/read`),
  markAllRead: () => api.patch("/api/v1/notifications/read-all"),
};
