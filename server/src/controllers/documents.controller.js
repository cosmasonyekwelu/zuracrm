import fs from "fs";
import path from "path";
import Document from "../models/Document.js";

function fileToView(doc, req) {
  const base = `${req.protocol}://${req.get("host")}`;
  const rel = doc.path?.startsWith("/uploads") ? doc.path : `/uploads/${doc.filename}`;
  return {
    _id: doc._id,
    name: doc.title || doc.filename,
    url: `${base}${rel}`,
    type: doc.ext || doc.mime || "file",
    sizeKb: doc.size ? Math.round(doc.size / 1024) : undefined,
    uploadedAt: doc.createdAt,
  };
}

export async function list(req, res, next) {
  try {
    const docs = await Document.find({ orgId: req.user.orgId }).sort({ createdAt: -1 }).lean();
    res.json(docs.map((d) => fileToView(d, req)));
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const f = req.file;

    const relPath = `/uploads/${f.filename}`;
    const ext = path.extname(f.filename).slice(1).toLowerCase();

    const doc = await Document.create({
      orgId: req.user.orgId,
      owner: req.user.id,
      ownerId: req.user.id,
      createdBy: req.user.id,
      updatedBy: req.user.id,
      title: req.body?.title || f.originalname || f.filename,
      filename: f.filename,
      mime: f.mimetype,
      size: f.size,
      ext,
      path: relPath,
    });

    res.status(201).json(fileToView(doc, req));
  } catch (err) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: "Document validation failed", details: err.message });
    }
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const doc = await Document.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // best-effort delete file from disk
    const abs = path.join(process.cwd(), doc.path.replace(/^\/+/, ""));
    fs.promises.unlink(abs).catch(() => {});
    await doc.deleteOne();

    res.status(204).end();
  } catch (err) { next(err); }
}
