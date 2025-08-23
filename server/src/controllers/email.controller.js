import IntegrationSettings from "../models/IntegrationSettings.js";

export async function getEmailSettings(_req, res) {
  const doc = (await IntegrationSettings.findOne().lean()) || {};
  res.json({
    fromName: doc.fromName || "",
    fromEmail: doc.fromEmail || "",
    signature: doc.signature || "",
    providers: Object.fromEntries((doc.emailProviders || new Map()).entries?.() || []),
  });
}

export async function saveEmailSettings(req, res) {
  let doc = await IntegrationSettings.findOne();
  if (!doc) doc = new IntegrationSettings();
  const { fromName, fromEmail, signature, providers } = req.body || {};
  if (typeof fromName === "string") doc.fromName = fromName;
  if (typeof fromEmail === "string") doc.fromEmail = fromEmail;
  if (typeof signature === "string") doc.signature = signature;
  if (providers && typeof providers === "object") {
    doc.emailProviders = new Map(Object.entries(providers));
  }
  await doc.save();
  res.json({ ok: true });
}
