import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { getIntegrations, saveIntegrations, connectEmail } from "../controllers/integrations.controller.js";

const r = Router();
r.get("/integrations", auth, asyncHandler(getIntegrations));
r.post("/integrations", auth, asyncHandler(saveIntegrations));
r.post("/integrations/email/connect", auth, asyncHandler(connectEmail));
export default r;
