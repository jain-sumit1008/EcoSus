import { ApiError } from "../utils/ApiError.js";

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required", "UNAUTHENTICATED"));
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission for this action", "FORBIDDEN"));
    }
    next();
  };
}
