import axios from "axios";
import { getToken } from "./auth";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://api.arroyo-systems.com";
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

export const submitContact = async (payload) => {
  const { data } = await api.post("/contact", payload);
  return data;
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
