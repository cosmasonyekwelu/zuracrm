import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import * as C from "../controllers/campaigns.controller.js";

const r = Router();

r.get("/", auth, asyncHandler(C.list));
r.post("/", auth, asyncHandler(C.create));
r.patch("/:id", auth, asyncHandler(C.update));
r.delete("/:id", auth, asyncHandler(C.remove));

export default r;
