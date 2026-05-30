import { api } from "../config/api";

export const annotationService = {
  list:   (chartId) => api.get(`/api/v1/annotations/?chart_id=${chartId}`),
  create: (payload) => api.post("/api/v1/annotations/", payload),
  update: (id, content) => api.patch(`/api/v1/annotations/${id}`, { content }),
  remove: (id) => api.delete(`/api/v1/annotations/${id}`),
};
