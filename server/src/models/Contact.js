// server/src/models/Contact.js
import mongoose from "mongoose";
import { tenantFields, addTenantIndexes } from "./_tenant.js";
const { Schema, model } = mongoose;

const ContactSchema = new Schema({
  ...tenantFields,

  firstName: { type: String, trim: true },
  lastName:  { type: String, trim: true },
  email:     { type: String, trim: true, lowercase: true },
  phone:     { type: String, trim: true },
  title:     { type: String, trim: true },
  accountId: { type: Schema.Types.ObjectId, ref: "Account" },
  address:   { type: String, trim: true },
  notes:     { type: String, trim: true },
}, { timestamps: true });

addTenantIndexes(ContactSchema);
ContactSchema.index({ orgId: 1, lastName: 1, firstName: 1 });
ContactSchema.index({ orgId: 1, email: 1 });

export default model("Contact", ContactSchema);
