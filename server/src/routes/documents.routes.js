import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { handleUpload } from "../middleware/upload.js";
import * as C from "../controllers/documents.controller.js";

const r = Router();

r.get("/", auth, asyncHandler(C.list));
r.post("/", auth, handleUpload("file"), asyncHandler(C.create));
r.delete("/:id", auth, asyncHandler(C.remove));

export default r;
