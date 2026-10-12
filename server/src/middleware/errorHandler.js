import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const isProd = env.nodeEnv === "production";
  const payload = {
    success: false,
    message: err.message || "Internal server error",
    code: err.code || (status === 500 ? "INTERNAL_ERROR" : "ERROR"),
    details: err.details || [],
  };

  if (!isProd && err.stack && !(err instanceof ApiError)) {
    payload.stack = err.stack;
  }

  if (isProd && status === 500) {
    payload.message = "An unexpected error occurred. Retry the request or contact an administrator.";
  }

  res.status(status).json(payload);
}
