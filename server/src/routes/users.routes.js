// server/src/routes/users.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import {
  listUsers,
  updateUser,
  meGet,
  mePatch,
  inviteUsers,
  listInvites,
  revokeInvite,
} from "../controllers/users.controller.js";

const r = Router();

// Current user
r.get("/users/me", auth, asyncHandler(meGet));
r.patch("/users/me", auth, asyncHandler(mePatch));

// Admin-only (auth middleware should populate req.user.role/orgId)
r.get("/users", auth, asyncHandler(listUsers));
r.patch("/users/:id", auth, asyncHandler(updateUser));

r.post("/users/invite", auth, asyncHandler(inviteUsers));
r.get("/users/invites", auth, asyncHandler(listInvites));
r.delete("/users/invites/:id", auth, asyncHandler(revokeInvite));

export default r;
