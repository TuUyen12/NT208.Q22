import { api } from "../config/api";

export const journalService = {
  listMonth: (year, month) => {
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
    return api.get(`/api/v1/journal/?date_from=${from}&date_to=${to}`);
  },
  getDay:  (dateStr) => api.get(`/api/v1/journal/${dateStr}`),
  getStars: (dateStr) => api.get(`/api/v1/journal/stars?date_str=${dateStr}`),
  save: (dateStr, content) =>
    api.post("/api/v1/journal/", { log_date: dateStr, content }),
  update: (dateStr, content) =>
    api.patch(`/api/v1/journal/${dateStr}`, { content }),
  remove: (dateStr) => api.delete(`/api/v1/journal/${dateStr}`),
};
