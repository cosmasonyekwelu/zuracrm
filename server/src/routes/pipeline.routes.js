import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as C from "../controllers/pipeline.controller.js";
import { z } from "zod";

const r = Router();

// Body validator for POST /pipeline
const saveSchema = z.object({
  stages: z.array(
    z.union([
      z.string().min(1),
      z.object({
        key: z.string().min(1).optional(),
        name: z.string().min(1),
        probability: z.number().min(0).max(1).optional(),
        order: z.number().int().min(0).optional(),
      }),
    ])
  ).min(1, "At least one stage is required"),
});

r.get("/pipeline", auth, C.get);
r.post("/pipeline", auth, validate({ body: saveSchema }), C.set);

// Alias used by Deals board
r.get("/deals/stages", auth, C.listStageNames);

export default r;
