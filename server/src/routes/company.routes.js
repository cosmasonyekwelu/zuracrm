// server/src/routes/company.routes.js
import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { auth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import * as Company from "../controllers/company.controller.js";

const r = Router();

// --- Multer local storage (swap with S3/GCS/etc. if needed) ---
const uploadDir = path.join(process.cwd(), "uploads", "org-logos");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (/^image\/(png|jpe?g|webp|gif|svg\+xml|svg)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error("Unsupported file type"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// --- Routes ---
// /api/company
r.get("/", auth, asyncHandler(Company.getCompany));
r.patch("/", auth, requireRole("admin"), asyncHandler(Company.patchCompany));
r.post(
  "/logo",
  auth,
  requireRole("admin"),
  upload.single("file"),
  // add a tiny adapter to inject publicUrl if you serve /uploads statically
  (req, _res, next) => {
    if (req.file && !req.file.publicUrl) {
      req.file.publicUrl = `/uploads/org-logos/${req.file.filename}`;
    }
    next();
  },
  asyncHandler(Company.uploadCompanyLogo)
);

export default r;
