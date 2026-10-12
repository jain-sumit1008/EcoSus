import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";
import * as demoService from "./demo.service.js";

export const run = asyncHandler(async (req, res) => {
  const data = await demoService.runDemo(req.user);
  return success(res, { message: data.message, data });
});
