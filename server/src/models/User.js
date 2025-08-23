// /src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Org", required: true, index: true },

    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true, sparse: true, unique: true },
    username: { type: String, lowercase: true, trim: true, index: true, sparse: true, unique: true },
    phone: { type: String, trim: true, index: true, sparse: true, unique: true },

    role: { type: String, enum: ["admin", "manager", "user", "read_only"], default: "user", index: true },
    profile: { type: String, default: "Standard" },

    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    avatar: String,

    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

// Methods
UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

const User = mongoose.model("User", UserSchema);
export default User;
