// server/src/routes/auth.routes.js
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/http.js";
import { authLimiter } from "../middleware/rate.js";
import { auth } from "../middleware/auth.js";
import * as C from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";

const signupSchema = z.object({
  name: z.string().min(1, "name is required").optional(),
  email: z.string().email("invalid email").optional(),
  phone: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(6, "password must be at least 6 characters"),
  avatar: z.string().optional(),
  inviteToken: z.string().optional(),
}).refine((v) => v.email || v.phone || v.username, {
  message: "email, phone, or username is required",
});

const signinSchema = z.object({
  identifier: z.string().min(1, "identifier is required"),
  password: z.string().min(1, "password is required"),
});

const r = Router();

r.post("/signup", authLimiter, validate({ body: signupSchema }), asyncHandler(C.register));
r.post("/signin", authLimiter, validate({ body: signinSchema }), asyncHandler(C.login));
r.post("/signout", asyncHandler(C.logout));
r.get("/me", auth, asyncHandler(C.me));

// Aliases
r.post("/register", authLimiter, validate({ body: signupSchema }), asyncHandler(C.register));
r.post("/login", authLimiter, validate({ body: signinSchema }), asyncHandler(C.login));
r.post("/logout", asyncHandler(C.logout));

export default r;
