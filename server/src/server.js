import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import { logger } from "./utils/logger.js";

let server;

async function start(){
  await connectDB(logger);
  server = app.listen(env.PORT, () => logger.info(`${env.APP_NAME} running on http://localhost:${env.PORT}`));
}

function shutdown(sig){
  return () => {
    logger.info(`${sig} received, shutting down...`);
    server?.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
}

process.on("SIGINT", shutdown("SIGINT"));
process.on("SIGTERM", shutdown("SIGTERM"));

start().catch((err) => {
  logger.error({ err }, "Failed to start");
  process.exit(1);
});
