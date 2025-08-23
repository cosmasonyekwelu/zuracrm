// server/src/routes/leads.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler, ok } from "../utils/http.js";
import { scopedCrud } from "../utils/withOrg.js";
import { readScopeFilter, isAdmin } from "../utils/acl.js";
import Lead from "../models/Lead.js";

const r = Router();
const CRUD = scopedCrud(Lead);

r.use(auth);

// CRUD
r.get("/", asyncHandler(CRUD.list));
r.get("/:id", asyncHandler(CRUD.get));
r.post("/", asyncHandler(CRUD.create));
r.patch("/:id", asyncHandler(CRUD.update));
r.delete("/:id", asyncHandler(CRUD.remove));

// Home widget expects: GET /leads/stats -> { total, today }
r.get("/stats", asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const today = new Date();
  today.setHours(0,0,0,0);

  const baseMatch = { orgId, ...(isAdmin(req.user) ? {} : readScopeFilter(req.user)) };

  const [total, todayCount] = await Promise.all([
    Lead.countDocuments(baseMatch),
    Lead.countDocuments({ ...baseMatch, createdAt: { $gte: today } }),
  ]);

  return ok(res, { total, today });
}));

export default r;
