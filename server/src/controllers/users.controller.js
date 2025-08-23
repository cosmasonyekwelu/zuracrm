// server/src/controllers/users.controller.js
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import Invite from "../models/Invite.js";
import { ok, ApiError } from "../utils/http.js";
import { sendInviteEmail } from "../utils/email.js";
import { logAudit } from "../utils/audit.js"; // ✅ correct import

const ROLE_ENUM = ["admin", "manager", "user", "read_only"];

/** Helpers */
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const isAdmin = (r) => String(r || "").toLowerCase() === "admin";

/** Count active admins in org (optionally excluding one user) */
async function countActiveAdmins(orgId, excludeUserId) {
  const q = { orgId, role: "admin" };
  q.$or = [{ active: { $exists: false } }, { active: true }];
  if (excludeUserId) q._id = { $ne: excludeUserId };
  return User.countDocuments(q);
}

/**
 * GET /users  (admin only) — list users in current org
 */
export async function listUsers(req, res) {
  if (!isAdmin(req.user.role)) throw new ApiError(403, "Forbidden");
  const users = await User.find({ orgId: req.user.orgId })
    .select("name email role profile managerId avatar active createdAt")
    .sort({ createdAt: 1 })
    .lean();
  return ok(res, users || []);
}

/**
 * PATCH /users/:id  (admin only) — update role/profile/manager/active/avatar
 * - Cannot change your own role/active
 * - Cannot demote or deactivate the last active admin
 */
export async function updateUser(req, res) {
  if (!isAdmin(req.user.role)) throw new ApiError(403, "Forbidden");

  const { id } = req.params;
  if (!isId(id)) throw new ApiError(400, "Invalid user id");

  const changingSelf = String(id) === String(req.user.id);

  const target = await User.findOne({ _id: id, orgId: req.user.orgId })
    .select("role active orgId")
    .lean();
  if (!target) throw new ApiError(404, "User not found");

  const patch = {};
  const body = req.body || {};

  // Role change
  if (body.role !== undefined) {
    if (changingSelf) throw new ApiError(400, "You cannot change your own role");
    const nextRole = String(body.role || "").toLowerCase();
    if (!ROLE_ENUM.includes(nextRole)) throw new ApiError(400, "Invalid role");
    if (isAdmin(target.role) && !isAdmin(nextRole)) {
      const remaining = await countActiveAdmins(req.user.orgId, target._id);
      if (remaining <= 0) throw new ApiError(400, "Cannot demote the last Administrator");
    }
    patch.role = nextRole;
  }

  // Active toggle
  if (typeof body.active === "boolean") {
    if (changingSelf) throw new ApiError(400, "You cannot change your own active status");
    if (body.active === false && isAdmin(target.role)) {
      const remaining = await countActiveAdmins(req.user.orgId, target._id);
      if (remaining <= 0) throw new ApiError(400, "Cannot suspend the last Administrator");
    }
    patch.active = !!body.active;
  }

  // Safe fields
  if (typeof body.profile === "string") patch.profile = body.profile;
  if (typeof body.avatar === "string") patch.avatar = body.avatar;

  if (body.managerId !== undefined) {
    if (body.managerId === "" || body.managerId === null) {
      patch.managerId = null;
    } else if (isId(body.managerId)) {
      const mgr = await User.findOne({ _id: body.managerId, orgId: req.user.orgId })
        .select("_id")
        .lean();
      if (!mgr) throw new ApiError(400, "Invalid managerId");
      patch.managerId = mgr._id;
    } else {
      throw new ApiError(400, "Invalid managerId");
    }
  }

  const user = await User.findOneAndUpdate(
    { _id: id, orgId: req.user.orgId },
    { $set: patch },
    { new: true }
  ).select("name email role profile managerId avatar active");

  if (!user) throw new ApiError(404, "User not found");

  // ✅ audit
  await logAudit(req, {
    action: "user.updated",
    target: `User:${user._id}`,
    meta: patch,
  });

  return ok(res, user);
}

/**
 * GET /users/me — current user profile
 */
export async function meGet(req, res) {
  const me = await User.findOne({ _id: req.user.id, orgId: req.user.orgId })
    .select("name email username phone role profile locale timeZone avatar orgId")
    .lean();
  if (!me) throw new ApiError(404, "User not found");
  return ok(res, me);
}

/**
 * PATCH /users/me — update current user profile (non-privileged fields only)
 */
export async function mePatch(req, res) {
  const { name, username, phone, locale, timeZone, avatar } = req.body || {};
  const set = {};
  if (typeof name === "string") set.name = name;
  if (typeof username === "string") set.username = username;
  if (typeof phone === "string") set.phone = phone;
  if (typeof locale === "string") set.locale = locale;
  if (typeof timeZone === "string") set.timeZone = timeZone;
  if (typeof avatar === "string") set.avatar = avatar;

  const me = await User.findOneAndUpdate(
    { _id: req.user.id, orgId: req.user.orgId },
    { $set: set },
    { new: true }
  ).select("name email username phone role profile locale timeZone avatar orgId");

  if (!me) throw new ApiError(404, "User not found");

  // ✅ audit
  await logAudit(req, {
    action: "user.me.updated",
    target: `User:${me._id}`,
    meta: set,
  });

  return ok(res, me);
}

/**
 * POST /users/invite  (admin only)
 * body: { emails: string[], role?: "user"|"manager"|"admin"|"read_only", profile?: string, message?: string }
 */
export async function inviteUsers(req, res) {
  if (!isAdmin(req.user.role)) throw new ApiError(403, "Forbidden");

  const { emails = [], role = "user", profile = "Standard", message = "" } = req.body || {};
  if (!Array.isArray(emails) || emails.length === 0) {
    throw new ApiError(400, "emails[] required");
  }
  if (!ROLE_ENUM.includes(String(role))) throw new ApiError(400, "Invalid role");

  const base = process.env.APP_URL || "http://localhost:5173";
  const results = [];

  for (const raw of emails) {
    const email = String(raw || "").toLowerCase().trim();
    if (!email) continue;

    const exists = await User.findOne({ orgId: req.user.orgId, email }).select("_id").lean();
    if (exists) {
      results.push({ email, skipped: true, reason: "Already in organization" });
      continue;
    }

    const token = crypto.randomUUID();
    const invite = await Invite.create({
      orgId: req.user.orgId,
      email,
      role,
      profile,
      token,
      invitedBy: req.user.id,
      status: "pending",
    });

    const link = `${base}/signup?token=${encodeURIComponent(token)}`;

    try { await sendInviteEmail(email, link, message); } catch {}

    results.push({ email, link, inviteId: invite._id.toString() });
  }

  // ✅ audit (summarize)
  await logAudit(req, {
    action: "invite.created",
    target: `Org:${req.user.orgId}`,
    meta: { count: results.length, role, profile, emails },
  });

  return ok(res, { ok: true, results });
}

/**
 * GET /users/invites  (admin only) — list pending invites
 */
export async function listInvites(req, res) {
  if (!isAdmin(req.user.role)) throw new ApiError(403, "Forbidden");
  const invites = await Invite.find({ orgId: req.user.orgId, status: "pending" })
    .sort({ createdAt: -1 })
    .lean();
  return ok(res, { items: invites || [] });
}

/**
 * DELETE /users/invites/:id  (admin only) — revoke invite
 */
export async function revokeInvite(req, res) {
  if (!isAdmin(req.user.role)) throw new ApiError(403, "Forbidden");
  const { id } = req.params;
  if (!isId(id)) throw new ApiError(400, "Invalid invite id");

  const changed = await Invite.updateOne(
    { _id: id, orgId: req.user.orgId },
    { $set: { status: "revoked" } }
  );
  if (!changed.matchedCount) throw new ApiError(404, "Invite not found");

  // ✅ audit
  await logAudit(req, {
    action: "invite.revoked",
    target: `Invite:${id}`,
  });

  return ok(res, { ok: true });
}
