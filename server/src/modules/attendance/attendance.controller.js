import { asyncHandler } from "../../utils/asyncHandler.js";
import { buildPagination, paginated, success } from "../../utils/apiResponse.js";
import * as attendanceService from "./attendance.service.js";
import * as webauthnService from "./webauthn.service.js";

export const createSession = asyncHandler(async (req, res) => {
  const session = await attendanceService.createSession(req.body, req.user);
  return success(res, { status: 201, message: "Attendance session created", data: { session } });
});

export const listSessions = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const { items, total } = await attendanceService.listSessions({ ...req.query, page, limit });
  return paginated(res, { message: "Attendance sessions", items, pagination: buildPagination({ page, limit, total }) });
});

export const generateQr = asyncHandler(async (req, res) => {
  const validityMinutes = req.body?.validityMinutes || 10;
  const data = await attendanceService.generateQr(req.params.id, req.user, validityMinutes);
  return success(res, { message: "Short-lived attendance QR issued", data });
});

export const revokeSession = asyncHandler(async (req, res) => {
  const session = await attendanceService.revokeQr(req.params.id, req.user);
  return success(res, { message: "Attendance session QR revoked", data: { session } });
});

export const validateQr = asyncHandler(async (req, res) => {
  const session = await attendanceService.validateQr(req.body.token);
  return success(res, { message: "QR token is valid", data: { session } });
});

export const submitRecord = asyncHandler(async (req, res) => {
  const record = await attendanceService.submitRecord(req.params.id, req.body, req.user);
  return success(res, { status: 201, message: "Attendance recorded", data: { record } });
});

export const listRecords = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const { items, total } = await attendanceService.listRecords({ ...req.query, page, limit }, req.user);
  return paginated(res, { message: "Attendance records", items, pagination: buildPagination({ page, limit, total }) });
});

export const closeSession = asyncHandler(async (req, res) => {
  const session = await attendanceService.closeSession(req.params.id, req.user);
  return success(res, { message: "Session closed. Eligible unmarked students were marked absent after cutoff.", data: { session } });
});

export const paper = asyncHandler(async (req, res) => {
  const data = await attendanceService.paperSummary();
  return success(res, { message: "Paper savings estimate", data });
});

export const webauthnOptions = asyncHandler(async (req, res) => {
  const options = await webauthnService.authenticationOptions(req.user);
  return success(res, { message: "WebAuthn authentication options", data: { options } });
});

export const webauthnVerify = asyncHandler(async (req, res) => {
  const result = await webauthnService.verifyAuthentication(req.user, req.body.response || req.body);
  return success(res, { message: "WebAuthn authentication succeeded. The authenticator verified locally; EcoPulse never received fingerprint data.", data: result });
});
