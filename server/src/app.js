// server/src/app.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// ⚠️ Ensure all models are registered before routes (important for stats/search/etc.)
import "./models/index.js";

import api from "./routes/index.js";

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------- CORS (multiple origins, credentials) ----------
const parseOrigins = (v) =>
  (v || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const allowedOrigins = new Set([
  ...defaultOrigins,
  ...parseOrigins(process.env.CORS_ORIGIN),
]);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser tools (no Origin) and any configured origins
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ---------- Core middleware ----------
app.set("etag", "strong");
app.set("trust proxy", process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 1);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// ---------- Static: uploads ----------
/**
 * Our upload middleware writes to: server/src/uploads
 * This makes files publicly reachable at:  GET /uploads/<filename>
 */
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  fallthrough: true,
  maxAge: "7d",
  etag: true,
}));

// ---------- Health check (under /api for consistency) ----------
app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
    version: process.env.APP_VERSION || "dev",
  })
);

// ---------- Mount API ----------
app.use("/api", api);

// ---------- 404 ----------
app.use((req, res, _next) => {
  res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
});

// ---------- Central error handler ----------
app.use((err, _req, res, _next) => {
  // Malformed JSON (body-parser)
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }

  // Multer/file upload errors normalized by our upload middleware
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large (max 25MB)" });
  }
  if (err?.message === "Unsupported file type" || err?.status === 400) {
    return res.status(400).json({ message: err.message, details: err.details });
  }

  const status = err?.statusCode ?? err?.status ?? 500;

  // Don’t mask auth errors as 500
  if (status === 401 || status === 403) {
    return res.status(status).json({ message: err?.message || "Unauthorized" });
  }

  const payload = { message: err?.message || "Server error" };
  if (err?.meta) payload.meta = err.meta;

  // expose stack only in non-production
  if (process.env.NODE_ENV !== "production" && err?.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
});

export default app;
