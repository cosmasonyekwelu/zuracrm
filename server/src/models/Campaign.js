// server/src/models/Campaign.js
import mongoose from "mongoose";
import { tenantFields, addTenantIndexes } from "./_tenant.js";
const { Schema, model } = mongoose;

export const CAMPAIGN_STATUS = [
  "Draft","Planned","Running","Paused","Completed","Cancelled"
];

const CampaignSchema = new Schema({
  ...tenantFields,

  name:       { type: String, required: true, trim: true },

  // ✅ UI fields (authoritative)
  channel:    { type: String, trim: true },             // Email/Ads/Social/Event...
  status:     { type: String, enum: CAMPAIGN_STATUS, default: "Draft" },
  startDate:  { type: Date },
  endDate:    { type: Date },
  budget:     { type: Number, default: 0 },
  actualCost: { type: Number, default: 0 },
  notes:      { type: String, trim: true },

  // (No storage for legacy fields; we only map them in/out)
}, { timestamps: true });

// ---- Back-compat virtuals (read/write aliases)
CampaignSchema.virtual("type")
  .get(function(){ return this.channel; })
  .set(function(v){ this.channel = v; });

CampaignSchema.virtual("startAt")
  .get(function(){ return this.startDate; })
  .set(function(v){ this.startDate = v; });

CampaignSchema.virtual("endAt")
  .get(function(){ return this.endDate; })
  .set(function(v){ this.endDate = v; });

// Normalize before validation (accept legacy payloads)
CampaignSchema.pre("validate", function(next){
  if (!this.channel && this.get("type"))      this.channel   = this.get("type");
  if (!this.startDate && this.get("startAt")) this.startDate = this.get("startAt");
  if (!this.endDate && this.get("endAt"))     this.endDate   = this.get("endAt");

  // status synonyms
  const s = String(this.status || "").toLowerCase();
  if (s === "active") this.status = "Running";
  if (s === "planning") this.status = "Planned";

  next();
});

addTenantIndexes(CampaignSchema);
CampaignSchema.index({ orgId: 1, status: 1 });

export default model("Campaign", CampaignSchema);
