// src/models/Account.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const AccountSchema = new Schema(
  {
    // 🔐 Multi-tenant scope
    org: { type: Schema.Types.ObjectId, ref: "Org", required: true, index: true },

    // Core fields
    name:     { type: String, required: true, trim: true },
    nameLower:{ type: String, trim: true, index: true }, // for case-insensitive lookups
    industry: { type: String, trim: true },
    phone:    { type: String, trim: true },
    website:  { type: String, trim: true },
    notes:    { type: String, trim: true },

    // Ownership
    owner:    { type: Schema.Types.ObjectId, ref: "User", index: true },
    createdBy:{ type: Schema.Types.ObjectId, ref: "User" },
    updatedBy:{ type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// keep a lowercase copy for uniqueness within org (optional unique)
// If you later want to enforce one account name per org:
// AccountSchema.index({ org: 1, nameLower: 1 }, { unique: true });
AccountSchema.pre("save", function nextSave(next) {
  if (this.isModified("name")) this.nameLower = this.name?.toLowerCase().trim();
  next();
});
AccountSchema.pre("findOneAndUpdate", function nextUpdate(next) {
  const update = this.getUpdate() || {};
  if (update.name) update.nameLower = update.name.toLowerCase().trim();
  next();
});

// Text index for search
AccountSchema.index({
  name: "text",
  industry: "text",
  phone: "text",
  website: "text",
  notes: "text",
});

export default model("Account", AccountSchema);
