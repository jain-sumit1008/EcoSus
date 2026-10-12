import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";
import * as dashboardService from "./dashboard.service.js";

export const summary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary(req.query);
  return success(res, { message: "Dashboard summary aggregated from MongoDB records", data });
});
