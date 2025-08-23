import mongoose from "mongoose";
import { tenantFields, addTenantIndexes } from "./_tenant.js";

const { Schema } = mongoose;

const LeadSchema = new Schema(
  {
    ...tenantFields, // fields only; indexes come from addTenantIndexes()
    // core
    name: { type: String, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    source: { type: String, enum: ["Web", "Referral", "Event", "Ads", "Email"], default: "Web" },
    status: { type: String, enum: ["New", "Contacted", "Qualified", "Unqualified"], default: "New" },
  },
  { timestamps: true }
);

// derive name if missing
LeadSchema.pre("validate", function (next) {
  if (!this.name || !this.name.trim()) {
    const parts = [this.firstName, this.lastName].filter(Boolean);
    if (parts.length) this.name = parts.join(" ");
  }
  next();
});

// tenant indexes (single source of truth)
addTenantIndexes(LeadSchema);

// ⚠️ Do NOT also call LeadSchema.index({ orgId: 1 }) etc. here.
export default mongoose.model("Lead", LeadSchema);
