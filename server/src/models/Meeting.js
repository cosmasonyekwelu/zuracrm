import mongoose from "mongoose";
const { Schema, model } = mongoose;

const AttendeeSchema = new Schema({
  name:  { type: String, trim: true },
  email: { type: String, trim: true },
  userId:{ type: Schema.Types.ObjectId, ref: "User" },
  response: { type: String, enum: ["accepted","declined","tentative","needsAction"], default: "needsAction" }
}, { _id: false });

const MeetingSchema = new Schema({
  // tenant + ownership
  orgId:   { type: Schema.Types.ObjectId, ref: "Org",  required: true, index: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  createdBy:{ type: Schema.Types.ObjectId, ref: "User" },
  updatedBy:{ type: Schema.Types.ObjectId, ref: "User" },

  // v2 canonical
  title:           { type: String, required: true, trim: true },
  when:            { type: Date, required: true },
  durationMinutes: { type: Number, default: 30, min: 0 },
  with:            { type: String, trim: true },
  location:        { type: String, trim: true },
  status:          { type: String, enum: ["Scheduled","Completed","Cancelled"], default: "Scheduled" },
  notes:           { type: String, trim: true },

  // v1 compatibility (optional)
  subject:         { type: String, trim: true },
  startAt:         { type: Date },
  endAt:           { type: Date },
  attendees:       [AttendeeSchema],
}, { timestamps: true });

// v1→v2 mapping
MeetingSchema.pre("validate", function(next){
  if (this.owner && !this.ownerId) this.ownerId = this.owner;

  if (!this.when && (this.startAt || this.endAt)) {
    if (this.startAt) this.when = this.startAt;
    if (!this.durationMinutes && this.startAt && this.endAt) {
      this.durationMinutes = Math.max(0, Math.round((new Date(this.endAt) - new Date(this.startAt))/60000));
    }
  }
  if (!this.title && this.subject) this.title = this.subject;
  next();
});

MeetingSchema.index({ orgId: 1, ownerId: 1, when: 1 });

MeetingSchema.method("toPublic", function(){
  const start = this.when || this.startAt;
  const end = this.durationMinutes != null
    ? new Date(new Date(start).getTime() + this.durationMinutes * 60000)
    : (this.endAt || null);

  return {
    _id: this._id,
    title: this.title || this.subject || "",
    when: start,
    durationMinutes: this.durationMinutes != null
      ? this.durationMinutes
      : (start && end ? Math.max(0, Math.round((end - start)/60000)) : 30),
    with: this.with || (Array.isArray(this.attendees)
      ? this.attendees.map(a => a?.name || a?.email).filter(Boolean).join(", ")
      : ""),
    location: this.location || "",
    status: this.status || "Scheduled",
    notes: this.notes || "",
  };
});

export default model("Meeting", MeetingSchema);
