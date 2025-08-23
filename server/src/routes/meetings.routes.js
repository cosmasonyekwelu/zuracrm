import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import * as C from "../controllers/meetings.controller.js";

const r = Router();

// CRUD
r.get("/",       auth, asyncHandler(C.list));
r.post("/",      auth, asyncHandler(C.create));
r.patch("/:id",  auth, asyncHandler(C.update));
r.delete("/:id", auth, asyncHandler(C.remove));

// Extras
r.get("/:id.ics",      auth, asyncHandler(C.ics));
r.post("/:id/rsvp",    auth, asyncHandler(C.rsvp));
r.post("/:id/forward", auth, asyncHandler(C.forward));

export default r;
