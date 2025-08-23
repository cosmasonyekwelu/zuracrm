// server/src/seed.js
/**
 * Powerful seed script to populate (almost) everything:
 * Org, Users, Products, Accounts, Contacts, Leads, Deals, Tasks, Meetings,
 * Calls, Campaigns, CalendarSettings.  (Intentionally skips Documents)
 *
 * Usage:
 *   node src/seed.js
 *   node src/seed.js --purge
 *   node src/seed.js --org="Zura Demo Org"
 *   node src/seed.js --accounts=20 --contacts=80 --leads=80 --deals=40 --tasks=50 --meetings=24 --calls=36 --campaigns=12 --products=20
 *
 * Notes:
 * - Idempotent where reasonable (upserts base records like org, users, products by sku).
 * - Respects multi-tenancy: sets orgId, ownerId, createdBy, updatedBy, visibility.
 * - Includes both legacy and new-friendly fields where models may differ (e.g., Meetings, Campaigns).
 * - Generates past and future records to exercise stats, filters, and date logic.
 */

import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { logger } from "./utils/logger.js";

// Models
import Org from "./models/Org.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
import Account from "./models/Account.js";
import Contact from "./models/Contact.js";
import Lead from "./models/Lead.js";
import Deal from "./models/Deal.js";
import Task from "./models/Task.js";
import Meeting from "./models/Meeting.js";
import Call from "./models/Call.js";
import Campaign from "./models/Campaign.js";
import CalendarSettings from "./models/CalendarSettings.js";

// ---------------------- CLI args ----------------------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const ORG_NAME = args.org || "Zura Demo Org";
const VIS_DEFAULT = "org"; // or "private"

// ---------------------- helpers ----------------------
const nowPlusDays = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const nowMinusDays = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const naira = (min, max) => rand(min, max);

const slug = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const phoneNG = () => {
  const prefixes = ["070", "080", "081", "090"];
  const body = String(rand(10000000, 99999999));
  return `+234${pick(prefixes).slice(1)}${body}`;
};

// Attach both `owner` and legacy `ownerId`
const withOwner = (doc, ownerId) => ({ ...doc, owner: ownerId, ownerId });
const withAudit = (doc, userId) => ({ ...doc, createdBy: userId, updatedBy: userId });
const withTenant = (doc, orgId) => ({ ...doc, orgId, visibility: VIS_DEFAULT });

// ---------------------- constants ----------------------
const DEAL_STAGES = ["Qualification", "Needs Analysis", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
const probabilityForStage = (stage) =>
  ({
    Qualification: 0.2,
    "Needs Analysis": 0.35,
    Proposal: 0.55,
    Negotiation: 0.75,
    "Closed Won": 1,
    "Closed Lost": 0,
  }[stage] ?? 0.3);

const LEAD_STATUS = ["New", "Contacted", "Qualified", "Unqualified"];
const TASK_STATUS = ["Open", "In Progress", "Completed"];
const TASK_PRIORITY = ["Low", "Normal", "High"];
const MEETING_STATUS = ["Scheduled", "Completed", "Cancelled"];
const CAMPAIGN_STATUS = ["Draft", "Planned", "Running", "Paused", "Completed", "Cancelled"];
const CAMPAIGN_CHANNELS = ["Email", "Social", "Ads", "Event", "Affiliate", "Web"];

const industries = ["Technology", "Finance", "Retail", "Healthcare", "Education", "Manufacturing"];
const sources = ["Web", "Referral", "Event", "Ads", "Email"];
const titles = ["CEO", "CTO", "COO", "Head of Sales", "Sales Rep", "Manager", "Analyst"];
const firstNames = ["Ada", "Bola", "Chika", "Dayo", "Emeka", "Funmi", "Gbenga", "Hauwa", "Ife", "Jide", "Kelechi", "Lola", "Musa", "Ngozi", "Ola", "Paul", "Queen", "Rashidat", "Seyi", "Uche"];
const lastNames = ["Abiodun", "Bassey", "Chukwu", "Danjuma", "Eze", "Fashola", "Giwa", "Hassan", "Ibrahim", "Jimoh", "Kalu", "Lawal", "Mohammed", "Nwosu", "Okafor", "Peter", "Quadri", "Raji", "Sani", "Udo"];
const companyRoots = ["Zuma", "Konga", "Innova", "Sparkline", "Bluewave", "Datapath", "Greenbyte", "Nimbus", "Helix", "Vertex", "Sunrise", "Westgate"];

// ---------------------- sizes ----------------------
const counts = {
  accounts: Number(args.accounts ?? 12),
  contacts: Number(args.contacts ?? 40),
  leads: Number(args.leads ?? 50),
  products: Number(args.products ?? 15),
  deals: Number(args.deals ?? 24),
  tasks: Number(args.tasks ?? 35),
  meetings: Number(args.meetings ?? 16),
  calls: Number(args.calls ?? 18),
  campaigns: Number(args.campaigns ?? 12),
};

// ---------------------- base setup ----------------------
async function ensureOrgAndUsers() {
  let org = await Org.findOne({ name: ORG_NAME });
  if (!org) {
    org = await Org.create({
      name: ORG_NAME,
      domain: slug(ORG_NAME) + ".local",
      settings: { locale: "en-NG", currency: "NGN" },
    });
    logger.info(`Created org: ${ORG_NAME}`);
  }

  const ensureUser = async ({ name, email, username, role, password }) => {
    let u = await User.findOne({ email, orgId: org._id });
    if (!u) {
      const passwordHash = await User.hashPassword(password);
      u = await User.create(
        withTenant(
          {
            name,
            email,
            username,
            role,
            passwordHash,
          },
          org._id
        )
      );
      logger.info(`Created user: ${email} / ${password}`);
    }
    return u;
  };

  const admin = await ensureUser({
    name: "Admin",
    email: "admin@zura.local",
    username: "admin",
    role: "admin",
    password: "admin123",
  });

  const demo = await ensureUser({
    name: "Demo User",
    email: "user@zura.local",
    username: "demo",
    role: "user",
    password: "user1234",
  });

  if (!org.owner) {
    org.owner = admin._id;
    await org.save();
  }

  return { org, admin, demo };
}

// ---------------------- seeding steps ----------------------
async function seedProducts(orgId, ownerId) {
  const base = [
    { name: "Starter Plan", sku: "PLAN-START", price: 15_000, description: "Monthly subscription (NGN)" },
    { name: "Implementation Package", sku: "IMPL-001", price: 250_000, description: "One-time setup (NGN)" },
    { name: "Support Retainer", sku: "SUP-RET", price: 50_000, description: "Monthly support (NGN)" },
  ];

  // upsert base SKUs so seed is idempotent
  for (const p of base) {
    const doc = withTenant(withAudit(withOwner(p, ownerId), ownerId), orgId);
    await Product.findOneAndUpdate({ sku: p.sku, orgId }, doc, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  const extra = Math.max(0, counts.products - base.length);
  if (extra) {
    const docs = Array.from({ length: extra }, (_, i) => {
      const n = i + 1;
      const price = naira(20_000, 2_500_000);
      return withTenant(
        withAudit(
          withOwner(
            {
              name: `Add-on ${n}`,
              sku: `ADD-${String(n).padStart(3, "0")}`,
              price,
              cost: Math.floor((price * rand(50, 80)) / 100),
              stock: rand(0, 200),
              active: true,
              description: "Optional add-on (NGN)",
            },
            ownerId
          ),
          ownerId
        ),
        orgId
      );
    });
    try {
      await Product.insertMany(docs, { ordered: false });
    } catch {
      // ignore dup insert races
    }
  }

  const total = await Product.countDocuments({ orgId });
  logger.info(`Products ready: ${total}`);
  return Product.find({ orgId }).lean();
}

async function seedAccounts(orgId, ownerId) {
  const docs = Array.from({ length: counts.accounts }, () => {
    const name = `${pick(companyRoots)} ${pick(["Ltd", "Systems", "Solutions", "Group", "Holdings"])}`;
    const domain = `${slug(name)}.com`;
    const base = {
      name,
      website: `https://www.${domain}`,
      phone: phoneNG(),
      industry: pick(industries),
    };
    return withTenant(withAudit(withOwner(base, ownerId), ownerId), orgId);
  });
  const res = await Account.insertMany(docs, { ordered: false }).catch(() => []);
  logger.info(`Accounts inserted: ${res.length || docs.length}`);
  return Account.find({ orgId }).lean();
}

async function seedContacts(orgId, ownerId, accounts) {
  const docs = Array.from({ length: counts.contacts }, () => {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const acc = pick(accounts);
    const domain = (acc?.website || "example.com").replace(/^https?:\/\/(www\.)?/, "");
    const base = {
      firstName,
      lastName,
      email: `${slug(firstName)}.${slug(lastName)}@${domain}`,
      phone: phoneNG(),
      // Support both relationship styles
      accountId: acc?._id,
      account: acc?.name || "",
      title: pick(titles),
    };
    return withTenant(withAudit(withOwner(base, ownerId), ownerId), orgId);
  });
  const res = await Contact.insertMany(docs, { ordered: false }).catch(() => []);
  logger.info(`Contacts inserted: ${res.length || docs.length}`);
  return Contact.find({ orgId }).lean();
}

async function seedLeads(orgId, ownerId) {
  const docs = Array.from({ length: counts.leads }, () => {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const company = `${pick(companyRoots)} ${pick(["Ltd", "Logistics", "Tech", "Retail", "Media"])}`;
    const full = `${firstName} ${lastName}`;
    const base = {
      // keep both to satisfy any older schema
      name: full,
      firstName,
      lastName,
      email: `${slug(firstName)}.${slug(lastName)}@mail.com`,
      phone: phoneNG(),
      company,
      source: pick(sources),
      status: pick(LEAD_STATUS),
    };
    return withTenant(withAudit(withOwner(base, ownerId), ownerId), orgId);
  });
  const res = await Lead.insertMany(docs, { ordered: false }).catch(() => []);
  logger.info(`Leads inserted: ${res.length || docs.length}`);
  return Lead.find({ orgId }).lean();
}

async function seedDeals(orgId, ownerId, accounts, products) {
  const docs = Array.from({ length: counts.deals }, () => {
    const stage = pick(DEAL_STAGES);
    const acc = pick(accounts);
    // roll 1-3 products to make a total
    const parts = Array.from({ length: rand(1, 3) }, () => pick(products)?.price ?? naira(50_000, 5_000_000));
    const amount = parts.reduce((s, x) => s + (x || 0), 0);
    const base = {
      name: `${pick(["Renewal", "Upgrade", "POC", "New Deal", "Pilot"])} - ${acc?.name ?? "Unknown"}`,
      amount,
      // Support either ref or denormalized account
      accountId: acc?._id,
      account: acc?.name ?? "",
      stage,
      probability: probabilityForStage(stage),
      closeDate: rand(0, 1) ? nowPlusDays(rand(3, 120)) : nowMinusDays(rand(1, 60)),
    };
    return withTenant(withAudit(withOwner(base, ownerId), ownerId), orgId);
  });
  const res = await Deal.insertMany(docs, { ordered: false }).catch(() => []);
  logger.info(`Deals inserted: ${res.length || docs.length}`);
  return Deal.find({ orgId }).lean();
}

async function seedTasks(orgId, ownerId, leads, deals, contacts) {
  const subjects = ["Follow up", "Send proposal", "Demo", "Qualify", "Contract review", "Onboarding"];
  const relatedIds = [...leads, ...deals, ...contacts].map((x) => x?._id).filter(Boolean);

  const docs = Array.from({ length: counts.tasks }, () => {
    const base = {
      title: pick(subjects),
      status: pick(TASK_STATUS),      // UI-friendly
      priority: pick(TASK_PRIORITY),  // UI-friendly
      dueDate: rand(0, 1) ? nowPlusDays(rand(1, 30)) : nowMinusDays(rand(0, 10)),
      with: rand(0, 1) ? pick(["Acme Ltd", "Main Contact", "Procurement", "Legal"]) : "",
      relatedTo: pick(relatedIds) || undefined, // generic ref
      notes: "Auto-seeded task",
    };
    return withTenant(withAudit(withOwner(base, ownerId), ownerId), orgId);
  });
  const res = await Task.insertMany(docs, { ordered: false }).catch(() => []);
  logger.info(`Tasks inserted: ${res.length || docs.length}`);
}

async function seedMeetings(orgId, ownerId, contacts) {
  const topics = ["Intro Call", "Discovery", "Demo", "Negotiation", "QBR"];
  const places = ["Google Meet", "Zoom", "Teams", "Office"];

  const docs = Array.from({ length: counts.meetings }, (_, i) => {
    // mix past/future
    const start = i % 3 === 0 ? nowMinusDays(rand(1, 20)) : nowPlusDays(rand(1, 40));
    const dur = pick([30, 45, 60]);
    const end = new Date(start.getTime() + dur * 60 * 1000);

    const c = pick(contacts);
    const withStr = c ? [c.firstName, c.lastName].filter(Boolean).join(" ") : "Prospect";
    const attendee = c
      ? { name: withStr, email: c.email, response: "needsAction" }
      : null;

    const base = {
      // provide both legacy + v2-friendly fields
      subject: pick(topics),
      title: pick(topics),
      start, end,               // legacy (some schemas)
      startTime: start, endTime: end,
      when: start,              // v2
      durationMinutes: dur,
      with: withStr,
      status: pick(MEETING_STATUS),
      location: pick(places),
      notes: "Auto-seeded meeting",
      attendees: attendee ? [attendee] : [],
    };
    return withTenant(withAudit(withOwner(base, ownerId), ownerId), orgId);
  });

  const res = await Meeting.insertMany(docs, { ordered: false }).catch(() => []);
  logger.info(`Meetings inserted: ${res.length || docs.length}`);
}

async function seedCalls(orgId, ownerId, contacts) {
  const subjects = ["Intro", "Follow-up", "Negotiation", "Support", "Renewal"];
  const outcomes = ["connected", "voicemail", "no-answer"];

  const docs = Array.from({ length: counts.calls }, () => {
    const c = pick(contacts);
    const base = {
      subject: pick(subjects),
      phone: c?.phone ?? phoneNG(),
      outcome: pick(outcomes),
      notes: "Auto-seeded call",
      date: rand(0, 1) ? nowMinusDays(rand(0, 15)) : nowPlusDays(rand(1, 10)),
    };
    return withTenant(withAudit(withOwner(base, ownerId), ownerId), orgId);
  });
  const res = await Call.insertMany(docs, { ordered: false }).catch(() => []);
  logger.info(`Calls inserted: ${res.length || docs.length}`);
}

async function seedCampaigns(orgId, ownerId) {
  const docs = Array.from({ length: counts.campaigns }, (_, i) => {
    const name = `${pick(["Launch", "Promo", "Q${pick([1,2,3,4])}", "Brand Push", "Re-Engage"]) } ${i + 1}`;
    const channel = pick(CAMPAIGN_CHANNELS);
    const status = pick(CAMPAIGN_STATUS);
    const startDate = rand(0, 1) ? nowMinusDays(rand(1, 30)) : nowPlusDays(rand(1, 30));
    const runDays = rand(7, 45);
    const endDate = new Date(startDate.getTime() + runDays * 24 * 60 * 60 * 1000);
    const budget = naira(100_000, 3_000_000);
    const actualCost = status === "Completed" ? Math.floor(budget * rand(80, 110) / 100) : naira(0, budget);

    const base = {
      // new UI shape
      name,
      channel,
      status,
      startDate,
      endDate,
      budget,
      actualCost,
      notes: "Auto-seeded campaign",
      // legacy-friendly aliases (if model uses different fields)
      type: channel,
      startAt: startDate,
      endAt: endDate,
    };
    return withTenant(withAudit(withOwner(base, ownerId), ownerId), orgId);
  });

  const res = await Campaign.insertMany(docs, { ordered: false }).catch(() => []);
  logger.info(`Campaigns inserted: ${res.length || docs.length}`);
}

async function seedCalendar(orgId, userId) {
  // Upsert a sane default so settings page and public booking work out-of-the-box
  const payload = withTenant(
    {
      userId,
      slug: "meet",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      start: "09:00",
      end: "17:00",
      duration: 30,
    },
    orgId
  );
  await CalendarSettings.findOneAndUpdate(
    { orgId, userId },
    { $set: payload, $setOnInsert: { createdBy: userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  logger.info("Calendar settings ready");
}

// Optional purge (collection-level; keeps DB itself)
async function purgeAll() {
  const names = [
    "orgs",
    "users",
    "products",
    "accounts",
    "contacts",
    "leads",
    "deals",
    "tasks",
    "meetings",
    "calls",
    "campaigns",
    "calendarsettings",
  ];
  for (const n of names) {
    try {
      await mongoose.connection.db.dropCollection(n);
      logger.info(`Dropped ${n}`);
    } catch {
      // ignore if missing
    }
  }
}

// ---------------------- main ----------------------
async function seed() {
  await connectDB(logger);

  if (args.purge) {
    logger.info("Purging existing collections…");
    await purgeAll();
  }

  const { org, admin, demo } = await ensureOrgAndUsers();
  const orgId = org._id;
  const ownerId = demo?._id || admin._id;

  const products = await seedProducts(orgId, ownerId);
  const accounts = await seedAccounts(orgId, ownerId);
  const contacts = await seedContacts(orgId, ownerId, accounts);
  const leads = await seedLeads(orgId, ownerId);
  const deals = await seedDeals(orgId, ownerId, accounts, products);
  await seedTasks(orgId, ownerId, leads, deals, contacts);
  await seedMeetings(orgId, ownerId, contacts);
  await seedCalls(orgId, ownerId, contacts);
  await seedCampaigns(orgId, ownerId);
  await seedCalendar(orgId, ownerId);

  logger.info("✅ Seed completed");
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
}

seed().catch((e) => {
  logger.error(e?.stack || e?.message || e);
  process.exit(1);
});
