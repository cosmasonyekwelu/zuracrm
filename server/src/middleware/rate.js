import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const generalLimiter = rateLimit({
  windowMs: env.RATE_WINDOW_MS,
  max: env.RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_WINDOW_MS,
  max: env.AUTH_RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, try again later" }
});
