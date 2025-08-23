// server/src/routes/roles.routes.js
import { Router } from "express";
import { auth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { getRolePolicy, patchRolePolicy } from "../controllers/rolesPolicy.controller.js";

const r = Router();

// Everyone can read; only admins can update
r.get("/roles/policy", auth, asyncHandler(getRolePolicy));
r.patch("/roles/policy", auth, requireRole("admin"), asyncHandler(patchRolePolicy));

export default r;
