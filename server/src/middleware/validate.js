// server/src/middleware/validate.js
import { ApiError } from "../utils/http.js";

export function validate(schemas){
  return (req, _res, next) => {
    try {
      if (schemas.body?.parse)  req.body  = schemas.body.parse(req.body);
      if (schemas.query?.parse) req.query = schemas.query.parse(req.query);
      if (schemas.params?.parse)req.params= schemas.params.parse(req.params);
      next();
    } catch (e) {
      const issues = e?.issues || e?.errors;
      const message = issues?.[0]?.message || e?.message || "Validation failed";
      next(new ApiError(400, message, { issues }));
    }
  };
}
