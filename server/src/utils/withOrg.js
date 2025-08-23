// server/src/utils/withOrg.js
import mongoose from "mongoose";
import { ApiError, ok } from "./http.js";
import { isAdmin, readScopeFilter, canWriteDoc } from "./acl.js";

const STR_SEARCH_FIELDS = ["name","title","email","phone","company"]; // good defaults

function buildSearch(search) {
  if (!search) return {};
  const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return { $or: STR_SEARCH_FIELDS.map((f) => ({ [f]: rx })) };
}

// Remove fields callers must not mutate directly
function sanitizePatch(body, { allowOwnership } = { allowOwnership: false }) {
  const disallowed = new Set(["_id","id","orgId","createdBy","updatedBy","createdAt","updatedAt"]);
  if (!allowOwnership) ["ownerId","assignedTo","sharedWith","visibility"].forEach((k) => disallowed.add(k));

  const out = {};
  Object.entries(body || {}).forEach(([k, v]) => {
    if (!disallowed.has(k)) out[k] = v;
  });
  return out;
}

export function scopedCrud(Model) {
  return {
    // GET /?page&limit&search&sort&dir&status&ownerId
    async list(req, res) {
      const user = req.user;
      const page  = Math.max(1, parseInt(req.query.page ?? "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "25", 10)));
      const sort  = String(req.query.sort || "createdAt");
      const dir   = String(req.query.dir || "desc").toLowerCase() === "asc" ? 1 : -1;
      const search= req.query.search || req.query.q;

      // base filter: tenant + ACL
      const filter = {
        orgId: user.orgId,
        ...readScopeFilter(user),
        // simple passthrough filters that many resources support
        ...(req.query.status && { status: req.query.status }),
        ...(req.query.ownerId && { ownerId: req.query.ownerId }),
      };
      if (search) Object.assign(filter, buildSearch(search));

      const query = Model.find(filter).sort({ [sort]: dir }).skip((page-1)*limit).limit(limit);
      const [items, total] = await Promise.all([
        query.lean(),
        Model.countDocuments(filter),
      ]);

      return ok(res, { items, total, page, pages: Math.ceil(total/limit), limit });
    },

    // GET /:id
    async get(req, res) {
      const user = req.user;
      const doc = await Model.findOne({ _id: req.params.id, orgId: user.orgId }).lean();
      if (!doc) throw new ApiError(404, "Not found");
      // read ACL: ensure visible (admins already passed)
      if (!isAdmin(user)) {
        const vis = await Model.exists({ _id: doc._id, orgId: user.orgId, ...readScopeFilter(user) });
        if (!vis) throw new ApiError(403, "Forbidden");
      }
      return ok(res, doc);
    },

    // POST /
    async create(req, res) {
      const user = req.user;
      const isOwnerOverride = isAdmin(user) && req.body?.ownerId;
      const payload = sanitizePatch(req.body, { allowOwnership: isAdmin(user) });

      const doc = await Model.create({
        ...payload,
        orgId: user.orgId,
        ownerId: isOwnerOverride ? req.body.ownerId : (user.id || user._id),
        createdBy: (user.id || user._id),
        updatedBy: (user.id || user._id),
      });

      return ok(res, doc, 201);
    },

    // PATCH /:id
    async update(req, res) {
      const user = req.user;
      const existing = await Model.findOne({ _id: req.params.id, orgId: user.orgId });
      if (!existing) throw new ApiError(404, "Not found");
      if (!canWriteDoc(user, existing)) throw new ApiError(403, "Forbidden");

      const patch = sanitizePatch(req.body, { allowOwnership: isAdmin(user) || String(existing.ownerId) === String(user.id || user._id) });

      // ownership fields (optional) only for admin/owner
      if (isAdmin(user) || String(existing.ownerId) === String(user.id || user._id)) {
        ["ownerId","assignedTo","sharedWith","visibility"].forEach((k) => {
          if (k in req.body) existing[k] = req.body[k];
        });
      }

      Object.assign(existing, patch, { updatedBy: (user.id || user._id) });
      await existing.save();

      return ok(res, existing);
    },

    // DELETE /:id
    async remove(req, res) {
      const user = req.user;
      const existing = await Model.findOne({ _id: req.params.id, orgId: user.orgId });
      if (!existing) throw new ApiError(404, "Not found");
      if (!canWriteDoc(user, existing)) throw new ApiError(403, "Forbidden");

      await existing.deleteOne();
      return ok(res, { ok: true });
    },
  };
}
