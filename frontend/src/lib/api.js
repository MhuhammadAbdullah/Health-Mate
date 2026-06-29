import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// Set by TokenSync as soon as Clerk auth loads — avoids the race where
// window.__clerkToken isn't populated yet when the first requests fire.
let _getToken = null;
export const setGetToken = (fn) => { _getToken = fn; };

api.interceptors.request.use(async (cfg) => {
  try {
    const token = _getToken ? await _getToken() : window.__clerkToken;
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  } catch {
    if (window.__clerkToken) cfg.headers.Authorization = `Bearer ${window.__clerkToken}`;
  }
  return cfg;
});

export default api;