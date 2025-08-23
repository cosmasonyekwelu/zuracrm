// src/controllers/accounts.controller.js
import Account from "../models/Account.js";
import { ApiError, ok } from "../utils/http.js";
import mongoose from "mongoose";

// Small helper to read org from the authenticated user
function getOrgId(req) {
  const orgId = req.user?.orgId;
  if (!orgId) throw new ApiError(400, "Missing organization context");
  return orgId;
}

export async function listAccounts(req, res) {
  const orgId = getOrgId(req);

  const {
    q = "",
    page = 1,
    limit = 20,
    sort = "-createdAt", // default newest first
  } = req.query || {};

  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const filter = { org: orgId };

  // Text search or safe regex fallback
  if (q && typeof q === "string") {
    filter.$or = [
      { $text: { $search: q } },
      { name:     { $regex: q, $options: "i" } },
      { industry: { $regex: q, $options: "i" } },
      { phone:    { $regex: q, $options: "i" } },
      { website:  { $regex: q, $options: "i" } },
      { notes:    { $regex: q, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Account.find(filter)
      .sort(sort)
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    Account.countDocuments(filter),
  ]);

  const pages = Math.max(Math.ceil(total / l), 1);
  return ok(res, { items, total, page: p, pages, limit: l });
}

export async function getAccount(req, res) {
  const orgId = getOrgId(req);
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id");

  const doc = await Account.findOne({ _id: id, org: orgId }).lean();
  if (!doc) throw new ApiError(404, "Account not found");

  return ok(res, doc);
}

export async function createAccount(req, res) {
  const orgId = getOrgId(req);
  const userId = req.user.id;

  const { name, industry, phone, website, notes, owner } = req.body || {};
  if (!name || !name.trim()) throw new ApiError(400, "Name is required");

  const doc = await Account.create({
    org: orgId,
    name: name.trim(),
    industry,
    phone,
    website,
    notes,
    owner: owner || userId,
    createdBy: userId,
    updatedBy: userId,
  });

  return ok(res, doc, 201);
}

// Allow updates for owners or admins
function canEdit(req, doc) {
  if (!doc) return false;
  if (req.user.role === "admin") return true;
  return String(doc.owner) === String(req.user.id);
}

export async function updateAccount(req, res) {
  const orgId = getOrgId(req);
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id");

  const doc = await Account.findOne({ _id: id, org: orgId });
  if (!doc) throw new ApiError(404, "Account not found");
  if (!canEdit(req, doc)) throw new ApiError(403, "Forbidden");

  const patch = {};
  const fields = ["name", "industry", "phone", "website", "notes", "owner"];
  for (const f of fields) {
    if (f in req.body) patch[f] = req.body[f];
  }
  patch.updatedBy = req.user.id;

  const updated = await Account.findByIdAndUpdate(id, patch, { new: true }).lean();
  return ok(res, updated);
}

export async function replaceAccount(req, res) {
  // Support PUT for your axios fallback (PATCH→PUT)
  const orgId = getOrgId(req);
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id");

  const doc = await Account.findOne({ _id: id, org: orgId });
  if (!doc) throw new ApiError(404, "Account not found");
  if (!canEdit(req, doc)) throw new ApiError(403, "Forbidden");

  const { name, industry, phone, website, notes, owner } = req.body || {};
  if (!name || !name.trim()) throw new ApiError(400, "Name is required");

  const nextDoc = {
    org: orgId, // keep org stable
    name: name.trim(),
    industry: industry || "",
    phone: phone || "",
    website: website || "",
    notes: notes || "",
    owner: owner || doc.owner,
    updatedBy: req.user.id,
  };

  const updated = await Account.findByIdAndUpdate(id, nextDoc, { new: true, overwrite: true }).lean();
  return ok(res, updated);
}

export async function deleteAccount(req, res) {
  const orgId = getOrgId(req);
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid id");

  const doc = await Account.findOne({ _id: id, org: orgId });
  if (!doc) throw new ApiError(404, "Account not found");

  // route already role-gates to admin/manager; this is extra safety for owners
  if (req.user.role !== "admin" && req.user.role !== "manager" && !canEdit(req, doc)) {
    throw new ApiError(403, "Forbidden");
  }

  await Account.deleteOne({ _id: id, org: orgId });
  return ok(res, { ok: true });
}
