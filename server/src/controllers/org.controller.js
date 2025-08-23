import Org from "../models/Org.js";

export async function getOrg(_req, res) {
  const org = await Org.findOne().lean() || {};
  res.json(org);
}

export async function patchOrg(req, res) {
  const patch = {};
  for (const k of ["name", "website", "logoUrl"]) {
    if (typeof req.body[k] === "string") patch[k] = req.body[k];
  }
  let org = await Org.findOne();
  if (!org) org = new Org(patch);
  else Object.assign(org, patch);
  await org.save();
  res.json(org);
}

export async function uploadLogo(req, res) {
  if (!req.file) return res.status(400).json({ message: "No file" });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
}
