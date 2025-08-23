// server/src/middleware/auth.js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";
import User from "../models/User.js";

export async function auth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next(new ApiError(401, "Missing token"));

    if (!env.JWT_SECRET) {
      // Make misconfiguration obvious instead of mysterious crashes
      return next(new ApiError(500, "JWT secret not configured"));
    }

    const payload = jwt.verify(token, env.JWT_SECRET);

    // Support older tokens that used "id" instead of "sub"
    const uid = String(payload.sub || payload.id || "");
    if (!uid) return next(new ApiError(401, "Invalid token"));

    // If uid is bad/undefined, Mongoose may throw; catch below
    const user = await User.findById(uid).lean();
    if (!user) return next(new ApiError(401, "Invalid token user"));

    req.user = {
      id: user._id.toString(),
      orgId: user.orgId?.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    };

    return next();
  } catch (_err) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, "Unauthorized"));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, "Forbidden"));
    next();
  };
}

// keep both exports so your old imports still work
export { auth as requireAuth };
export default auth;
