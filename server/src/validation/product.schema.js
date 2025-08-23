// server/src/validation/products.schema.js
import { z } from "zod";

export const productCreate = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  price: z.coerce.number().min(0).default(0),
  cost: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  active: z.coerce.boolean().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
}).strict();

export const productUpdate = productCreate.partial();

export const productQuery = z.object({
  // allow undefined or empty string
  search: z.string().optional().or(z.literal("")),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).optional(),
  active: z.coerce.boolean().optional(),
}).strict().partial();
