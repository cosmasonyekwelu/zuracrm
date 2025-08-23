import { z } from "zod";

export const meetingCreate = z.object({
  subject: z.string().min(1),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  status: z.enum(["Scheduled", "Completed", "Cancelled"]).optional(),
  notes: z.string().optional()
});
export const meetingUpdate = meetingCreate.partial();
