import { asyncHandler } from "../../utils/asyncHandler.js";
import { buildPagination, paginated, success } from "../../utils/apiResponse.js";
import * as sheetService from "./sheets.service.js";

export const listSheets = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const { items, total } = await sheetService.listSheets({ ...req.query, page, limit });
  return paginated(res, {
    message: "Sheet records retrieved successfully",
    items,
    pagination: buildPagination({ page, limit, total }),
  });
});

export const summary = asyncHandler(async (req, res) => {
  const data = await sheetService.getSheetSummary();
  return success(res, {
    message: "Sheets summary retrieved successfully",
    data,
  });
});

export const createSheet = asyncHandler(async (req, res) => {
  const sheet = await sheetService.createSheet(req.body, req.user);
  return success(res, {
    status: 201,
    message: `${req.body.type === "paper" ? "Paper" : "Digital"} sheet record created successfully`,
    data: { sheet },
  });
});

export const updateSheet = asyncHandler(async (req, res) => {
  const sheet = await sheetService.updateSheet(req.params.id, req.body, req.user);
  return success(res, {
    message: "Sheet record updated successfully",
    data: { sheet },
  });
});

export const deleteSheet = asyncHandler(async (req, res) => {
  await sheetService.deleteSheet(req.params.id, req.user);
  return success(res, {
    message: "Sheet record deleted successfully",
    data: { id: req.params.id },
  });
});
