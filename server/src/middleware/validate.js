import { ApiError } from "../utils/ApiError.js";

export function validate(schema) {
  return (req, _res, next) => {
    const payload = {
      body: req.body,
      query: req.query,
      params: req.params,
    };
    const result = schema.safeParse(payload);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return next(new ApiError(400, "Request validation failed", "VALIDATION_ERROR", details));
    }
    req.validated = result.data;
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = { ...req.query, ...result.data.query };
    if (result.data.params) req.params = { ...req.params, ...result.data.params };
    next();
  };
}
