import { z } from "zod";
export const dealCreate = z.object({
  name: z.string().min(1),
  stage: z.enum(["Prospecting","Qualification","Proposal","Negotiation","Closed Won","Closed Lost"]).optional(),
  value: z.coerce.number().min(0).optional(),
  closeDate: z.coerce.date().optional(),
  account: z.string().optional(),
  notes: z.string().optional()
});
export const dealUpdate = dealCreate.partial();
