import axios from "axios";
import { getToken } from "./auth";

// Falls back to the raw Render hostname, not the api.arroyo-systems.com custom domain: that
// domain's registration on Render is currently stuck (blocked by a stale claim on another,
// unreachable service - see project notes), so it doesn't route to this backend. Revert once
// that's resolved with Render support.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://arroyo-systems-api-1t0k.onrender.com";
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

// Attach admin token if present
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.url && config.url.startsWith("/admin")) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Render's free tier puts the backend to sleep; the first request after a while can take up to
// a minute while it wakes. Give the contact request that long before calling it a failure.
const CONTACT_TIMEOUT_MS = 75000;

export const submitContact = async (payload) => {
  const { data } = await api.post("/contact", payload, { timeout: CONTACT_TIMEOUT_MS });
  return data;
};

// Wakes the backend ahead of time. Called when a visitor starts filling in the contact form,
// so by the time they press send (typing takes longer than the wake-up) the server is ready.
// Only people who engage with the form trigger it, not every page view.
let backendWarmed = false;
export const warmUpBackend = () => {
  if (backendWarmed) return;
  backendWarmed = true;
  api.get("/", { timeout: CONTACT_TIMEOUT_MS }).catch(() => {
    backendWarmed = false; // try again on the next focus if it did not get through
  });
};

export const adminLogin = async (username, password) => {
  const { data } = await api.post("/admin/login", { username, password });
  return data;
};

export const adminMe = async () => {
  const { data } = await api.get("/admin/me");
  return data;
};

export const listMessages = async () => {
  const { data } = await api.get("/admin/messages");
  return data;
};

export const updateMessageRead = async (id, read) => {
  const { data } = await api.patch(`/admin/messages/${id}`, { read });
  return data;
};

export const deleteMessage = async (id) => {
  await api.delete(`/admin/messages/${id}`);
};

export const exportCsvUrl = () => `${API}/admin/messages/export.csv`;

export default api;
