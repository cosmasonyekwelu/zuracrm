import CalendarSettings from "../models/CalendarSettings.js";
import Meeting from "../models/Meeting.js";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const isHHMM = (s="") => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const normalizeSlug = (raw="") =>
  String(raw).trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9\-]/g,"").slice(0,48);

const toMinutes = (hm="09:00") => {
  const [h,m] = String(hm).split(":").map(Number);
  return (isFinite(h)?h:9)*60 + (isFinite(m)?m:0);
};
const dayName = (d) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(d).getDay()];

async function getOrDefault(orgId, userId){
  let doc = await CalendarSettings.findOne({ orgId, userId }).lean();
  if (!doc) {
    return { orgId, userId, slug: "meet", days: ["Mon","Tue","Wed","Thu","Fri"], start: "09:00", end: "17:00", duration: 30 };
  }
  return { orgId, userId, slug: doc.slug, days: doc.days, start: doc.start, end: doc.end, duration: doc.duration };
}

/* -------------------- Private (auth) -------------------- */

export async function getSettings(req, res) {
  const { orgId, id: userId } = req.user;
  const s = await getOrDefault(orgId, userId);
  return res.json({ slug: s.slug, days: s.days, start: s.start, end: s.end, duration: s.duration });
}

export async function patchSettings(req, res) {
  const { orgId, id: userId } = req.user;

  const slug = normalizeSlug(req.body.slug);
  const days = Array.isArray(req.body.days) ? req.body.days.filter(d => DAYS.includes(d)) : undefined;
  const start = req.body.start;
  const end = req.body.end;
  const duration = Number(req.body.duration);

  // validations
  if (!slug) return res.status(400).json({ error: "Slug is required (letters, numbers, hyphens)" });
  if (!days || days.length === 0) return res.status(400).json({ error: "Pick at least one day" });
  if (!isHHMM(start) || !isHHMM(end)) return res.status(400).json({ error: "Times must be HH:MM (24h)" });

  const startM = toMinutes(start), endM = toMinutes(end);
  if (startM >= endM) return res.status(400).json({ error: "End time must be after start time" });

  const dur = Math.max(5, Math.min(240, Number.isFinite(duration) ? duration : 30));

  // unique slug across system (simple global)
  const existing = await CalendarSettings.findOne({ slug }).lean();
  if (existing && String(existing.userId) !== String(userId)) {
    return res.status(409).json({ error: "Slug already in use" });
  }

  const doc = await CalendarSettings.findOneAndUpdate(
    { orgId, userId },
    { $set: { slug, days, start, end, duration: dur, updatedBy: userId }, $setOnInsert: { createdBy: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return res.json({ slug: doc.slug, days: doc.days, start: doc.start, end: doc.end, duration: doc.duration });
}

export async function slots(req, res){
  const { orgId, id: userId } = req.user;
  const { date } = req.query; // YYYY-MM-DD
  if (!date) return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });

  const s = await getOrDefault(orgId, userId);
  if (!s.days.includes(dayName(date))) return res.json({ date, slots: [] });

  const startM = toMinutes(s.start), endM = toMinutes(s.end);
  const dayStart = new Date(date + "T00:00:00");
  const start = new Date(dayStart); start.setMinutes(start.getMinutes() + startM);
  const end   = new Date(dayStart); end.setMinutes(end.getMinutes() + endM);

  // Busy windows from existing meetings
  const meetings = await Meeting.find({
    orgId, ownerId: userId,
    when: { $gte: start, $lt: end }
  }).lean();

  const busy = meetings.map(m => {
    const from = new Date(m.when);
    const to   = new Date(from.getTime() + Number(m.durationMinutes || s.duration || 30) * 60000);
    return [from, to];
  });

  const slots = [];
  for (let t = new Date(start); t < end; t = new Date(t.getTime() + (s.duration * 60000))) {
    const slotEnd = new Date(t.getTime() + (s.duration * 60000));
    const clash = busy.some(([b0,b1]) => !(slotEnd <= b0 || t >= b1));
    if (!clash && slotEnd <= end) slots.push(new Date(t).toISOString());
  }

  res.json({ date, slots });
}

export async function book(req, res){
  const { orgId, id: userId } = req.user;
  const { when, duration, with: withStr = "", title = "Meeting", location = "", notes = "" } = req.body || {};
  if (!when) return res.status(400).json({ error: "when is required (ISO string)" });

  const s = await getOrDefault(orgId, userId);
  const dur = Number.isFinite(Number(duration)) ? Number(duration) : s.duration;

  const start = new Date(when);
  const end = new Date(start.getTime() + dur * 60000);

  // conflict
  const overlap = await Meeting.findOne({
    orgId, ownerId: userId,
    when: { $lt: end, $gte: new Date(start.getTime() - 1) }
  }).lean();
  if (overlap) return res.status(409).json({ error: "Selected time is no longer available." });

  const doc = await Meeting.create({
    orgId, ownerId: userId, createdBy: userId, updatedBy: userId,
    title, when: start, durationMinutes: dur, with: withStr, location, status: "Scheduled", notes
  });

  res.status(201).json(doc.toPublic());
}

/* -------------------- Public (no auth) -------------------- */

export async function getPublicBySlug(req, res) {
  const { slug: raw } = req.params;
  const slug = normalizeSlug(raw);
  const doc = await CalendarSettings.findOne({ slug }).lean();
  if (!doc) return res.status(404).json({ error: "Not found" });
  return res.json({ slug: doc.slug, days: doc.days, start: doc.start, end: doc.end, duration: doc.duration });
}

export async function publicSlots(req, res){
  const { slug: raw } = req.params;
  const { date } = req.query;
  const slug = normalizeSlug(raw);
  if (!date) return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });

  const s = await CalendarSettings.findOne({ slug }).lean();
  if (!s) return res.status(404).json({ error: "Not found" });
  if (!s.days.includes(dayName(date))) return res.json({ date, slots: [] });

  const startM = toMinutes(s.start), endM = toMinutes(s.end);
  const dayStart = new Date(date + "T00:00:00");
  const start = new Date(dayStart); start.setMinutes(start.getMinutes() + startM);
  const end   = new Date(dayStart); end.setMinutes(end.getMinutes() + endM);

  const meetings = await Meeting.find({
    orgId: s.orgId, ownerId: s.userId,
    when: { $gte: start, $lt: end }
  }).lean();

  const busy = meetings.map(m => {
    const from = new Date(m.when);
    const to   = new Date(from.getTime() + Number(m.durationMinutes || s.duration || 30) * 60000);
    return [from, to];
  });

  const slots = [];
  for (let t = new Date(start); t < end; t = new Date(t.getTime() + (s.duration * 60000))) {
    const slotEnd = new Date(t.getTime() + (s.duration * 60000));
    const clash = busy.some(([b0,b1]) => !(slotEnd <= b0 || t >= b1));
    if (!clash && slotEnd <= end) slots.push(new Date(t).toISOString());
  }

  res.json({ date, slots });
}

export async function publicBook(req, res){
  const { slug: raw } = req.params;
  const slug = normalizeSlug(raw);
  const { when, withName = "", email = "", title = "Meeting", notes = "", location = "" } = req.body || {};
  if (!when) return res.status(400).json({ error: "when is required (ISO string)" });

  const s = await CalendarSettings.findOne({ slug }).lean();
  if (!s) return res.status(404).json({ error: "Not found" });

  const start = new Date(when);
  const dur = s.duration || 30;
  const end = new Date(start.getTime() + dur * 60000);

  const overlap = await Meeting.findOne({
    orgId: s.orgId, ownerId: s.userId,
    when: { $lt: end, $gte: new Date(start.getTime() - 1) }
  }).lean();
  if (overlap) return res.status(409).json({ error: "Selected time is no longer available." });

  const attendees = [];
  const withStr = withName || email ? [withName, email].filter(Boolean).join(" ") : "";

  const doc = await Meeting.create({
    orgId: s.orgId, ownerId: s.userId, createdBy: s.userId, updatedBy: s.userId,
    title, when: start, durationMinutes: dur, with: withStr, location, status: "Scheduled", notes,
    attendees: email ? [{ name: withName || undefined, email }] : []
  });

  res.status(201).json(doc.toPublic());
}
