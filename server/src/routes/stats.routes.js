// server/src/routes/stats.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import * as C from "../controllers/stats.controller.js";

const r = Router();

// All require auth; supports optional ?scope=mine to show only the signed-in user's numbers
r.get("/stats/home", auth, asyncHandler(C.home));
r.get("/stats/summary", auth, asyncHandler(C.summary));
r.get("/stats", auth, asyncHandler(C.index));

export default r;
