import { z } from "zod";
export const contactCreate = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional()
});
export const contactUpdate = contactCreate.partial();
