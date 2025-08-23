import Call, { CALL_STATUS, CALL_RESULT } from "../models/Call.js";
import { ApiError } from "../utils/http.js";

const toISO = (v)=> (v ? new Date(v).toISOString() : null);

/** GET /calls?search= */
export async function list(req, res, next){
  try{
    const { search = "" } = req.query;
    const q = search.trim();
    const filter = {
      ...(req.user?.id ? { owner: req.user.id } : {}),
      ...(q ? { $or: [
        { subject: { $regex: q, $options: "i" } },
        { with:    { $regex: q, $options: "i" } },
        { phone:   { $regex: q, $options: "i" } },
        { status:  { $regex: q, $options: "i" } },
        { result:  { $regex: q, $options: "i" } },
      ] } : {}),
    };
    const items = await Call.find(filter).sort({ when: -1, updatedAt: -1 }).lean();
    res.json(items);
  } catch (e){ next(e); }
}

/** POST /calls */
export async function create(req, res, next){
  try{
    const b = req.body || {};
    if (!b.subject || !String(b.subject).trim()) throw new ApiError(400, "Subject is required");

    const payload = {
      subject:   String(b.subject).trim(),
      when:      b.when ? new Date(b.when) : undefined,
      with:      (b.with || "").trim(),
      phone:     (b.phone || "").trim(),
      direction: ["Outbound","Inbound"].includes(b.direction) ? b.direction : "Outbound",
      status:    CALL_STATUS.includes(b.status) ? b.status : "Planned",
      result:    b.result && CALL_RESULT.includes(b.result) ? b.result : undefined,
      durationSec: b.durationSec == null ? 0 : Number(b.durationSec || 0),
      notes:     (b.notes || "").trim(),
      owner:     req.user?.id || undefined,
    };

    // if a result is provided but status isn’t Completed, auto-complete
    if (payload.result && payload.status !== "Completed") payload.status = "Completed";

    const doc = await Call.create(payload);
    res.status(201).json(doc.toObject());
  } catch (e){ next(e); }
}

/** PATCH /calls/:id */
export async function update(req, res, next){
  try{
    const b = req.body || {};
    const $set = {};
    if (b.subject !== undefined)     $set.subject = String(b.subject).trim();
    if (b.when !== undefined)        $set.when = b.when ? new Date(b.when) : null;
    if (b.with !== undefined)        $set.with = String(b.with).trim();
    if (b.phone !== undefined)       $set.phone = String(b.phone).trim();
    if (b.direction !== undefined && ["Outbound","Inbound"].includes(b.direction)) $set.direction = b.direction;
    if (b.status !== undefined && CALL_STATUS.includes(b.status)) $set.status = b.status;
    if (b.result !== undefined) {
      if (b.result === null || b.result === "") $set.result = undefined;
      else if (CALL_RESULT.includes(b.result))  $set.result = b.result;
      else throw new ApiError(400, "Invalid call result");
    }
    if (b.durationSec !== undefined) $set.durationSec = b.durationSec == null ? 0 : Number(b.durationSec || 0);
    if (b.notes !== undefined)       $set.notes = String(b.notes).trim();

    if ($set.result && $set.status !== "Completed") $set.status = "Completed";

    const doc = await Call.findOneAndUpdate(
      { _id: req.params.id, ...(req.user?.id ? { owner: req.user.id } : {}) },
      { $set }, { new:true, runValidators:true }
    ).lean();

    if (!doc) throw new ApiError(404, "Not found");
    res.json(doc);
  } catch (e){ next(e); }
}

/** DELETE /calls/:id */
export async function remove(req, res, next){
  try{
    const r = await Call.deleteOne({ _id: req.params.id, ...(req.user?.id ? { owner: req.user.id } : {}) });
    if (!r.deletedCount) throw new ApiError(404, "Not found");
    res.json({ ok:true });
  } catch (e){ next(e); }
}
