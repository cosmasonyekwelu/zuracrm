import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { activityStats } from "../controllers/stats.controller.js";

const r = Router();
// mounted at /api/activities in routes/index.js
r.get("/stats", auth, asyncHandler(activityStats));
export default r;
