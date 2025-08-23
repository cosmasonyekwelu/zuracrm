import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { upload } from "../middleware/upload.js";
import { getOrg, patchOrg, uploadLogo } from "../controllers/org.controller.js";

const r = Router();
r.get("/org", auth, asyncHandler(getOrg));
r.patch("/org", auth, asyncHandler(patchOrg));
r.post("/org/logo", auth, upload.single("file"), asyncHandler(uploadLogo));
export default r;
