import mongoose from "mongoose";
const { Schema, model } = mongoose;

export const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const CalendarSettingsSchema = new Schema({
  orgId:   { type: Schema.Types.ObjectId, ref: "Org", required: true, index: true },
  userId:  { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

  // public booking URL piece
  slug:    { type: String, required: true, index: true, unique: true },

  // availability
  days:    { type: [String], enum: DAYS, default: ["Mon","Tue","Wed","Thu","Fri"] },
  start:   { type: String, default: "09:00" }, // HH:MM (24h)
  end:     { type: String, default: "17:00" }, // HH:MM (24h)
  duration:{ type: Number, default: 30, min: 5, max: 240 },

  // audit (optional)
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// ensure one settings doc per user/org
CalendarSettingsSchema.index({ orgId: 1, userId: 1 }, { unique: true });

export default model("CalendarSettings", CalendarSettingsSchema);
