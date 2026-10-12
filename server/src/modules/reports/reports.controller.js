import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";
import * as reportsService from "./reports.service.js";

export const summary = asyncHandler(async (req, res) => {
  const data = await reportsService.getReportSummary(req.query);
  return success(res, { message: "Report summary", data });
});

export const exportCsv = asyncHandler(async (req, res) => {
  const csv = await reportsService.exportCsv(req.query);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="ecopulse-${req.query.dataset || "export"}.csv"`);
  return res.status(200).send(csv);
});
