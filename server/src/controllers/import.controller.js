import fs from "fs";
import Lead from "../models/Lead.js";
import Contact from "../models/Contact.js";
import Account from "../models/Account.js";
import Deal from "../models/Deal.js";
import Task from "../models/Task.js";
import { parseCsv } from "../utils/csv.js";

function pick(row, keys) {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
}

function mapRow(module, row) {
  if (module === "leads") {
    return {
      name: pick(row, ["Name", "Full Name", "Lead Name", "name"]),
      email: pick(row, ["Email", "email"]),
      phone: pick(row, ["Phone", "phone"]),
      status: pick(row, ["Status", "status"]) || "Imported",
    };
  }
  if (module === "contacts") {
    return {
      name: pick(row, ["Name", "Full Name", "Contact Name", "name"]),
      email: pick(row, ["Email", "email"]),
      phone: pick(row, ["Phone", "phone"]),
    };
  }
  if (module === "accounts") {
    return {
      name: pick(row, ["Company", "Account Name", "Name", "name"]),
      website: pick(row, ["Website", "website"]),
      phone: pick(row, ["Phone", "phone"]),
      industry: pick(row, ["Industry", "industry"]),
      notes: pick(row, ["Notes", "notes"]),
    };
  }
  if (module === "deals") {
    return {
      title: pick(row, ["Title", "Deal Name", "Subject", "title"]),
      amount: Number(pick(row, ["Amount", "amount"]) || 0),
      stage: pick(row, ["Stage", "stage"]) || "Qualification",
      status: "Open",
    };
  }
  if (module === "activities") {
    return {
      type: pick(row, ["Type", "type"]) || "Task",
      subject: pick(row, ["Subject", "Title", "subject"]),
      dueDate: pick(row, ["DueDate", "Due", "dueDate"]) ? new Date(pick(row, ["DueDate", "Due", "dueDate"])) : undefined,
      status: pick(row, ["Status", "status"]) || "Open",
    };
  }
  return null;
}

export async function importCsv(req, res) {
  const module = String(req.body.module || "").toLowerCase();
  if (!req.file) return res.status(400).json({ message: "CSV file required as 'file'" });
  if (!["leads", "contacts", "accounts", "deals", "activities"].includes(module)) {
    return res.status(400).json({ message: "Invalid module" });
  }

  const rows = await parseCsv(fs.createReadStream(req.file.path));
  const docs = rows.map((r) => mapRow(module, r)).filter(Boolean);

  let Model = null;
  if (module === "leads") Model = Lead;
  if (module === "contacts") Model = Contact;
  if (module === "accounts") Model = Account;
  if (module === "deals") Model = Deal;
  if (module === "activities") Model = Task; // default import into Tasks

  const inserted = await Model.insertMany(docs, { ordered: false }).catch((e) => e.insertedDocs || []);
  res.json({ ok: true, count: inserted.length });
}
