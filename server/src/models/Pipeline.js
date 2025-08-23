import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const StageSchema = new Schema(
  {
    key:         { type: String, required: true, trim: true, lowercase: true },
    name:        { type: String, required: true, trim: true },
    probability: { type: Number, min: 0, max: 1, default: 0 },
    order:       { type: Number, default: 0 },
  },
  { _id: false }
);

const PipelineSchema = new Schema(
  {
    orgId:     { type: Types.ObjectId, ref: "Org", required: true, index: true },
    stages:    { type: [StageSchema], default: [] },
    updatedBy: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// enforce one pipeline per org
PipelineSchema.index({ orgId: 1 }, { unique: true });

export default model("Pipeline", PipelineSchema);
