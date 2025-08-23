// server/src/models/Docs.js
import mongoose from "mongoose";
import { ItemSchema, calcTotals } from "./common.js";
import { tenantFields, addTenantIndexes } from "./_tenant.js";

const { Schema } = mongoose;
const baseOpts = { timestamps: true, discriminatorKey: "docType" };

// Simple safe auto-number if client doesn't send one
function prefixFor(docType) {
  switch (docType) {
    case "Quote": return "Q-";
    case "Invoice": return "INV-";
    case "SalesOrder": return "SO-";
    default: return "DOC-";
  }
}
function defaultNumber(doc) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(2, 12); // YYMMDDHHMM
  const rnd = Math.floor(100 + Math.random() * 900); // 3 digits
  return `${prefixFor(doc.docType)}${stamp}-${rnd}`;
}

const BaseSchema = new Schema(
  {
    // 🔐 multi-tenant & ACL fields
    ...tenantFields,

    // Business fields
    number:   { type: String, required: true, index: true }, // unique per org (see compound index below)
    account:  { type: String, required: true, trim: true },
    date:     { type: Date, default: Date.now },
    status:   { type: String, default: "Open" }, // overridden by discriminators
    items:    { type: [ItemSchema], default: [] },
    taxRate:  { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    tax:      { type: Number, default: 0 },
    total:    { type: Number, default: 0 },
    notes:    { type: String, default: "", trim: true },
  },
  baseOpts
);

// Ensure number is set, scoped-unique per org
BaseSchema.pre("validate", function (next) {
  if (!this.number) this.number = defaultNumber(this);
  next();
});

// Recalculate totals on save
BaseSchema.pre("save", function (next) {
  const { subtotal, tax, total } = calcTotals(this.items, this.taxRate);
  this.subtotal = subtotal; this.tax = tax; this.total = total;
  next();
});

// 🔎 Useful indexes
addTenantIndexes(BaseSchema);
BaseSchema.index({ orgId: 1, number: 1 }, { unique: true }); // scoped uniqueness
BaseSchema.index({ orgId: 1, status: 1, date: -1 });
BaseSchema.index({ orgId: 1, account: 1 });
BaseSchema.index({ orgId: 1, ownerId: 1, createdAt: -1 });
BaseSchema.index({ orgId: 1, docType: 1, createdAt: -1 });

export const BaseDoc =
  mongoose.models.Doc || mongoose.model("Doc", BaseSchema);

// Discriminators – inherit tenant fields & hooks
const QuoteSchema = new Schema({
  status: { type: String, enum: ["Draft","Sent","Accepted","Declined"], default: "Draft" },
});
const InvoiceSchema = new Schema({
  status: { type: String, enum: ["Open","Paid","Cancelled"], default: "Open" },
});
const SalesOrderSchema = new Schema({
  status: { type: String, enum: ["Open","Fulfilled","Cancelled"], default: "Open" },
});

export const Quote =
  mongoose.models.Quote || BaseDoc.discriminator("Quote", QuoteSchema);
export const Invoice =
  mongoose.models.Invoice || BaseDoc.discriminator("Invoice", InvoiceSchema);
export const SalesOrder =
  mongoose.models.SalesOrder || BaseDoc.discriminator("SalesOrder", SalesOrderSchema);
