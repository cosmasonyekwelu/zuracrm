import IntegrationSettings from "../models/IntegrationSettings.js";

export async function getIntegrations(_req, res) {
  const doc = (await IntegrationSettings.findOne().lean()) || {};
  res.json(doc);
}

export async function saveIntegrations(req, res) {
  let doc = await IntegrationSettings.findOne();
  if (!doc) doc = new IntegrationSettings(req.body || {});
  else Object.assign(doc, req.body || {});
  await doc.save();
  res.json({ ok: true });
}

export async function connectEmail(req, res) {
  const { provider } = req.body || {};
  if (!provider) return res.status(400).json({ message: "provider required" });

  let doc = await IntegrationSettings.findOne();
  if (!doc) doc = new IntegrationSettings();
  if (!doc.emailProviders) doc.emailProviders = {};
  doc.emailProviders.set(provider, true);
  await doc.save();

  res.json({ ok: true, connected: provider });
}
