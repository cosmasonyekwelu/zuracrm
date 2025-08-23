// server/src/controllers/auth.controller.js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import Org from "../models/Org.js";
import Invite from "../models/Invite.js";
import { ApiError, ok } from "../utils/http.js";

function sign(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      orgId: user.orgId?.toString?.() ?? null,
      role: user.role,
      name: user.name,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    orgId: user.orgId?.toString?.() ?? null,
    name: user.name || null,
    email: user.email || null,
    phone: user.phone || null,
    username: user.username || null,
    avatar: user.avatar || null,
    role: user.role || "user",
    profile: user.profile || null,
  };
}

const normalizeEmail = (v) => (v ? String(v).toLowerCase().trim() : "");
const normalizeUsername = (v) => (v ? String(v).toLowerCase().trim() : "");
const normalizePhone = (v) => (v ? String(v).replace(/[^\d+]/g, "") : "");

/**
 * POST /auth/signup
 * Body:
 *  - name, email?, phone?, username?, password (>=6), avatar?, orgName?
 *  - inviteToken? -> join existing org
 *
 * Self-signup: creates new org and makes the user admin.
 * Invite: creates user in existing org with invited role/profile and marks invite accepted.
 */
export async function register(req, res) {
  const { name, email, phone, username, password, avatar, inviteToken, orgName } = req.body || {};

  if (!password || String(password).length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  // =============== Accept Invite ===============
  if (inviteToken) {
    const invite = await Invite.findOne({ token: inviteToken, status: "pending" });
    if (!invite) throw new ApiError(400, "Invalid or expired invite");
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new ApiError(400, "Invite expired");
    }

    const normalizedEmail = normalizeEmail(email || invite.email);
    if (!normalizedEmail) throw new ApiError(400, "Email is required to accept invite");

    // Optional: enforce that the accepting email matches the invite email
    // if (invite.email && normalizeEmail(invite.email) !== normalizedEmail) {
    //   throw new ApiError(400, "This invite is for a different email address");
    // }

    const existing = await User.findOne({ orgId: invite.orgId, email: normalizedEmail });
    if (existing) throw new ApiError(409, "User already exists in this organization");

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      phone: phone ? normalizePhone(phone) : undefined,
      username: username ? normalizeUsername(username) : undefined,
      avatar,
      passwordHash,
      role: invite.role || "user",
      profile: invite.profile || "Standard",
      orgId: invite.orgId,
    });

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    invite.acceptedBy = user._id;
    await invite.save();

    const token = sign(user);
    return ok(res, { token, user: publicUser(user) }, 201);
  }

  // =============== Self-signup (new org) ===============
  const e = normalizeEmail(email);
  const p = normalizePhone(phone);
  const u = normalizeUsername(username);

  if (!e && !p && !u) {
    throw new ApiError(400, "Email, phone, or username is required");
  }

  // Optional global uniqueness by email
  if (e) {
    const dup = await User.findOne({ email: e });
    if (dup) throw new ApiError(409, "A user with this email already exists");
  }
  if (u) {
    const dupU = await User.findOne({ username: u });
    if (dupU) throw new ApiError(409, "A user with this username already exists");
  }

  const org = await Org.create({
    name:
      (orgName && orgName.trim()) ||
      (name ? `${name.split(" ")[0]}'s Org` : e ? `${e.split("@")[0]}'s Org` : "My Organization"),
  });

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name: name || (e ? e.split("@")[0] : "Owner"),
    email: e || undefined,
    phone: p || undefined,
    username: u || undefined,
    avatar,
    passwordHash,
    role: "admin",
    profile: "Admin",
    orgId: org._id,
  });

  org.ownerId = user._id;
  await org.save();

  const token = sign(user);
  return ok(res, { token, user: publicUser(user), org: { id: org._id.toString(), name: org.name } }, 201);
}

/**
 * POST /auth/signin
 * Body: { identifier, password }
 * identifier can be email | phone | username
 */
export async function login(req, res) {
  const { identifier, password } = req.body || {};
  const raw = String(identifier || "");
  const email = normalizeEmail(raw);
  const phone = normalizePhone(raw);
  const uname = normalizeUsername(raw);

  // If passwordHash is select:false in schema, make sure to select it here.
  const user = await User.findOne({
    $or: [{ email }, { phone: raw }, { username: uname }],
  }).select("+passwordHash");

  if (!user) throw new ApiError(401, "Invalid credentials");
  const okPass = await user.comparePassword(password);
  if (!okPass) throw new ApiError(401, "Invalid credentials");

  const token = sign(user);
  return ok(res, { token, user: publicUser(user) });
}

/**
 * GET /auth/me  (auth middleware required)
 */
export async function me(req, res) {
  const id = req.user?.id || req.user?.sub;
  if (!id) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(id);
  if (!user) throw new ApiError(401, "Invalid token");

  // Include minimal org info for the header/UX if you like
  const org = user.orgId ? await Org.findById(user.orgId).select("name logoUrl").lean() : null;

  return ok(res, { user: publicUser(user), org: org ? { id: org._id.toString(), name: org.name, logoUrl: org.logoUrl || null } : null });
}

export async function logout(_req, res) {
  // JWT is stateless; client should drop the token.
  return ok(res, { ok: true });
}
