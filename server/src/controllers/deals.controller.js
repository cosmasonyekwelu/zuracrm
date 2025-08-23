// server/src/controllers/deals.controller.js
import Deal from "../models/Deal.js";
// If you have a Pipeline/Settings model that stores stages per org, import it here.
// import Pipeline from "../models/Pipeline.js";

const DEFAULT_STAGE_LABELS = [
  "Qualification",
  "Needs Analysis",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

// utils
const slug = (s = "") =>
  s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const stripEmpty = (obj) =>
  Object.fromEntries(Object.entries(obj || {}).filter(([_, v]) => !(v === "" || v == null)));

const toNumber = (v, d = 0) => {
  const n = typeof v === "string" ? Number(v.replace(/[, ]+/g, "")) : Number(v);
  return Number.isFinite(n) ? n : d;
};
const toDate = (v) => {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(+d) ? undefined : d;
};

function stageHelpers(stageLabels) {
  const pairs = stageLabels.map((name) => [slug(name), name]);
  const keyToLabel = new Map(pairs);
  const labelToKey = new Map(pairs.map(([k, name]) => [name.toLowerCase(), k]));
  return {
    toLabel: (v) => keyToLabel.get(slug(v)) || v || stageLabels[0],
    toKey: (v) => labelToKey.get(String(v).toLowerCase()) || slug(v),
    isLabel: (v) => stageLabels.map((x) => x.toLowerCase()).includes(String(v).toLowerCase()),
    labels: stageLabels,
  };
}

// If you store stages in DB, fetch them per org; otherwise fallback
async function fetchStageLabels(orgId) {
  // Example if you have Pipeline:
  // const cfg = await Pipeline.findOne({ orgId }).lean();
  // const labels = Array.isArray(cfg?.stages) && cfg.stages.length
  //   ? cfg.stages.map((s) => (typeof s === "string" ? s : s.name)).filter(Boolean)
  //   : DEFAULT_STAGE_LABELS;
  // return labels;
  return DEFAULT_STAGE_LABELS;
}

export async function getStages(req, res, next) {
  try {
    const labels = await fetchStageLabels(req.user.orgId);
    // You can return either strings or {key,name}. Frontend can handle both.
    return res.json(labels);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const { view } = req.query;
    const deals = await Deal.find({ orgId: req.user.orgId })
      .sort({ updatedAt: -1 })
      .lean();

    // For now, just return the raw list; the frontend groups by stage.
    if (view === "kanban") return res.json(deals);
    return res.json({ items: deals, count: deals.length });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const labels = await fetchStageLabels(req.user.orgId);
    const S = stageHelpers(labels);

    const body = stripEmpty(req.body);
    const doc = await Deal.create({
      name: (body.name || "").trim() || "Untitled Deal",
      amount: toNumber(body.amount, 0),
      // accept either key or label; store label to be backend-friendly
      stage: S.isLabel(body.stage) ? body.stage : S.toLabel(body.stage),
      closeDate: toDate(body.closeDate),

      // legacy fields we removed on the UI are ignored if absent
      // accountId: body.accountId || undefined,
      // account: body.accountId ? undefined : (body.account || undefined),

      orgId: req.user.orgId,
      owner: req.user.id,
      ownerId: req.user.id,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    return res.status(201).json({ item: doc });
  } catch (err) {
    if (err?.name === "ValidationError" || err?.name === "CastError") {
      return res.status(400).json({ message: "Deal validation failed", details: err.message });
    }
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const labels = await fetchStageLabels(req.user.orgId);
    const S = stageHelpers(labels);

    const body = stripEmpty(req.body);
    const update = {
      ...(body.name !== undefined ? { name: (body.name || "").trim() || "Untitled Deal" } : {}),
      ...(body.amount !== undefined ? { amount: toNumber(body.amount, 0) } : {}),
      ...(body.stage !== undefined
        ? { stage: S.isLabel(body.stage) ? body.stage : S.toLabel(body.stage) }
        : {}),
      ...(body.closeDate !== undefined ? { closeDate: toDate(body.closeDate) } : {}),
      updatedBy: req.user.id,
    };

    const doc = await Deal.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      update,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: "Deal not found" });
    return res.json({ item: doc });
  } catch (err) {
    if (err?.name === "ValidationError" || err?.name === "CastError") {
      return res.status(400).json({ message: "Deal validation failed", details: err.message });
    }
    next(err);
  }
}
