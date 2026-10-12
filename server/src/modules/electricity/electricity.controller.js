import { asyncHandler } from "../../utils/asyncHandler.js";
import { buildPagination, paginated, success } from "../../utils/apiResponse.js";
import * as electricityService from "./electricity.service.js";

export const listReadings = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const { items, total } = await electricityService.listReadings({ ...req.query, page, limit });
  return paginated(res, {
    message: "Electricity readings",
    items,
    pagination: buildPagination({ page, limit, total }),
  });
});

export const createReading = asyncHandler(async (req, res) => {
  const result = await electricityService.createReading(req.body, req.user);
  return success(res, { status: 201, message: "Electricity reading saved", data: result });
});

export const listAlerts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const { items, total } = await electricityService.listAlerts({ ...req.query, page, limit });
  return paginated(res, { message: "Electricity alerts", items, pagination: buildPagination({ page, limit, total }) });
});

export const alertAction = asyncHandler(async (req, res) => {
  const result = await electricityService.addAlertAction(req.params.id, req.body, req.user);
  return success(res, { status: 201, message: "Corrective action recorded", data: result });
});
