// ESM-safe tiny helpers
import jwt from "jsonwebtoken";

export function extractBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization || "";
  if (typeof h === "string" && h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim();
  return null;
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return jwt.verify(token, secret); // throws on invalid/expired
}

export function signToken(payload, opt = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return jwt.sign(payload, secret, { expiresIn: "7d", ...opt });
}
