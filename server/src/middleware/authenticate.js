import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const token = bearer || req.cookies?.[env.cookieName];

  if (!token) {
    throw new ApiError(401, "Authentication required", "UNAUTHENTICATED");
  }

  try {
    const payload = jwt.verify(token, env.authSecret);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user || !user.active) {
      throw new ApiError(401, "Authentication required", "UNAUTHENTICATED");
    }
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Authentication required", "UNAUTHENTICATED");
  }
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const token = bearer || req.cookies?.[env.cookieName];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.authSecret);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (user?.active) req.user = user;
  } catch {
    /* ignore optional auth failures */
  }
  next();
});
