// server/src/routes/contacts.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { scopedCrud } from "../utils/withOrg.js";
import Contact from "../models/Contact.js";

const r = Router();
const CRUD = scopedCrud(Contact);

r.use(auth);
r.get("/",  asyncHandler(CRUD.list));
r.get("/:id", asyncHandler(CRUD.get));
r.post("/", asyncHandler(CRUD.create));
r.patch("/:id", asyncHandler(CRUD.update));
r.delete("/:id", asyncHandler(CRUD.remove));

export default r;
