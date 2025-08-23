// server/src/routes/products.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { validate } from "../middleware/validate.js";

import * as C from "../controllers/products.controller.js";

const r = Router();

const listQuery = {
  type: "object",
  properties: {
    q: { type: "string" },
    page: { type: "string" },
    limit: { type: "string" },
    active: { type: "string" },
    category: { type: "string" },
  },
  additionalProperties: true,
};

const upsertBody = {
  type: "object",
  properties: {
    name: { type: "string" },
    sku: { type: "string" },
    price: { type: "number" },
    cost: { type: "number" },
    stock: { type: "number" },
    active: { type: "boolean" },
    imageUrl: { type: "string" },
    description: { type: "string" },
    category: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    visibility: { type: "string", enum: ["private", "shared", "org"] },
    sharedWith: { type: "array", items: { type: "string" } },
    ownerId: { type: "string" }, // admin may reassign
  },
  additionalProperties: true,
};

const idParam = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string" } },
};

r.get("/", auth, validate({ query: listQuery }), asyncHandler(C.list));
r.post("/", auth, validate({ body: upsertBody }), asyncHandler(C.create));
r.get("/:id", auth, validate({ params: idParam }), asyncHandler(C.get));
r.patch("/:id", auth, validate({ params: idParam, body: upsertBody }), asyncHandler(C.update));
r.delete("/:id", auth, validate({ params: idParam }), asyncHandler(C.remove));

export default r;
