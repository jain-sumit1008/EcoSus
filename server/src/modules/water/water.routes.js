import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./water.controller.js";
import {
  createReadingSchema,
  listReadingsSchema,
  listAlertsSchema,
  patchAlertSchema,
  alertActionSchema,
} from "./water.validation.js";

const router = Router();
const staff = ["admin", "faculty"];

router.use(authenticate);
router.get("/readings", validate(listReadingsSchema), controller.listReadings);
router.post("/readings", authorize(...staff), validate(createReadingSchema), controller.createReading);
router.get("/alerts", validate(listAlertsSchema), controller.listAlerts);
router.patch("/alerts/:id", authorize("admin"), validate(patchAlertSchema), controller.patchAlert);
router.post("/alerts/:id/actions", authorize(...staff), validate(alertActionSchema), controller.alertAction);

export default router;
