import { asyncHandler } from "../../utils/asyncHandler.js";
import { buildPagination, paginated, success } from "../../utils/apiResponse.js";
import * as waterService from "./water.service.js";

export const listReadings = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const { items, total } = await waterService.listReadings({ ...req.query, page, limit });
  return paginated(res, {
    message: "Water readings",
    items,
    pagination: buildPagination({ page, limit, total }),
  });
});

export const createReading = asyncHandler(async (req, res) => {
  const result = await waterService.createReading(req.body, req.user);
  return success(res, {
    status: 201,
    message: "Water reading saved. Consumption is stored as interval usage in litres, not a cumulative meter total.",
    data: result,
  });
});

export const listAlerts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const { items, total } = await waterService.listAlerts({ ...req.query, page, limit });
  return paginated(res, {
    message: "Water alerts. These indicate possible problems, not confirmed leaks.",
    items,
    pagination: buildPagination({ page, limit, total }),
  });
});

export const patchAlert = asyncHandler(async (req, res) => {
  const alert = await waterService.patchAlert(req.params.id, req.body, req.user);
  return success(res, { message: "Alert updated", data: { alert } });
});

export const alertAction = asyncHandler(async (req, res) => {
  const result = await waterService.addAlertAction(req.params.id, req.body, req.user);
  return success(res, { status: 201, message: "Corrective action recorded", data: result });
});
