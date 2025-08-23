import { z } from "zod";

const item = z.object({
  productId: z.string().length(24).optional(),
  name: z.string().min(1),
  qty: z.coerce.number().min(0),
  price: z.coerce.number().min(0)
});

export const docCreate = z.object({
  account: z.string().min(1),
  items: z.array(item).default([]),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional()
});

export const docUpdate = docCreate.partial().extend({
  status: z.string().optional()
});
