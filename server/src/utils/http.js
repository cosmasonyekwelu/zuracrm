export class ApiError extends Error {
  constructor(statusCode, message, meta={}){
    super(message);
    this.statusCode = statusCode;
    this.meta = meta;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const ok = (res, data = {}, status=200) => res.status(status).json(data);
