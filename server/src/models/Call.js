// server/src/models/Call.js
import mongoose from "mongoose";
import { tenantFields, addTenantIndexes } from "./_tenant.js";
const { Schema, model } = mongoose;

const CallSchema = new Schema({
  ...tenantFields,

  subject:   { type: String, trim: true },
  callDate:  { type: Date, default: Date.now },
  duration:  { type: Number, default: 0 }, // seconds
  outcome:   { type: String, trim: true }, // e.g. Connected/Left VM/No answer
  relatedTo: { type: Schema.Types.ObjectId, refPath: "relatedModel" },
  relatedModel: { type: String, enum: ["Lead","Contact","Deal","Account"], default: "Contact" },
  notes:     { type: String, trim: true },
}, { timestamps: true });

addTenantIndexes(CallSchema);
CallSchema.index({ orgId: 1, callDate: -1 });

export default model("Call", CallSchema);
