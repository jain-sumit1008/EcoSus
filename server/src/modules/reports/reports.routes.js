import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import * as controller from "./reports.controller.js";

const router = Router();
router.use(authenticate);
router.get("/summary", controller.summary);
router.get("/export", authorize("admin", "faculty"), controller.exportCsv);
export default router;
