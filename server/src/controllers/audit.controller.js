// server/src/controllers/audit.controller.js
import AuditEvent from "../models/AuditEvent.js";
import { ok } from "../utils/http.js";

/** Small helpers */
const clamp = (n, min, max) => Math.min(Math.max(Number(n) || 0, min), max);
const safeISO = (v) => {
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};
const rxEscape = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Record an audit event.
 * Usage: await logAudit(req, { action:"user.updated", target:`User:${id}`, meta:{...} })
 */
export async function logAudit(req, { action, target, meta = {}, actor, actorId, orgId } = {}) {
  if (!action) return; // be graceful: do nothing if misuse

  const user = req?.user || {};
  const doc = await AuditEvent.create({
    orgId: orgId || user.orgId,
    actorId: actorId || user.id || user._id,
    actor:
      actor ||
      [user.name, user.email].filter(Boolean).join(" ") ||
      String(user.id || ""),
    action,
    target,
    meta,
    ip: req?.ip,
    ua: req?.headers?.["user-agent"],
  });

  return doc;
}

/**
 * GET /audit?q=&from=&to=&limit=
 * Returns an ARRAY to match your AuditLog.jsx: [{ _id, when, actor, action, target, meta }]
 */
export async function listAudit(req, res) {
  const { q, from, to } = req.query || {};
  const limit = clamp(req.query?.limit, 1, 500);

  const query = { orgId: req.user.orgId };
  const and = [];

  // time window
  const fromD = safeISO(from);
  const toD = safeISO(to);
  if (fromD) and.push({ createdAt: { $gte: fromD } });
  if (toD) and.push({ createdAt: { ...(and.find(a => a.createdAt)?.createdAt || {}), $lte: toD } });

  // text filter across common fields
  if (q && String(q).trim()) {
    const rx = new RegExp(rxEscape(String(q).trim()), "i");
    and.push({
      $or: [{ actor: rx }, { action: rx }, { target: rx }],
    });
  }
  if (and.length) query.$and = and;

  const items = await AuditEvent.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // normalize for UI
  const rows = (items || []).map((e) => ({
    _id: e._id,
    when: e.createdAt,
    actor: e.actor || "",
    action: e.action || "",
    target: e.target || "",
    meta: e.meta || {},
    // you can include ip/ua if you plan to show them later:
    // ip: e.ip, ua: e.ua,
  }));

  return ok(res, rows);
}
