import Meeting from "../models/Meeting.js";
import { ApiError } from "../utils/http.js";

/* ---------------- helpers ---------------- */

const minutesBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000));

function normalizeIn(body = {}) {
  // v2 (when + durationMinutes)
  if (body.when || body.durationMinutes != null) {
    const when = body.when ? new Date(body.when) : undefined;
    const dur = body.durationMinutes != null ? Number(body.durationMinutes) : 30;
    return {
      title: String(body.title || "").trim(),
      when,
      durationMinutes: Number.isFinite(dur) ? dur : 30,
      with: String(body.with || "").trim(),
      location: String(body.location || "").trim(),
      status: body.status || "Scheduled",
      notes: String(body.notes || "").trim(),
      attendees: Array.isArray(body.attendees) ? body.attendees : [],
    };
  }
  // v1 (start/end or startAt/endAt)
  if (body.start || body.startAt || body.end || body.endAt) {
    const start = new Date(body.start || body.startAt);
    const end = body.end || body.endAt ? new Date(body.end || body.endAt) : null;
    const dur = end ? minutesBetween(start, end) : 30;
    return {
      title: String(body.title || body.subject || "").trim(),
      when: start,
      durationMinutes: dur,
      with: String(body.with || "").trim(),
      location: String(body.location || "").trim(),
      status: body.status || "Scheduled",
      notes: String(body.notes || "").trim(),
      attendees: Array.isArray(body.attendees) ? body.attendees : [],
    };
  }
  // minimal
  return {
    title: String(body.title || "").trim(),
    when: body.when ? new Date(body.when) : undefined,
    durationMinutes:
      body.durationMinutes != null && Number.isFinite(Number(body.durationMinutes))
        ? Number(body.durationMinutes)
        : 30,
    with: String(body.with || "").trim(),
    location: String(body.location || "").trim(),
    status: body.status || "Scheduled",
    notes: String(body.notes || "").trim(),
    attendees: Array.isArray(body.attendees) ? body.attendees : [],
  };
}

function toPublic(m) {
  const start = m.when || m.startAt;
  const dur =
    m.durationMinutes != null
      ? m.durationMinutes
      : m.endAt && start
      ? minutesBetween(start, m.endAt)
      : 30;

  const withStr =
    m.with ||
    (Array.isArray(m.attendees)
      ? m.attendees.map(a => a?.name || a?.email).filter(Boolean).join(", ")
      : "");

  return {
    _id: m._id,
    title: m.title || m.subject || "",
    when: start,
    durationMinutes: dur,
    with: withStr || "",
    location: m.location || "",
    status: m.status || "Scheduled",
    notes: m.notes || "",
  };
}

function toICS(doc) {
  const start = doc.when || doc.startAt;
  const end =
    doc.durationMinutes != null
      ? new Date(new Date(start).getTime() + doc.durationMinutes * 60000)
      : doc.endAt || new Date(new Date(start).getTime() + 30 * 60000);

  const pad = n => String(n).padStart(2, "0");
  const icsDate = d =>
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z";
  const esc = s => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zura CRM//Meetings//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${doc._id}@zura`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(new Date(start))}`,
    `DTEND:${icsDate(new Date(end))}`,
    `SUMMARY:${esc(doc.title || "Meeting")}`,
    doc.location ? `LOCATION:${esc(doc.location)}` : "",
    doc.notes ? `DESCRIPTION:${esc(doc.notes)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function bubbleValidation(err) {
  if (err?.name === "ValidationError") {
    const issues = Object.fromEntries(
      Object.entries(err.errors || {}).map(([k, v]) => [k, v?.message || "Invalid"])
    );
    throw new ApiError(400, "Validation failed", { issues });
  }
  throw err;
}

/* ---------------- CRUD ---------------- */

export async function list(req, res) {
  const { search = "" } = req.query;
  const q = { orgId: req.user.orgId };
  if (search) {
    q.$or = [
      { title: { $regex: search, $options: "i" } },
      { with: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { notes: { $regex: search, $options: "i" } },
    ];
  }
  const docs = await Meeting.find(q).sort({ when: 1 }).lean();
  res.json(docs.map(toPublic));
}

export async function create(req, res) {
  const payload = normalizeIn(req.body);

  if (!payload.title) throw new ApiError(400, "Title is required.");
  if (!payload.when || isNaN(new Date(payload.when))) throw new ApiError(400, "Valid start time is required.");

  const doc = new Meeting({
    ...payload,
    orgId: req.user.orgId,
    ownerId: req.user.id,   // tenant required
    owner: req.user.id,     // legacy alias compatibility
    createdBy: req.user.id,
    updatedBy: req.user.id,
  });

  try {
    await doc.validate();
    await doc.save();
  } catch (e) {
    bubbleValidation(e);
  }

  res.status(201).json(toPublic(doc));
}

export async function update(req, res) {
  const { id } = req.params;
  const payload = normalizeIn(req.body);

  const doc = await Meeting.findOne({ _id: id, orgId: req.user.orgId });
  if (!doc) throw new ApiError(404, "Meeting not found");

  Object.assign(doc, payload, { updatedBy: req.user.id });

  try {
    await doc.validate();
    await doc.save();
  } catch (e) {
    bubbleValidation(e);
  }

  res.json(toPublic(doc));
}

export async function remove(req, res) {
  const { id } = req.params;
  const r = await Meeting.deleteOne({ _id: id, orgId: req.user.orgId });
  if (!r.deletedCount) throw new ApiError(404, "Meeting not found");
  res.json({ ok: true });
}

/* ---------------- Extras ---------------- */

export async function ics(req, res) {
  const { id } = req.params;
  const doc = await Meeting.findOne({ _id: id, orgId: req.user.orgId });
  if (!doc) throw new ApiError(404, "Meeting not found");

  const ics = toICS(doc);
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="meeting-${doc._id}.ics"`);
  res.send(ics);
}

// POST /api/meetings/:id/rsvp { response, email?, userId? }
export async function rsvp(req, res) {
  const { id } = req.params;
  const { response, email, userId } = req.body || {};
  const allowed = ["accepted", "declined", "tentative", "needsAction"];
  if (!allowed.includes(response)) throw new ApiError(400, "Invalid response");

  const doc = await Meeting.findOne({ _id: id, orgId: req.user.orgId });
  if (!doc) throw new ApiError(404, "Meeting not found");

  const match = a =>
    (userId && String(a.userId) === String(userId)) ||
    (email && a.email && a.email.toLowerCase() === String(email).toLowerCase());

  let found = false;
  doc.attendees = (doc.attendees || []).map(a => {
    if (match(a)) { found = true; return { ...a, response }; }
    return a;
  });
  if (!found) {
    doc.attendees = doc.attendees || [];
    doc.attendees.push({
      userId: userId || undefined,
      email: email || undefined,
      response,
    });
  }
  doc.updatedBy = req.user.id;
  await doc.save();

  res.json(toPublic(doc));
}

// POST /api/meetings/:id/forward { email, name?, userId? }
export async function forward(req, res) {
  const { id } = req.params;
  const { email, name, userId } = req.body || {};
  if (!email && !userId) throw new ApiError(400, "email or userId is required");

  const doc = await Meeting.findOne({ _id: id, orgId: req.user.orgId });
  if (!doc) throw new ApiError(404, "Meeting not found");

  const exists = (doc.attendees || []).some(a =>
    (userId && String(a.userId) === String(userId)) ||
    (email && a.email && a.email.toLowerCase() === String(email).toLowerCase())
  );
  if (!exists) {
    doc.attendees = doc.attendees || [];
    doc.attendees.push({
      userId: userId || undefined,
      email: email || undefined,
      name: name || undefined,
      response: "needsAction",
    });
    doc.updatedBy = req.user.id;
    await doc.save();
  }

  res.json(toPublic(doc));
}
