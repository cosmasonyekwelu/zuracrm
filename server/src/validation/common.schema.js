import { z } from "zod";

export const idParam = z.object({ id: z.string().length(24, "Invalid id") });

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().optional()
});
