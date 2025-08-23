// server/src/validation/auth.schema.js
import { z } from "zod";

const phoneRegex = /^\+?[0-9\-().\s]{6,20}$/;

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().regex(phoneRegex, "Invalid phone").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  inviteToken: z.string().optional(),
}).refine(
  (v) => (v.email && v.email.trim()) || (v.phone && v.phone.trim()),
  { message: "Provide an email or a phone number", path: ["email"] }
);

export const signinSchema = z.object({
  identifier: z.string().min(3, "Enter email or phone"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
