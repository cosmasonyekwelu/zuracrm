// server/src/models/SecurityPolicy.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const SecurityPolicySchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true, unique: true, index: true },

    requireMfa: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 60, min: 10, max: 1440 },  // minutes
    passwordMin: { type: Number, default: 8, min: 6, max: 128 },
    passwordRotationDays: { type: Number, default: 90, min: 0, max: 3650 },

    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default model("SecurityPolicy", SecurityPolicySchema);
