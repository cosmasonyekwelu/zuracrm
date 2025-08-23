// server/src/middleware/upload.js
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

// Helpers
const sanitize = (s) =>
  String(s)
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");

const BASE_EXT = [
  // docs/images
  "pdf","jpg","jpeg","png","gif","webp","svg","heic","heif",
  "csv","xls","xlsx","doc","docx","ppt","pptx","txt","md","rtf",
  // optional archives/media often uploaded
  "zip","rar","7z","tar","gz","mp4","mp3","wav","webm","json"
];

const EXTRA_EXT = (process.env.UPLOAD_EXT_ALLOW || "")
  .split(",")
  .map((x) => x.trim().toLowerCase())
  .filter(Boolean);

const EXT_ALLOW = new Set([...BASE_EXT, ...EXTRA_EXT]);
const ALLOW_ANY = process.env.UPLOAD_ALLOW_ANY === "1";

const TYPE_MAP = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/heic": "heic",
  "image/heif": "heif",
  "text/csv": "csv",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/markdown": "md",
  "application/rtf": "rtf",
  "application/zip": "zip",
  "application/x-7z-compressed": "7z",
  "application/x-rar-compressed": "rar",
  "application/gzip": "gz",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "video/webm": "webm",
  "application/json": "json",
};

const getExt = (file) => {
  const byMime = TYPE_MAP[file.mimetype];
  if (byMime) return byMime;
  const ext = path.extname(file.originalname || "").slice(1).toLowerCase();
  return ext || "bin";
};

function fileFilter(req, file, cb) {
  const ext = getExt(file);
  if (ALLOW_ANY || EXT_ALLOW.has(ext)) return cb(null, true);

  const err = new Error("Unsupported file type");
  err.status = 400;
  err.details = `Allowed: ${[...EXT_ALLOW].sort().join(", ")}. Got: ${file.mimetype || "unknown"} (${ext}).`;
  return cb(err);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const base = sanitize(path.basename(file.originalname || "file", path.extname(file.originalname || ""))) || "file";
    const ext = getExt(file);
    cb(null, `${base}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
  },
});

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

export function handleUpload(fieldName = "file") {
  const mw = upload.single(fieldName);
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (!err) return next();
      if (err.status === 400 || err.message === "Unsupported file type") {
        return res.status(400).json({ message: "Unsupported file type", details: err.details });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large (max 25MB)" });
      }
      return next(err);
    });
  };
}
