import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { upload } from "../middleware/upload.js";
import { importCsv } from "../controllers/import.controller.js";

const r = Router();
r.post("/import", auth, upload.single("file"), asyncHandler(importCsv));
export default r;
