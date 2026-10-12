import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import * as authService from "./auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.cookie(env.cookieName, result.token, authService.cookieOptions());
  return success(res, { message: "Logged in", data: { user: result.user } });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user);
  res.clearCookie(env.cookieName, { ...authService.cookieOptions(), maxAge: 0 });
  return success(res, { message: "Logged out", data: {} });
});

export const me = asyncHandler(async (req, res) => {
  return success(res, { message: "Current user", data: { user: req.user.toSafeJSON() } });
});

export const switchRole = asyncHandler(async (req, res) => {
  const { targetRole } = req.body;
  if (!targetRole) {
    throw new ApiError(400, "targetRole is required", "BAD_REQUEST");
  }
  const result = await authService.switchRole(req.user, targetRole);
  res.cookie(env.cookieName, result.token, authService.cookieOptions());
  return success(res, { message: `Role switched to ${targetRole}`, data: { user: result.user } });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const result = await authService.googleLogin(req.body);
  res.cookie(env.cookieName, result.token, authService.cookieOptions());
  return success(res, { message: "Authenticated via Google", data: { user: result.user } });
});
