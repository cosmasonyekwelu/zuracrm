// server/src/routes/security.routes.js
import { Router } from "express";
import { auth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { getPolicies, patchPolicies } from "../controllers/security.controller.js";

const r = Router();

// Readable by any authenticated user
r.get("/security/policies", auth, asyncHandler(getPolicies));

// Admin-only update
r.patch("/security/policies", auth, requireRole("admin"), asyncHandler(patchPolicies));

export default r;
