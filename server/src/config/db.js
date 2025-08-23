import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(logger){
  mongoose.set("strictQuery", true);
  mongoose.connection.on("connected", () => logger.info({ msg: "MongoDB Compass is connected" }));
  mongoose.connection.on("error", (err) => logger.error({ err }, "Mongo error"));
  mongoose.connection.on("disconnected", () => logger.warn("Mongo disconnected"));
  await mongoose.connect(env.MONGO_URI, { autoIndex: env.NODE_ENV !== "production" });
  return mongoose.connection;
}
