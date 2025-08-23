// server/src/controllers/stats.controller.js
import Lead from "../models/Lead.js";
import Deal from "../models/Deal.js";
import Task from "../models/Task.js";
import Meeting from "../models/Meeting.js";
import Call from "../models/Call.js";

// ---------- time helpers (UTC) ----------
const MS_DAY = 24 * 60 * 60 * 1000;

const startOfDayUTC = (d = new Date()) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const endOfDayUTC = (d = new Date()) => new Date(startOfDayUTC(d).getTime() + MS_DAY);

const startOfWeekUTC = (d = new Date()) => {
  // week starts Sunday; change offset if you prefer Monday
  const s = startOfDayUTC(d);
  const dow = s.getUTCDay(); // 0..6
  s.setUTCDate(s.getUTCDate() - dow);
  return s;
};

const endOfWeekUTC = (d = new Date()) => new Date(startOfWeekUTC(d).getTime() + 7 * MS_DAY);

// ---------- utils ----------
function scopeFilter(req) {
  // base org scope; allow ?scope=mine to narrow by ownerId
  const { orgId, id: userId } = req.user || {};
  const mine = String(req.query.scope || "").toLowerCase() === "mine";
  return mine ? { orgId, ownerId: userId } : { orgId };
}

async function countSafe(Model, filter) {
  // be resilient if fields differ across environments
  try {
    return await Model.countDocuments(filter).exec();
  } catch {
    return await Model.countDocuments({}).exec();
  }
}

// ---------- leaf endpoints kept for compatibility ----------

// Leads: { total, today }
export async function leadStats(req, res) {
  const base = scopeFilter(req);
  const todayS = startOfDayUTC();
  const todayE = endOfDayUTC();

  const [total, today] = await Promise.all([
    countSafe(Lead, base),
    countSafe(Lead, { ...base, createdAt: { $gte: todayS, $lt: todayE } }),
  ]);

  return res.json({ total, today });
}

// Deals: { open, thisWeek }
export async function dealStats(req, res) {
  const base = scopeFilter(req);
  const weekS = startOfWeekUTC();
  const weekE = endOfWeekUTC();

  // Treat anything with status/stage NOT containing "closed" as open.
  const openQuery = {
    ...base,
    $and: [
      { $or: [{ status: { $exists: false } }, { status: { $not: /closed/i } }] },
      { $or: [{ stage: { $exists: false } }, { stage: { $not: /closed/i } }] },
    ],
  };

  const [open, thisWeek] = await Promise.all([
    countSafe(Deal, openQuery),
    countSafe(Deal, { ...base, createdAt: { $gte: weekS, $lt: weekE } }),
  ]);

  return res.json({ open, thisWeek });
}

// Activities: { total, dueToday }
export async function activityStats(req, res) {
  const base = scopeFilter(req);
  const todayS = startOfDayUTC();
  const todayE = endOfDayUTC();

  // totals
  const [tasks, meetings, calls] = await Promise.all([
    countSafe(Task, base),
    countSafe(Meeting, base),
    countSafe(Call, base),
  ]);

  // due/occurring today across common date fields
  const orToday = [
    { dueDate: { $gte: todayS, $lt: todayE } }, // Tasks
    { when: { $gte: todayS, $lt: todayE } },    // Meetings
    { date: { $gte: todayS, $lt: todayE } },    // Calls
    { start: { $gte: todayS, $lt: todayE } },   // fallback
  ];

  const [tasksDue, meetingsToday, callsToday] = await Promise.all([
    countSafe(Task, { ...base, dueDate: { $gte: todayS, $lt: todayE }, status: { $ne: "Completed" } }),
    countSafe(Meeting, { ...base, when: { $gte: todayS, $lt: todayE } }),
    countSafe(Call, { ...base, date: { $gte: todayS, $lt: todayE } }),
  ]).catch(async () => {
    // ultra-safe fallback if specific fields fail on some envs
    return [
      await countSafe(Task, { ...base, $or: orToday }),
      await countSafe(Meeting, { ...base, $or: orToday }),
      await countSafe(Call, { ...base, $or: orToday }),
    ];
  });

  return res.json({
    total: (tasks || 0) + (meetings || 0) + (calls || 0),
    dueToday: (tasksDue || 0) + (meetingsToday || 0) + (callsToday || 0),
  });
}

// ---------- combined stats for /stats* endpoints ----------

async function computeAll(req) {
  const base = scopeFilter(req);
  const now = new Date();
  const dayS = startOfDayUTC(now);
  const dayE = endOfDayUTC(now);
  const weekS = startOfWeekUTC(now);
  const weekE = endOfWeekUTC(now);

  const [
    leadsTotal,
    leadsToday,
    dealsOpen,
    dealsThisWeek,
    tasksTotal,
    meetingsTotal,
    callsTotal,
    tasksDue,
    meetingsToday,
    callsToday,
  ] = await Promise.all([
    countSafe(Lead, base),
    countSafe(Lead, { ...base, createdAt: { $gte: dayS, $lt: dayE } }),
    countSafe(Deal, {
      ...base,
      $and: [
        { $or: [{ status: { $exists: false } }, { status: { $not: /closed/i } }] },
        { $or: [{ stage: { $exists: false } }, { stage: { $not: /closed/i } }] },
      ],
    }),
    countSafe(Deal, { ...base, createdAt: { $gte: weekS, $lt: weekE } }),
    countSafe(Task, base),
    countSafe(Meeting, base),
    countSafe(Call, base),
    countSafe(Task, { ...base, dueDate: { $gte: dayS, $lt: dayE }, status: { $ne: "Completed" } }),
    countSafe(Meeting, { ...base, when: { $gte: dayS, $lt: dayE } }),
    countSafe(Call, { ...base, date: { $gte: dayS, $lt: dayE } }),
  ]);

  const activitiesTotal = tasksTotal + meetingsTotal + callsTotal;
  const activitiesDueToday = tasksDue + meetingsToday + callsToday;

  return {
    nested: {
      leads: { total: leadsTotal, today: leadsToday },
      deals: { open: dealsOpen, week: dealsThisWeek },
      activities: { total: activitiesTotal, dueToday: activitiesDueToday },
    },
    flat: {
      leadsTotal,
      leadsToday,
      dealsOpen,
      dealsThisWeek,
      activitiesTotal,
      activitiesDueToday,
    },
  };
}

// GET /stats/home
export async function home(req, res) {
  const { nested } = await computeAll(req);
  res.json(nested);
}

// GET /stats/summary
export async function summary(req, res) {
  const { nested } = await computeAll(req);
  res.json(nested);
}

// GET /stats
export async function index(req, res) {
  const { flat } = await computeAll(req);
  res.json(flat);
}
