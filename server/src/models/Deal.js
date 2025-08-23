import mongoose from "mongoose";
import { tenantFields, addTenantIndexes } from "./_tenant.js";

const { Schema } = mongoose;

const STAGES = ["Qualification", "Needs Analysis", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

const DealSchema = new Schema(
  {
    ...tenantFields, // orgId, ownerId, etc. (no index:true here)

    name: { type: String, trim: true, required: true },
    stage: { type: String, enum: STAGES, default: "Qualification" },

    amount: { type: Number, default: 0, min: 0 },
    probability: { type: Number, min: 0, max: 1 },

    // allow either ref or denormalized
    accountId: { type: Schema.Types.ObjectId, ref: "Account" },
    account: { type: String, trim: true },

    closeDate: { type: Date },
  },
  { timestamps: true }
);

// derive safety defaults
DealSchema.pre("validate", function (next) {
  if (!this.name || !this.name.trim()) this.name = "Untitled Deal";
  if (!this.stage || !STAGES.includes(this.stage)) this.stage = "Qualification";
  if (this.amount == null || Number.isNaN(this.amount)) this.amount = 0;

  // default probability if not set
  if (this.probability == null) {
    const map = {
      Qualification: 0.2,
      "Needs Analysis": 0.35,
      Proposal: 0.55,
      Negotiation: 0.75,
      "Closed Won": 1,
      "Closed Lost": 0,
    };
    this.probability = map[this.stage] ?? 0.3;
  }
  next();
});

addTenantIndexes(DealSchema);
export default mongoose.model("Deal", DealSchema);
