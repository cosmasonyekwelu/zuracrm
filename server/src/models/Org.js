// server/src/models/Org.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const OrgSchema = new Schema(
  {
    // Core
    name:     { type: String, required: true, trim: true },
    ownerId:  { type: Schema.Types.ObjectId, ref: "User", index: true },

    // Branding
    logoUrl:  { type: String, trim: true },

    // Domain (store original + normalized copy for lookups)
    domain:      { type: String, trim: true },               // e.g. "acme.com"
    domainLower: { type: String, trim: true, index: true, sparse: true }, // "acme.com" normalized

    // Plan
    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free", index: true },

    // Company preferences (used by /api/company)
    timezone: { type: String, trim: true, default: "Africa/Lagos" },
    locale:   { type: String, trim: true, default: "en-NG" },

    // Misc / future flags
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes (keep it flexible; make domainLower unique if you want one org per domain)
// OrgSchema.index({ domainLower: 1 }, { unique: true, sparse: true });
OrgSchema.index({ name: 1 });
OrgSchema.index({ domain: 1 }, { sparse: true });

// --- Helpers
function normalizeDomain(d = "") {
  return String(d)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "") // drop protocol
    .replace(/\/.*$/, "")        // drop path/query
    .replace(/:.*$/, "")         // drop port
    .replace(/^www\./, "");      // drop leading www.
}

// Keep normalized copy in sync
OrgSchema.pre("save", function nextSave(next) {
  if (this.isModified("domain")) {
    this.domainLower = this.domain ? normalizeDomain(this.domain) : undefined;
  }
  next();
});

OrgSchema.pre("findOneAndUpdate", function nextUpdate(next) {
  const update = this.getUpdate() || {};
  // Support both $set and top-level patch shapes
  const set = update.$set ?? update;

  if (Object.prototype.hasOwnProperty.call(set, "domain")) {
    const dom = set.domain;
    // write normalized to domainLower; allow clearing with empty string/null
    set.domainLower = dom ? normalizeDomain(dom) : undefined;
    if (update.$set) update.$set = set; else this.setUpdate(set);
  }
  next();
});

export default model("Org", OrgSchema);
