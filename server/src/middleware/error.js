import { ApiError } from "../utils/http.js";
import { env } from "../config/env.js";

export function notFound(_req, _res, next){
  next(new ApiError(404, "Route not found"));
}

export function errorHandler(err, _req, res, _next){
  const status = err instanceof ApiError && err.statusCode ? err.statusCode : 500;
  const message = err.message || "Server error";
  const body = { message };
  if (env.NODE_ENV !== "production" && err.meta) body.meta = err.meta;
  res.status(status).json(body);
}
