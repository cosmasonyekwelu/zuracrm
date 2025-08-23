// server/src/controllers/company.controller.js
import Org from "../models/Org.js";

const normalizeDomain = (d = "") =>
  String(d)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:.*$/, "")
    .replace(/^www\./, "");

export async function getCompany(req, res) {
  const org = await Org.findById(req.user.orgId).lean();
  if (!org) return res.status(404).json({ error: "Org not found" });

  // Prefer top-level fields; fall back to settings if present
  const payload = {
    name:     org.name ?? "",
    domain:   org.domain ?? org.settings?.domain ?? "",
    timezone: org.timezone ?? org.settings?.timezone ?? "Africa/Lagos",
    locale:   org.locale ?? org.settings?.locale ?? "en-NG",
    logoUrl:  org.logoUrl ?? org.settings?.logoUrl ?? "",
  };

  return res.json(payload);
}

export async function patchCompany(req, res) {
  const allowed = ["name", "domain", "timezone", "locale", "logoUrl"];
  const updates = {};

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = key === "domain" ? normalizeDomain(req.body[key]) : String(req.body[key] || "").trim();
    }
  }

  // Minimal validation
  if (updates.name !== undefined) {
    if (!updates.name) return res.status(400).json({ error: "Company name is required" });
    if (updates.name.length < 2) return res.status(400).json({ error: "Name must be at least 2 characters" });
  }
  if (updates.domain) {
    const re = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!re.test(updates.domain)) return res.status(400).json({ error: "Invalid domain (e.g., company.com)" });
  }

  const org = await Org.findByIdAndUpdate(
    req.user.orgId,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();

  if (!org) return res.status(404).json({ error: "Org not found" });

  return res.json({
    name: org.name ?? "",
    domain: org.domain ?? "",
    timezone: org.timezone ?? "Africa/Lagos",
    locale: org.locale ?? "en-NG",
    logoUrl: org.logoUrl ?? "",
  });
}

export async function uploadCompanyLogo(req, res) {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // If you serve /uploads statically, this URL will be publicly reachable
  const logoUrl = req.file.publicUrl || `/uploads/org-logos/${req.file.filename}`;

  const org = await Org.findByIdAndUpdate(
    req.user.orgId,
    { $set: { logoUrl } },
    { new: true }
  ).lean();

  if (!org) return res.status(404).json({ error: "Org not found" });

  return res.json({ logoUrl });
}
