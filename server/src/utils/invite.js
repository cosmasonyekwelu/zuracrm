// server/src/utils/invite.js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Use a separate secret so you can revoke/change invite tokens without breaking auth tokens
const INVITE_SECRET = env.INVITE_JWT_SECRET || env.JWT_SECRET;

// payload: { orgId, role, email } + optional meta
export function createInviteToken(payload, opts = {}) {
  return jwt.sign(payload, INVITE_SECRET, { expiresIn: opts.expiresIn || "7d" });
}

export function verifyInviteToken(token) {
  try {
    return jwt.verify(token, INVITE_SECRET);
  } catch (e) {
    return null;
  }
}
