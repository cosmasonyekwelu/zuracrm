import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import * as C from "../controllers/deals.controller.js";

const r = Router();

// Put /stages before any potential /:id GET if you add that later.
r.get("/stages", auth, asyncHandler(C.getStages));

// deals CRUD
r.get("/",  auth, asyncHandler(C.list));
r.post("/", auth, asyncHandler(C.create));
r.patch("/:id", auth, asyncHandler(C.update));

export default r;
