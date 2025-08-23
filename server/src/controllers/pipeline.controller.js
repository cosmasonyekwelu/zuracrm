import Pipeline from "../models/Pipeline.js";
import { ApiError, ok } from "../utils/http.js";

const DEFAULT_STAGES = [
  { key: "qualification",  name: "Qualification",  probability: 0.10 },
  { key: "needs_analysis", name: "Needs Analysis", probability: 0.30 },
  { key: "proposal",       name: "Proposal",       probability: 0.60 },
  { key: "negotiation",    name: "Negotiation",    probability: 0.80 },
  { key: "closed_won",     name: "Closed Won",     probability: 1.00 },
  { key: "closed_lost",    name: "Closed Lost",    probability: 0.00 },
];

const slug = (s = "") =>
  s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

/**
 * GET /pipeline
 * Return the org's pipeline (or a default if none exists).
 */
export async function get(req, res) {
  const orgId = req.user.orgId;
  let pipe = await Pipeline.findOne({ orgId }).lean();

  if (!pipe) {
    // return a non-persisted default so UI has stages immediately
    return ok(res, { orgId, stages: DEFAULT_STAGES.map((s, i) => ({ ...s, order: i })) });
  }
  return ok(res, pipe);
}

/**
 * POST /pipeline
 * Replace the org's pipeline stages.
 * Body: { stages: (string|{key?, name, probability?, order?})[] }
 */
export async function set(req, res) {
  const orgId = req.user.orgId;

  const incoming = Array.isArray(req.body?.stages) ? req.body.stages : [];
  if (!incoming.length) throw new ApiError(400, "stages[] required");

  // normalize to {key, name, probability, order}
  const out = [];
  const used = new Set();

  incoming.forEach((s, idx) => {
    let key, name, probability, order;

    if (typeof s === "string") {
      name = s.trim();
      key = slug(name);
    } else if (s && typeof s === "object") {
      name = String(s.name || s.key || "").trim();
      key = slug(s.key || name);
      probability = typeof s.probability === "number" ? s.probability : undefined;
      order = Number.isInteger(s.order) ? s.order : undefined;
    }

    if (!name || !key) return;
    if (used.has(key)) return; // skip dups

    used.add(key);
    out.push({
      key,
      name,
      probability: Math.min(1, Math.max(0, Number(probability ?? 0))),
      order: Number.isFinite(order) ? order : idx,
    });
  });

  if (!out.length) throw new ApiError(400, "No valid stages");

  const saved = await Pipeline.findOneAndUpdate(
    { orgId },
    { $set: { stages: out, updatedBy: req.user.id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return ok(res, saved);
}

/**
 * GET /deals/stages
 * Return simplified list for the Deals board.
 */
export async function listStageNames(req, res) {
  const orgId = req.user.orgId;
  const pipe = await Pipeline.findOne({ orgId }).lean();

  const stages = (pipe?.stages?.length ? pipe.stages : DEFAULT_STAGES)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(({ key, name }) => ({ key, name }));

  return ok(res, stages);
}
