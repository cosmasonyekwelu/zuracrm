// server/src/utils/audit.js
import AuditEvent from "../models/AuditEvent.js";

/**
 * Safe audit logger — never throws.
 * Usage: await logAudit(req, { action: "meeting.book", target: "Meeting:123", meta:{...} });
 */
export async function logAudit(req, { action, target, meta, when } = {}) {
  if (!action) return;

  try {
    const u = req?.user || {};
    const actor =
      (u?.name && u?.email) ? `${u.name} <${u.email}>`
      : (u?.name || u?.email || String(u?.id || "system"));

    const doc = {
      orgId: u?.orgId,
      actorId: u?.id || null,
      actor,
      action: String(action),
      target: target ? String(target) : undefined,
      meta: meta || {},
      ip: req?.ip || req?.headers?.["x-forwarded-for"] || "",
      ua: req?.headers?.["user-agent"] || "",
      ...(when ? { createdAt: when } : {}),
    };

    if (!doc.orgId) return; // require org scope
    await AuditEvent.create(doc);
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.error("[audit] write failed:", err?.message || err);
    }
  }
}
