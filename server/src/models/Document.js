import mongoose from "mongoose";
import { tenantFields, addTenantIndexes } from "./_tenant.js";
const { Schema } = mongoose;

const DocumentSchema = new Schema(
  {
    ...tenantFields,
    title: { type: String, trim: true },
    filename: { type: String, required: true },
    mime: { type: String, trim: true },
    size: { type: Number, default: 0 },
    ext:  { type: String, trim: true },
    path: { type: String, trim: true }, // e.g., /uploads/<filename>
  },
  { timestamps: true }
);

addTenantIndexes(DocumentSchema);
export default mongoose.model("Document", DocumentSchema);
