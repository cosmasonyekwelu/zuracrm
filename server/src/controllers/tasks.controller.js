// server/src/controllers/tasks.controller.js
import Task from "../models/Task.js";

const toNum = (v, d = 0) => {
  const n = typeof v === "string" ? Number(v.replace(/[, ]+/g, "")) : Number(v);
  return Number.isFinite(n) ? n : d;
};
const toDate = (v) => (v ? new Date(v) : undefined);

const normalizeStatus = (s) => {
  if (!s) return undefined;
  const m = String(s).toLowerCase();
  if (["done", "completed"].includes(m)) return "Completed";
  if (["in-progress", "progress"].includes(m)) return "In Progress";
  if (["open"].includes(m)) return "Open";
  const cap = m.charAt(0).toUpperCase() + m.slice(1);
  return ["Open", "In Progress", "Completed"].includes(cap) ? cap : undefined;
};

const normalizePriority = (p) => {
  if (!p) return undefined;
  const m = String(p).toLowerCase();
  const cap = m.charAt(0).toUpperCase() + m.slice(1);
  return ["Low", "Normal", "High"].includes(cap) ? cap : undefined;
};

const pickView = (doc) => ({
  _id: doc._id,
  title: doc.title,
  with: doc.with,
  status: doc.status,
  priority: doc.priority,
  dueDate: doc.dueDate,
  notes: doc.notes,
  ownerId: doc.ownerId,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export async function list(req, res, next) {
  try {
    const { search, status, priority, dueFrom, dueTo, overdue, sort = "updated", dir = "desc" } = req.query;

    const q = { orgId: req.user.orgId };

    if (search) {
      const s = String(search).trim();
      q.$or = [
        { title: { $regex: s, $options: "i" } },
        { with:  { $regex: s, $options: "i" } },
        { status:{ $regex: s, $options: "i" } },
      ];
    }

    const ns = normalizeStatus(status);
    if (ns) q.status = ns;

    const np = normalizePriority(priority);
    if (np) q.priority = np;

    if (dueFrom || dueTo) {
      q.dueDate = {};
      if (dueFrom) q.dueDate.$gte = new Date(dueFrom);
      if (dueTo)   q.dueDate.$lte = new Date(dueTo);
    }

    if (overdue === "1") {
      const now = new Date();
      q.$and = [
        ...(q.$and || []),
        { $or: [{ dueDate: { $lt: now } }] },
        { status: { $ne: "Completed" } },
      ];
    }

    const sortMap = {
      title: { title: 1 },
      due:   { dueDate: 1, createdAt: 1 },
      created:{ createdAt: 1 },
      updated:{ updatedAt: 1 },
      priority: { priority: 1, dueDate: 1 },
      status:   { status: 1, dueDate: 1 },
    };
    const sKey = sortMap[sort] ? sort : "updated";
    const sObj = sortMap[sKey];
    for (const k in sObj) sObj[k] = dir === "asc" ? 1 : -1;

    const items = await Task.find(q).sort(sObj).lean();
    res.json(items.map(pickView));
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const b = req.body || {};
    const doc = await Task.create({
      orgId: req.user.orgId,
      ownerId: req.user.id,
      createdBy: req.user.id,
      updatedBy: req.user.id,

      title: (b.title ?? b.subject ?? "").trim(),
      with:  (b.with ?? b.withName ?? "").trim() || undefined,
      status: normalizeStatus(b.status) || "Open",
      priority: normalizePriority(b.priority) || "Normal",
      dueDate: toDate(b.dueDate),
      notes: b.notes?.trim() || undefined,
    });
    res.status(201).json(pickView(doc.toObject()));
  } catch (e) {
    if (e?.name === "ValidationError" || e?.name === "CastError") {
      return res.status(400).json({ message: "Task validation failed", details: e.message });
    }
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const b = req.body || {};
    const patch = { updatedBy: req.user.id };

    if (b.title !== undefined || b.subject !== undefined)
      patch.title = String(b.title ?? b.subject ?? "").trim();
    if (b.with !== undefined || b.withName !== undefined)
      patch.with = String(b.with ?? b.withName ?? "").trim() || undefined;
    if (b.status !== undefined)
      patch.status = normalizeStatus(b.status) || "Open";
    if (b.priority !== undefined)
      patch.priority = normalizePriority(b.priority) || "Normal";
    if (b.dueDate !== undefined)
      patch.dueDate = toDate(b.dueDate);
    if (b.notes !== undefined)
      patch.notes = b.notes?.trim() || undefined;

    const doc = await Task.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      patch,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: "Task not found" });
    res.json(pickView(doc.toObject()));
  } catch (e) {
    if (e?.name === "ValidationError" || e?.name === "CastError") {
      return res.status(400).json({ message: "Task validation failed", details: e.message });
    }
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const doc = await Task.findOneAndDelete({ _id: req.params.id, orgId: req.user.orgId });
    if (!doc) return res.status(404).json({ message: "Task not found" });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
