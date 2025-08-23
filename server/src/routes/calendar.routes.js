import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import * as C from "../controllers/calendar.controller.js";

const r = Router();

// private (requires auth)
r.get("/settings", auth, asyncHandler(C.getSettings));
r.patch("/settings", auth, asyncHandler(C.patchSettings));
r.get("/slots", auth, asyncHandler(C.slots));
r.post("/book", auth, asyncHandler(C.book));

// public (no auth — for /book/:slug pages)
r.get("/public/:slug", asyncHandler(C.getPublicBySlug));
r.get("/public/:slug/slots", asyncHandler(C.publicSlots));
r.post("/public/:slug/book", asyncHandler(C.publicBook));

export default r;
