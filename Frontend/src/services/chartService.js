import { api } from "../config/api";

export const chartService = {
  save:      (payload) => api.post("/api/v1/charts/", payload),
  list:      ()        => api.get("/api/v1/charts/"),
  get:       (id)      => api.get(`/api/v1/charts/${id}`),
  delete:    (id)      => api.delete(`/api/v1/charts/${id}`),
  latest:    ()        => api.get("/api/v1/charts/latest"),
  interpret: (id)      => api.post(`/api/v1/ai/${id}/interpret`),
  tts:       (id, voice = "female", field = "overall") => api.post(`/api/v1/ai/${id}/tts?voice=${voice}&field=${field}`),
};
