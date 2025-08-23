// src/controllers/leads.controller.js
import Lead from "../models/Lead.js";

export async function createLead(req, res, next) {
  try {
    const { firstName, lastName, name, ...rest } = req.body;
    const fullName = (name && name.trim()) || [firstName, lastName].filter(Boolean).join(" ");

    const doc = await Lead.create({
      ...rest,
      firstName,
      lastName,
      name: fullName || undefined,
      orgId: req.user.orgId,
      owner: req.user.id,
      ownerId: req.user.id,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    res.status(201).json({ item: doc });
  } catch (err) {
    next(err);
  }
}

export async function updateLead(req, res, next) {
  try {
    const { firstName, lastName, name, ...rest } = req.body;
    const fullName =
      (name && name.trim()) ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      undefined;

    const doc = await Lead.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      {
        ...rest,
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        ...(fullName !== undefined ? { name: fullName } : {}),
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ message: "Lead not found" });
    res.json({ item: doc });
  } catch (err) {
    next(err);
  }
}
