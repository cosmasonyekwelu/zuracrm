// server/src/models/_tenant.js
import mongoose from "mongoose";
const { Schema } = mongoose;

export const tenantFields = {
  orgId:     { type: Schema.Types.ObjectId, ref: "Org", required: true }, // no index:true
  // Ownership/assignment
  ownerId:   { type: Schema.Types.ObjectId, ref: "User", required: true }, // no index:true
  assignedTo:[{ type: Schema.Types.ObjectId, ref: "User" }],
  // Sharing model
  visibility:{ type: String, enum: ["private", "shared", "org"], default: "org" },
  sharedWith:[{ type: Schema.Types.ObjectId, ref: "User" }],
  // Audit
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
};

export function addTenantIndexes(schema) {
  // Add only if not already defined on this schema
  const have = schema.indexes().map(([fields]) => JSON.stringify(fields));
  const add = (fields) => {
    const sig = JSON.stringify(fields);
    if (!have.includes(sig)) schema.index(fields);
  };
  add({ orgId: 1 });
  add({ orgId: 1, ownerId: 1, createdAt: -1 });
}
