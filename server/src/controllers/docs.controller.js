// server/src/controllers/docs.controller.js
import { ok, ApiError } from "../utils/http.js";
import { scopedCrud } from "../utils/withOrg.js";
import { isAdmin, readScopeFilter } from "../utils/acl.js";
import { Quote, Invoice, SalesOrder } from "../models/Docs.js";

/**
 * We reuse the generic multi-tenant CRUD for each discriminator.
 * This enforces:
 *  - org scoping (orgId)
 *  - read ACL (owner/assigned/shared/org for non-admins)
 *  - write ACL (admin OR owner/assigned)
 *  - createdBy/updatedBy set in CRUD layer
 */
const forQuotes      = scopedCrud(Quote);
const forInvoices    = scopedCrud(Invoice);
const forSalesOrders = scopedCrud(SalesOrder);

export const quotes = {
  list:   forQuotes.list,
  get:    forQuotes.get,
  create: forQuotes.create,
  update: forQuotes.update,
  remove: forQuotes.remove,
};

export const invoices = {
  list:   forInvoices.list,
  get:    forInvoices.get,
  create: forInvoices.create,
  update: forInvoices.update,
  remove: forInvoices.remove,
};

export const salesOrders = {
  list:   forSalesOrders.list,
  get:    forSalesOrders.get,
  create: forSalesOrders.create,
  update: forSalesOrders.update,
  remove: forSalesOrders.remove,
};

/**
 * (Optional) Example: lightweight stats widgets
 * Add routes if you want like:
 *   GET /quotes/stats, /invoices/stats, /salesorders/stats
 */
async function statsGeneric(Model, req, res) {
  const { orgId } = req.user;
  const baseMatch = { orgId, ...(isAdmin(req.user) ? {} : readScopeFilter(req.user)) };

  const [total, recent] = await Promise.all([
    Model.countDocuments(baseMatch),
    Model.countDocuments({ ...baseMatch, createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } }),
  ]);

  return ok(res, { total, last7d: recent });
}

export const quotesStats      = (req, res) => statsGeneric(Quote, req, res);
export const invoicesStats    = (req, res) => statsGeneric(Invoice, req, res);
export const salesOrdersStats = (req, res) => statsGeneric(SalesOrder, req, res);
