// src/services/api.js
import axios from "axios";

/**
 * Axios instance + helpers with multi-tenant support.
 * - Base URL: ${VITE_API_URL}/api (default http://localhost:4000/api)
 * - Optional cookie auth (VITE_USE_COOKIES !== "false")
 * - Bearer token (localStorage "auth.token")
 * - X-Org-Id header (localStorage "auth.orgId")
 * - Unwraps { items: [] } list responses automatically
 * - Clears token on 401
 */

const API_ROOT = (import.meta?.env?.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
export const USE_COOKIES = String(import.meta?.env?.VITE_USE_COOKIES ?? "true") !== "false";

export const api = axios.create({
  baseURL: `${API_ROOT}/api`,
  withCredentials: USE_COOKIES,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 25_000,
});

// -------- internal helpers --------
const getToken = () => localStorage.getItem("auth.token");
const getOrgId = () => localStorage.getItem("auth.orgId");

// Build query string (skips empty/null/undefined)
const buildQuery = (params = {}) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) v.forEach((vv) => q.append(k, String(vv)));
    else q.append(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
};

const toItems = (data) => (Array.isArray(data) ? data : (data?.items ?? []));

// Extract a normalized pathname for heuristics
const getPathname = (cfg) => {
  try {
    const base = cfg.baseURL ?? api.defaults.baseURL ?? window.location.origin;
    const u = new URL(cfg.url, base);
    return u.pathname.replace(/^\/api\//, "/");
  } catch {
    return String(cfg.url || "");
  }
};

const resourceListRegex =
  /^\/?(leads|contacts|products|deals|quotes|invoices|salesorders|tasks|meetings|calls|documents|campaigns)(?:[/?#]|$)/;

// -------- request interceptor --------
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const orgId = getOrgId();
  if (orgId && !config.headers["X-Org-Id"]) {
    config.headers["X-Org-Id"] = orgId;
  }
  return config;
});

// -------- response interceptor --------
api.interceptors.response.use(
  (res) => {
    try {
      if ((res?.config?.method || "get").toLowerCase() === "get") {
        const path = getPathname(res.config);
        const looksLikeList = resourceListRegex.test(path);
        if (looksLikeList && res?.data && !Array.isArray(res.data) && Array.isArray(res.data.items)) {
          res.data = res.data.items;
        }
      }
    } catch {}
    return res;
  },
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // Stateles JWT: clear and let the app route back to sign-in
      localStorage.removeItem("auth.token");
    }
    const server = err?.response?.data ?? {};
    const message = server.message || server.error || err?.message || "Request failed";
    return Promise.reject(Object.assign(new Error(message), { status, server, raw: err }));
  }
);

// -------- public helpers --------
export function setAuthSession({ token, orgId } = {}) {
  if (token) localStorage.setItem("auth.token", token);
  else localStorage.removeItem("auth.token");

  if (orgId) localStorage.setItem("auth.orgId", orgId);
  else localStorage.removeItem("auth.orgId");
}
export function clearAuthSession() {
  setAuthSession({ token: null, orgId: null });
}

// PATCH with graceful PUT fallback
async function updateWithFallback(resource, id, data) {
  try {
    const r = await api.patch(`/${resource}/${id}`, data);
    return r.data;
  } catch (e) {
    if (e.status === 405 || e.status === 404) {
      const r2 = await api.put(`/${resource}/${id}`, data);
      return r2.data;
    }
    throw e;
  }
}

// Generic CRUD
const crud = (resource) => ({
  listRaw: (params) => api.get(`/${resource}${buildQuery(params)}`).then((r) => r.data),
  list: (params) => api.get(`/${resource}${buildQuery(params)}`).then((r) => toItems(r.data)),
  get: (id) => api.get(`/${resource}/${id}`).then((r) => r.data),
  create: (data) => api.post(`/${resource}`, data).then((r) => r.data),
  update: (id, data) => updateWithFallback(resource, id, data),
  remove: (id) => api.delete(`/${resource}/${id}`).then((r) => r.data),
});

// --------------- Auth ----------------
async function postFirst(paths, payload = {}) {
  let lastErr;
  for (const p of paths) {
    try {
      const r = await api.post(p, payload);
      return r.data;
    } catch (e) {
      lastErr = e;
      if (e.status !== 404 && e.status !== 405) throw e;
    }
  }
  throw lastErr;
}

export const AuthAPI = {
  me: async () => {
    // Avoid noisy /auth/me when using tokens and none is present
    const t = getToken();
    if (!USE_COOKIES && !t) return null;
    try {
      const r = await api.get("/auth/me");
      return r.data; // { user, org }
    } catch (e) {
      if (e.status === 401) return null;
      throw e;
    }
  },
  signin: (data) => postFirst(["/auth/signin", "/auth/login"], data),
  signup: (data) => postFirst(["/auth/signup", "/auth/register"], data),
  signout: () => postFirst(["/auth/signout", "/auth/logout"], {}),
};

// ---------- Core resources ----------
export const LeadsAPI = crud("leads");
export const ContactsAPI = crud("contacts");
export const DealsAPI = {
  ...crud("deals"),
  stages: () => api.get("/deals/stages").then((r) => r.data),
  byKanban: (params) =>
    api.get(`/deals${buildQuery({ view: "kanban", ...(params || {}) })}`).then((r) => r.data),
};

// Activities
export const TasksAPI = crud("tasks");
export const MeetingsAPI = crud("meetings");
export const CallsAPI = crud("calls");

// Catalog & Sales docs
export const ProductsAPI = crud("products");
export const QuotesAPI = crud("quotes");
export const SalesOrdersAPI = crud("salesorders");
export const InvoicesAPI = crud("invoices");

// Optional modules
export const CampaignsAPI = crud("campaigns");

// Documents (upload helper)
export const DocumentsAPI = {
  ...crud("documents"),
  upload: async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await api.post("/documents", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data;
  },
  download: async (id) => {
    const r = await api.get(`/documents/${id}/download`, { responseType: "blob" });
    return r.data; // blob
  },
};

// Forecasts
export const ForecastsAPI = {
  summary: () => api.get("/forecasts/summary").then((r) => r.data),
};

// Dashboard stats
export const StatsAPI = {
  leads: () => api.get("/leads/stats").then((r) => r.data),
  deals: () => api.get("/deals/stats").then((r) => r.data),
  activities: () => api.get("/activities/stats").then((r) => r.data),
};

export default api;
