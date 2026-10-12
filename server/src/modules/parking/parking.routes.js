import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./parking.controller.js";
import * as tokenController from "./parkingToken.controller.js";
import { occupancySchema } from "./parking.validation.js";

const router = Router();
router.use(authenticate);

// Legacy area endpoints
router.get("/areas", controller.listAreas);
router.get("/areas/:id", controller.getArea);
router.patch(
  "/areas/:id/occupancy",
  authorize("admin", "parkingManager"),
  validate(occupancySchema),
  controller.updateOccupancy
);

// SVVV Block-Level Endpoints
router.get("/blocks", controller.listBlocks);
router.get("/blocks/:block", controller.getBlockDetails);
router.patch("/blocks/:block/slots/:slotNumber", controller.updateSlotStatus);
router.get("/analysis", controller.getBlockAnalysis);

// Digital Parking Token Endpoints
router.post("/tokens/reserve", tokenController.createReservation);
router.get("/tokens/my", tokenController.getMyTokens);
router.get("/tokens/:id", tokenController.getTokenById);
router.post("/tokens/:id/cancel", tokenController.cancelReservation);

// Gate Staff & Operations Endpoints
router.post(
  "/gate/entry",
  authorize("admin", "parkingManager"),
  tokenController.verifyGateEntry
);
router.post(
  "/gate/exit",
  authorize("admin", "parkingManager"),
  tokenController.verifyGateExit
);
router.get(
  "/gate/dashboard",
  authorize("admin", "parkingManager"),
  tokenController.getStaffDashboard
);

export default router;
