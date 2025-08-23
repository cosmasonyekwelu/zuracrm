import mongoose from "mongoose";
const { Schema, model } = mongoose;

/**
 * Per-tenant product.
 * - orgId is required
 * - SKU must be unique within an org (compound index)
 */
const ProductSchema = new Schema(
  {
    orgId:     { type: Schema.Types.ObjectId, ref: "Org", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name:      { type: String, required: true, trim: true },
    sku:       { type: String, required: true, trim: true },
    price:     { type: Number, default: 0, min: 0 },
    cost:      { type: Number, default: 0, min: 0 },
    stock:     { type: Number, default: 0, min: 0 },
    active:    { type: Boolean, default: true },
    imageUrl:  { type: String, default: "" },
    description:{ type: String, default: "" },
  },
  { timestamps: true }
);

// text search (scoped by orgId in queries)
ProductSchema.index({ name: "text", sku: "text", description: "text" });

// per-org unique sku
ProductSchema.index({ orgId: 1, sku: 1 }, { unique: true });

export default model("Product", ProductSchema);
