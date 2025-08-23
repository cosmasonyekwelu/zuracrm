import { ok, ApiError } from "../utils/http.js";
import { parsePagination, withPagination } from "../utils/paginate.js";

export function listHandler(Model, searchFields = []){
  return async function(req, res){
    const { q } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};
    if (q && searchFields.length){
      filter.$or = searchFields.map(f => ({ [f]: new RegExp(q, "i") }));
    }
    const query = Model.find(filter).skip(skip).sort({ createdAt: -1 });
    const data = await withPagination(query, { page, limit });
    return ok(res, data);
  };
}

export function createHandler(Model, mapBody = (b)=>b){
  return async function(req, res){
    const payload = mapBody(req.body, req);
    const doc = await Model.create(payload);
    return ok(res, doc, 201);
  };
}

export function getHandler(Model){
  return async function(req, res){
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new ApiError(404, "Not found");
    return ok(res, doc);
  };
}

export function updateHandler(Model){
  return async function(req, res){
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) throw new ApiError(404, "Not found");
    return ok(res, doc);
  };
}

export function removeHandler(Model){
  return async function(req, res){
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw new ApiError(404, "Not found");
    return ok(res, { ok: true });
  };
}
