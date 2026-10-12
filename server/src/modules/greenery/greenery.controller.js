import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";
import * as greeneryService from "./greenery.service.js";

export const listBlocks = asyncHandler(async (_req, res) => {
  const data = await greeneryService.latestByBlock();
  return success(res, {
    message: "Latest greenery assessments. Priority rules are configurable recommendations, not ecological conclusions.",
    data,
  });
});

export const getBlock = asyncHandler(async (req, res) => {
  const block = await greeneryService.getBlock(req.params.id);
  return success(res, { message: "Greenery block", data: { block } });
});

export const createAssessment = asyncHandler(async (req, res) => {
  const assessment = await greeneryService.createAssessment(req.body, req.user);
  return success(res, { status: 201, message: "Assessment recorded", data: { assessment } });
});

export const listActions = asyncHandler(async (_req, res) => {
  const items = await greeneryService.listActions();
  return success(res, { message: "Greenery actions", data: { items } });
});

export const createAction = asyncHandler(async (req, res) => {
  const action = await greeneryService.createAction(req.body, req.user);
  return success(res, { status: 201, message: "Action created", data: { action } });
});

export const patchAction = asyncHandler(async (req, res) => {
  const action = await greeneryService.patchAction(req.params.id, req.body, req.user);
  return success(res, { message: "Action updated", data: { action } });
});
