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

export const createCheckoutSession = async (payload) => {
  const { data } = await api.post("/admin/checkout/session", payload);
  return data;
};

export const listOrders = async () => {
  const { data } = await api.get("/admin/orders");
  return data;
};

export const getCheckoutSessionStatus = async (sessionId) => {
  const { data } = await api.get(`/checkout/session/${sessionId}`);
  return data;
};

// ---------- Quotes (admin) ----------
export const createQuote = async (payload) => {
  const { data } = await api.post("/admin/quotes", payload);
  return data;
};

export const listQuotes = async () => {
  const { data } = await api.get("/admin/quotes");
  return data;
};

export const getQuote = async (id) => {
  const { data } = await api.get(`/admin/quotes/${id}`);
  return data;
};

export const updateQuote = async (id, payload) => {
  const { data } = await api.patch(`/admin/quotes/${id}`, payload);
  return data;
};

export const createQuoteVersion = async (id) => {
  const { data } = await api.post(`/admin/quotes/${id}/versions`);
  return data;
};

export const sendQuote = async (id) => {
  const { data } = await api.post(`/admin/quotes/${id}/send`);
  return data;
};

export const requestFinalPayment = async (id, additionalItems = []) => {
  const { data } = await api.post(`/admin/quotes/${id}/request-final-payment`, {
    additional_items: additionalItems,
  });
  return data;
};

export const adminQuotePdfUrl = (id) => `${API}/admin/quotes/${id}/pdf`;

// ---------- Contracts (admin) ----------
export const previewContractPdfUrl = (quoteId) => `${API}/admin/contracts/${quoteId}/pdf`;

export const sendContract = async (quoteId) => {
  const { data } = await api.post(`/admin/contracts/${quoteId}/send`);
  return data;
};

// ---------- Quotes (public, client-facing) ----------
export const getPublicQuote = async (token) => {
  const { data } = await api.get(`/quotes/public/${token}`);
  return data;
};

export const publicQuotePdfUrl = (token) => `${API}/quotes/public/${token}/pdf`;

export const payQuoteDeposit = async (token) => {
  const { data } = await api.post(`/quotes/public/${token}/pay-deposit`);
  return data;
};

export const payQuoteFinal = async (token) => {
  const { data } = await api.post(`/quotes/public/${token}/pay-final`);
  return data;
};

// ---------- Contracts (public, client-facing) ----------
export const getContractSigningUrl = async (token) => {
  const { data } = await api.post(`/contracts/public/${token}/signing-url`);
  return data;
};

export default api;
