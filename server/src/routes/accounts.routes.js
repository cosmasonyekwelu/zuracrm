// src/routes/accounts.routes.js
import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { auth, requireRole } from "../middleware/auth.js";
import * as C from "../controllers/accounts.controller.js";

const r = Router();

// Everyone authenticated in the org can list/create/get accounts
r.get("/", auth, asyncHandler(C.listAccounts));
r.post("/", auth, asyncHandler(C.createAccount));
r.get("/:id", auth, asyncHandler(C.getAccount));

// Update: owner OR admin can modify
r.patch("/:id", auth, asyncHandler(C.updateAccount));

// PUT fallback for clients that retry when PATCH is 405/404
r.put("/:id", auth, asyncHandler(C.replaceAccount));

// Delete: restricted to admin/manager by route
r.delete("/:id", auth, requireRole("admin", "manager"), asyncHandler(C.deleteAccount));

export default r;
