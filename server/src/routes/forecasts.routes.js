// server/src/routes/forecasts.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { summary } from "../controllers/forecasts.controller.js";

const r = Router();

// GET /api/forecasts/summary
r.get("/summary", auth, asyncHandler(summary));

export default r;
