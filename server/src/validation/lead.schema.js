// src/validators/lead.schema.js
import { z } from "zod";

export const LeadBody = z
  .object({
    name: z.string().trim().min(1).optional(),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    source: z.enum(["Web", "Referral", "Event", "Ads", "Email"]).optional(),
    status: z.enum(["New", "Contacted", "Qualified", "Unqualified"]).optional(),
  })
  .refine(
    (d) => Boolean((d.name && d.name.trim()) || d.firstName || d.lastName),
    { path: ["name"], message: "Provide `name` or `firstName`/`lastName`" }
  );
