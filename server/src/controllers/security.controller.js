// server/src/controllers/security.controller.js
import SecurityPolicy from "../models/SecurityPolicy.js";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const asInt = (v, fallback) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

export async function getPolicies(req, res) {
  const { orgId } = req.user;
  let doc = await SecurityPolicy.findOne({ orgId }).lean();
  if (!doc) {
    // return defaults without creating yet
    return res.json({
      requireMfa: true,
      sessionTimeout: 60,
      passwordMin: 8,
      passwordRotationDays: 90,
    });
  }
  return res.json({
    requireMfa: !!doc.requireMfa,
    sessionTimeout: doc.sessionTimeout,
    passwordMin: doc.passwordMin,
    passwordRotationDays: doc.passwordRotationDays,
  });
}

export async function patchPolicies(req, res) {
  const { orgId, id: userId } = req.user;

  const next = {};
  if (typeof req.body.requireMfa === "boolean") next.requireMfa = req.body.requireMfa;

  if (req.body.sessionTimeout !== undefined) {
    next.sessionTimeout = clamp(asInt(req.body.sessionTimeout, 60), 10, 1440);
  }
  if (req.body.passwordMin !== undefined) {
    next.passwordMin = clamp(asInt(req.body.passwordMin, 8), 6, 128);
  }
  if (req.body.passwordRotationDays !== undefined) {
    next.passwordRotationDays = clamp(asInt(req.body.passwordRotationDays, 90), 0, 3650);
  }

  // basic validations (can be expanded)
  if (next.passwordMin !== undefined && next.passwordMin < 6) {
    return res.status(400).json({ error: "Password minimum length should be at least 6." });
  }
  if (next.sessionTimeout !== undefined && next.sessionTimeout < 10) {
    return res.status(400).json({ error: "Session timeout must be 10 minutes or more." });
  }
  if (next.passwordRotationDays !== undefined && next.passwordRotationDays < 0) {
    return res.status(400).json({ error: "Password rotation cannot be negative." });
  }

  const doc = await SecurityPolicy.findOneAndUpdate(
    { orgId },
    { $set: { ...next, updatedBy: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return res.json({
    requireMfa: !!doc.requireMfa,
    sessionTimeout: doc.sessionTimeout,
    passwordMin: doc.passwordMin,
    passwordRotationDays: doc.passwordRotationDays,
  });
}
