// server/src/routes/docs.routes.js
import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { auth } from "../middleware/auth.js";
import { quotes, invoices, salesOrders } from "../controllers/docs.controller.js";
import { validate } from "../middleware/validate.js";
import { docCreate, docUpdate } from "../validation/docs.schema.js";
import { paginationQuery, idParam } from "../validation/common.schema.js";

const r = Router();

r.get("/quotes", auth, validate({ query: paginationQuery.optional() }), asyncHandler(quotes.list));
r.post("/quotes", auth, validate({ body: docCreate }), asyncHandler(quotes.create));
r.get("/quotes/:id", auth, validate({ params: idParam }), asyncHandler(quotes.get));
r.patch("/quotes/:id", auth, validate({ params: idParam, body: docUpdate }), asyncHandler(quotes.update));
r.delete("/quotes/:id", auth, validate({ params: idParam }), asyncHandler(quotes.remove));

r.get("/invoices", auth, validate({ query: paginationQuery.optional() }), asyncHandler(invoices.list));
r.post("/invoices", auth, validate({ body: docCreate }), asyncHandler(invoices.create));
r.get("/invoices/:id", auth, validate({ params: idParam }), asyncHandler(invoices.get));
r.patch("/invoices/:id", auth, validate({ params: idParam, body: docUpdate }), asyncHandler(invoices.update));
r.delete("/invoices/:id", auth, validate({ params: idParam }), asyncHandler(invoices.remove));

r.get("/salesorders", auth, validate({ query: paginationQuery.optional() }), asyncHandler(salesOrders.list));
r.post("/salesorders", auth, validate({ body: docCreate }), asyncHandler(salesOrders.create));
r.get("/salesorders/:id", auth, validate({ params: idParam }), asyncHandler(salesOrders.get));
r.patch("/salesorders/:id", auth, validate({ params: idParam, body: docUpdate }), asyncHandler(salesOrders.update));
r.delete("/salesorders/:id", auth, validate({ params: idParam }), asyncHandler(salesOrders.remove));

export default r;
