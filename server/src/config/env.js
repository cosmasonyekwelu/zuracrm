// server/src/config/env.js
import "dotenv/config";

const bool = (v, def = false) =>
  v === undefined ? def : String(v).toLowerCase() === "true";

const num = (v, def) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// Throw early if a required env var is missing
function required(name) {
  const v = process.env[name];
  if (!v) {
    const hint =
      name === "JWT_SECRET"
        ? "Generate one (e.g. `openssl rand -base64 32`) and set it in server/.env"
        : "Set it in your server/.env";
    throw new Error(`[env] Missing required ${name}. ${hint}`);
  }
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: num(process.env.PORT, 4000),

  APP_NAME: process.env.APP_NAME || "Zura CRM API",
  APP_URL: process.env.APP_URL || "http://localhost:5173", // used for invite links, etc.

  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zura",

  // 🔐 required – no insecure default
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  RATE_WINDOW_MS: num(process.env.RATE_WINDOW_MS, 15 * 60 * 1000),
  RATE_MAX: num(process.env.RATE_MAX, 200),
  AUTH_RATE_WINDOW_MS: num(process.env.AUTH_RATE_WINDOW_MS, 60 * 1000),
  AUTH_RATE_MAX: num(process.env.AUTH_RATE_MAX, 10),

  METRICS_ENABLED: bool(process.env.METRICS_ENABLED, true),
  METRICS_PREFIX: process.env.METRICS_PREFIX || "zura_",

  // handy defaults for other features
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
};
