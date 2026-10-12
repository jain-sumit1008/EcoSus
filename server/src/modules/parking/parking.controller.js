import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";
import * as parkingService from "./parking.service.js";

export const listAreas = asyncHandler(async (req, res) => {
  const items = await parkingService.listAreas();
  return success(res, {
    message: "Parking areas. Occupancy is manually reported or simulated unless source is integrated.",
    data: { items },
  });
});

export const getArea = asyncHandler(async (req, res) => {
  const area = await parkingService.getArea(req.params.id);
  return success(res, { message: "Parking area", data: { area } });
});

export const updateOccupancy = asyncHandler(async (req, res) => {
  const area = await parkingService.updateOccupancy(req.params.id, req.body, req.user);
  return success(res, { message: "Occupancy updated", data: { area } });
});

export const listBlocks = asyncHandler(async (req, res) => {
  const data = await parkingService.listBlocks(req.user);
  return success(res, {
    message: "SVVV Campus Parking Blocks and Gate locations retrieved successfully",
    data,
  });
});

export const getBlockDetails = asyncHandler(async (req, res) => {
  const block = await parkingService.getBlockDetails(req.params.block, req.user);
  return success(res, {
    message: `Block ${req.params.block} details retrieved successfully`,
    data: { block },
  });
});

export const updateSlotStatus = asyncHandler(async (req, res) => {
  const block = await parkingService.updateSlotStatus(
    req.params.block,
    req.params.slotNumber,
    req.body,
    req.user
  );
  return success(res, {
    message: `Slot ${req.params.slotNumber} updated successfully`,
    data: { block },
  });
});

export const getBlockAnalysis = asyncHandler(async (req, res) => {
  const analysis = await parkingService.getBlockAnalysis(req.query.block || "A");
  return success(res, {
    message: "Parking block analysis retrieved successfully",
    data: { analysis },
  });
});
