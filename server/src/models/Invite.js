// server/src/models/Invite.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const InviteSchema = new Schema(
  {
    orgId:     { type: Schema.Types.ObjectId, ref: "Org", required: true, index: true },
    email:     { type: String, required: true, lowercase: true, trim: true, index: true },
    role:      { type: String, enum: ["admin", "manager", "user"], default: "user" },
    profile:   { type: String, default: "Standard" },
    token:     { type: String, required: true, unique: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status:    { type: String, enum: ["pending", "accepted", "revoked"], default: "pending", index: true },
    acceptedAt:{ type: Date },
    acceptedBy:{ type: Schema.Types.ObjectId, ref: "User" },

    // Optional TTL expiration (documents auto-removed after this date)
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

export default model("Invite", InviteSchema);
