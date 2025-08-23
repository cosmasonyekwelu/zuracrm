// server/src/routes/audit.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { listAudit } from "../controllers/audit.controller.js";

const r = Router();
r.get("/audit", auth, asyncHandler(listAudit));

export default r;
