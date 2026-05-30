const BASE = import.meta.env.VITE_API_URL ?? "";

function getToken() {
  return localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
}

async function request(method, path, { body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || `HTTP ${res.status}`);
  return data;
}

export const api = {
  get:    (path, opts)        => request("GET",    path, opts),
  post:   (path, body, opts)  => request("POST",   path, { body, ...opts }),
  put:    (path, body, opts)  => request("PUT",    path, { body, ...opts }),
  patch:  (path, body, opts)  => request("PATCH",  path, { body, ...opts }),
  delete: (path, opts)        => request("DELETE", path, opts),
};

export const API_BASE = BASE;
