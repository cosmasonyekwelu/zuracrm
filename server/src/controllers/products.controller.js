import Product from "../models/Product.js";
import { ok, ApiError } from "../utils/http.js";

const orgFilter = (user) => ({ orgId: user.orgId });

export async function list(req, res) {
  const { search = "", limit = 50, page = 1 } = req.query || {};
  const filter = { ...orgFilter(req.user) };

  if (typeof search === "string" && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const cursor = Product.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const items = await cursor.lean();
  return ok(res, items);
}

export async function create(req, res, next) {
  try {
    const body = req.body || {};
    const doc = await Product.create({
      ...body,
      orgId: req.user.orgId,
      createdBy: req.user.id,
    });
    return ok(res, doc, 201);
  } catch (e) {
    if (e?.code === 11000) {
      // duplicate per-org sku
      return next(new ApiError(409, "SKU must be unique within your organization"));
    }
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const patch = { ...req.body };
    delete patch.orgId; delete patch.createdBy; // safety

    const doc = await Product.findOneAndUpdate(
      { _id: id, ...orgFilter(req.user) },
      { $set: patch },
      { new: true }
    ).lean();

    if (!doc) throw new ApiError(404, "Product not found");
    return ok(res, doc);
  } catch (e) {
    if (e?.code === 11000) {
      return next(new ApiError(409, "SKU must be unique within your organization"));
    }
    next(e);
  }
}

export async function remove(req, res) {
  const { id } = req.params;
  const r = await Product.deleteOne({ _id: id, ...orgFilter(req.user) });
  if (!r.deletedCount) throw new ApiError(404, "Product not found");
  return ok(res, { ok: true });
}
