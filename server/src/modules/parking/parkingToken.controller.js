import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";
import * as tokenService from "./parkingToken.service.js";

export const createReservation = asyncHandler(async (req, res) => {
  const token = await tokenService.createReservation(req.body, req.user);
  return success(res, {
    message: `Digital parking token generated successfully: ${token.tokenId}`,
    data: { token },
    status: 201,
  });
});

export const getMyTokens = asyncHandler(async (req, res) => {
  const tokens = await tokenService.getMyTokens(req.user, req.query);
  return success(res, {
    message: "User parking passes retrieved successfully",
    data: { tokens, count: tokens.length },
  });
});

export const getTokenById = asyncHandler(async (req, res) => {
  const token = await tokenService.getTokenById(req.params.id, req.user);
  return success(res, {
    message: "Digital parking token details retrieved",
    data: { token },
  });
});

export const cancelReservation = asyncHandler(async (req, res) => {
  const token = await tokenService.cancelReservation(req.params.id, req.body?.reason, req.user);
  return success(res, {
    message: `Reservation ${token.tokenId} has been successfully cancelled and slot released`,
    data: { token },
  });
});

export const verifyGateEntry = asyncHandler(async (req, res) => {
  const token = await tokenService.verifyGateEntry(req.body, req.user);
  return success(res, {
    message: `Gate Entry Verified: Vehicle ${token.vehicleNumber} checked in at ${token.checkIn?.gate}`,
    data: { token },
  });
});

export const verifyGateExit = asyncHandler(async (req, res) => {
  const result = await tokenService.verifyGateExit(req.body, req.user);
  return success(res, {
    message: `Gate Exit Verified: Parking fee ₹${result.token.pricing.finalAmount} settled and slot ${result.token.slotNumber} released`,
    data: result,
  });
});

export const getStaffDashboard = asyncHandler(async (req, res) => {
  const dashboard = await tokenService.getStaffDashboard();
  return success(res, {
    message: "Staff parking operations dashboard retrieved",
    data: dashboard,
  });
});
