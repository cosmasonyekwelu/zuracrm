// server/src/models/RolePolicy.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const MODULES = ["Leads","Contacts","Accounts","Deals","Activities","Documents","Campaigns"];
const PERMS = ["no","ro","rw"];

const RolePolicySchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true, unique: true, index: true },
    // { admin:{Leads:'rw',...}, manager:{...}, user:{...}, read_only:{...} }
    permissionsByRole: { type: Object, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default model("RolePolicy", RolePolicySchema);
