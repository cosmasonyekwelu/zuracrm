import client from "prom-client";
import { env } from "./config/env.js";

export const registry = new client.Registry();
registry.setDefaultLabels({ app: env.APP_NAME });
client.collectDefaultMetrics({ register: registry, prefix: env.METRICS_PREFIX });

export const httpRequestCounter = new client.Counter({
  name: `${env.METRICS_PREFIX}http_requests_total`,
  help: "Total number of HTTP requests",
  labelNames: ["method","route","status"]
});
registry.registerMetric(httpRequestCounter);
