export function parsePagination(query){
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function withPagination(modelQuery, { page, limit }){
  const [items, total] = await Promise.all([
    modelQuery.limit(limit),
    modelQuery.model.countDocuments(modelQuery.getQuery())
  ]);
  const pages = Math.ceil(total / limit) || 1;
  return { items, total, page, pages, limit };
}
