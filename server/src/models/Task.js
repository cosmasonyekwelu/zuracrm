// server/src/models/Task.js
import mongoose from "mongoose";
import { tenantFields, addTenantIndexes } from "./_tenant.js";

const { Schema, model } = mongoose;

export const TASK_STATUS = ["Open", "In Progress", "Completed"];
export const TASK_PRIORITY = ["Low", "Normal", "High"];

const TaskSchema = new Schema(
  {
    ...tenantFields, // orgId, ownerId, createdBy, updatedBy, etc.

    title:    { type: String, required: true, trim: true },
    // keep "with" as requested (person/company the task is with)
    with:     { type: String, trim: true },
    status:   { type: String, enum: TASK_STATUS, default: "Open", index: true },
    priority: { type: String, enum: TASK_PRIORITY, default: "Normal", index: true },
    dueDate:  { type: Date, index: true },
    notes:    { type: String, trim: true },
  },
  { timestamps: true }
);

// Back-compat: accept legacy "subject"
TaskSchema.virtual("subject")
  .get(function () { return this.title; })
  .set(function (v) { this.title = v; });

// Accept synonyms before validation
TaskSchema.pre("validate", function (next) {
  // subject -> title
  if (!this.title && this.get("subject")) this.title = this.get("subject");

  // normalize status
  const s = String(this.status || "").toLowerCase();
  if (s === "done" || s === "completed") this.status = "Completed";
  else if (s === "in-progress" || s === "progress") this.status = "In Progress";
  else if (!this.status) this.status = "Open";

  // normalize priority
  const p = String(this.priority || "").toLowerCase();
  if (p === "high") this.priority = "High";
  else if (p === "low") this.priority = "Low";
  else if (!this.priority) this.priority = "Normal";

  next();
});

addTenantIndexes(TaskSchema);
TaskSchema.index({ orgId: 1, status: 1, dueDate: 1 });
TaskSchema.index({ orgId: 1, priority: 1 });

export default model("Task", TaskSchema);
