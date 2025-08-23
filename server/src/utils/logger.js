import pino from "pino";
import pinoHttp from "pino-http";
import { env } from "../config/env.js";

export const logger = pino({
  level: process.env.LOG_LEVEL || (env.NODE_ENV === "production" ? "info" : "debug"),
  transport: env.NODE_ENV === "development" ? { target: "pino-pretty", options: { colorize: true } } : undefined
});

export const httpLogger = pinoHttp({
  logger,
  customSuccessMessage: function (req, res) {
    return `${req.method} ${req.url} -> ${res.statusCode}`;
  },
  customErrorMessage: function (req, res, err) {
    return `${req.method} ${req.url} -> ${res.statusCode} (${err.message})`;
  }
});
