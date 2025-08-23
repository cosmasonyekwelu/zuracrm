// server/src/controllers/campaigns.controller.js
import Campaign from "../models/Campaign.js";

const toNum = (v, d=0) => {
  const n = typeof v === "string" ? Number(v.replace(/[, ]+/g,"")) : Number(v);
  return Number.isFinite(n) ? n : d;
};
const toDate = (v) => (v ? new Date(v) : undefined);

const normalizeStatus = (s) => {
  if (!s) return undefined;
  const m = String(s).toLowerCase();
  if (m === "active") return "Running";
  if (m === "planning") return "Planned";
  // keep if already one of our enums
  const upper = m[0]?.toUpperCase() + m.slice(1);
  return ["Draft","Planned","Running","Paused","Completed","Cancelled"].includes(upper) ? upper : undefined;
};

const pickView = (doc) => ({
  _id: doc._id,
  name: doc.name,
  channel: doc.channel,
  status: doc.status,
  startDate: doc.startDate,
  endDate: doc.endDate,
  budget: doc.budget,
  actualCost: doc.actualCost,
  notes: doc.notes,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export async function list(req, res, next) {
  try {
    const { search, status, channel, dateFrom, dateTo } = req.query;

    const q = { orgId: req.user.orgId };
    if (search) {
      const s = String(search).trim();
      q.$or = [
        { name:    { $regex: s, $options: "i" } },
        { channel: { $regex: s, $options: "i" } },
        { status:  { $regex: s, $options: "i" } },
      ];
    }
    const ns = normalizeStatus(status);
    if (ns) q.status = ns;
    if (channel) q.channel = channel;

    if (dateFrom || dateTo) {
      q.$and = q.$and || [];
      if (dateFrom) q.$and.push({ startDate: { $gte: new Date(dateFrom) } });
      if (dateTo)   q.$and.push({ endDate:   { $lte: new Date(dateTo) } });
    }

    const items = await Campaign.find(q).sort({ updatedAt: -1 }).lean();
    return res.json(items.map(pickView));
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const body = req.body || {};

    const doc = await Campaign.create({
      orgId: req.user.orgId,
      ownerId: req.user.id,
      createdBy: req.user.id,
      updatedBy: req.user.id,

      name: (body.name || "").trim(),
      channel: (body.channel || body.type || "Email").trim(),
      status: normalizeStatus(body.status) || "Draft",
      startDate: toDate(body.startDate || body.startAt),
      endDate:   toDate(body.endDate   || body.endAt),
      budget: toNum(body.budget, 0),
      actualCost: toNum(body.actualCost, 0),
      notes: body.notes?.trim() || undefined,
    });

    return res.status(201).json({ item: pickView(doc.toObject()) });
  } catch (e) {
    if (e?.name === "ValidationError" || e?.name === "CastError") {
      return res.status(400).json({ message: "Campaign validation failed", details: e.message });
    }
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const body = req.body || {};
    const patch = {};

    if (body.name !== undefined)       patch.name = String(body.name || "").trim();
    if (body.channel !== undefined || body.type !== undefined)
      patch.channel = String(body.channel ?? body.type ?? "").trim() || "Email";
    if (body.status !== undefined)     patch.status = normalizeStatus(body.status) || "Draft";
    if (body.startDate !== undefined || body.startAt !== undefined)
      patch.startDate = toDate(body.startDate ?? body.startAt);
    if (body.endDate !== undefined || body.endAt !== undefined)
      patch.endDate = toDate(body.endDate ?? body.endAt);
    if (body.budget !== undefined)     patch.budget = toNum(body.budget, 0);
    if (body.actualCost !== undefined) patch.actualCost = toNum(body.actualCost, 0);
    if (body.notes !== undefined)      patch.notes = body.notes?.trim() || undefined;
    patch.updatedBy = req.user.id;

    const doc = await Campaign.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      patch,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: "Campaign not found" });
    return res.json({ item: pickView(doc.toObject()) });
  } catch (e) {
    if (e?.name === "ValidationError" || e?.name === "CastError") {
      return res.status(400).json({ message: "Campaign validation failed", details: e.message });
    }
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const doc = await Campaign.findOneAndDelete({ _id: req.params.id, orgId: req.user.orgId });
    if (!doc) return res.status(404).json({ message: "Campaign not found" });
    return res.status(204).end();
  } catch (e) {
    next(e);
  }
}
