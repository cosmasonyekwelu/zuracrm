import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { searchAll } from "../controllers/search.controller.js";

const r = Router();
r.get("/search", auth, asyncHandler(searchAll));
export default r;
