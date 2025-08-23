import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { getEmailSettings, saveEmailSettings } from "../controllers/email.controller.js";

const r = Router();
r.get("/email/settings", auth, asyncHandler(getEmailSettings));
r.post("/email/settings", auth, asyncHandler(saveEmailSettings));
export default r;
