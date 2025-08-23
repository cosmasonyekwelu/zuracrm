import { z } from "zod";

export const taskCreate = z.object({
  title: z.string().min(1),
  status: z.enum(["Open", "In Progress", "Done"]).optional(),
  priority: z.enum(["Low", "Normal", "High"]).optional(),
  dueAt: z.coerce.date().optional(),
  notes: z.string().optional()
});
export const taskUpdate = taskCreate.partial();
