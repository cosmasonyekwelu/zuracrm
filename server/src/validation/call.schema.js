import { z } from "zod";

export const callCreate = z.object({
  subject: z.string().min(1),
  phone: z.string().optional(),
  callAt: z.coerce.date().optional(),
  durationMin: z.coerce.number().min(0).optional(),
  outcome: z.enum(["Planned", "Completed", "No Answer", "Voicemail"]).optional(),
  notes: z.string().optional()
});
export const callUpdate = callCreate.partial();
