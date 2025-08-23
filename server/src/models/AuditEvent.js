// server/src/models/AuditEvent.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const AuditEventSchema = new Schema(
  {
    orgId:   { type: Schema.Types.ObjectId, ref: "Org", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actor:   { type: String, trim: true },           // cached display: "Ada Lovelace <ada@zura.com>"
    action:  { type: String, required: true, trim: true, index: true }, // e.g., "user.updated", "deal.moved"
    target:  { type: String, trim: true, index: true },                 // e.g., "User:64fd... / ada@zura.com"
    meta:    { type: Object, default: {} },          // arbitrary JSON
    ip:      { type: String, trim: true },
    ua:      { type: String, trim: true },
  },
  { timestamps: true }
);

// helpful compound index for common queries
AuditEventSchema.index({ orgId: 1, createdAt: -1 });
AuditEventSchema.index({ orgId: 1, action: 1, createdAt: -1 });

export default model("AuditEvent", AuditEventSchema);
