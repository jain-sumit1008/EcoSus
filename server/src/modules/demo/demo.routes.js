import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import * as controller from "./demo.controller.js";

const router = Router();
router.use(authenticate, authorize("admin"));
router.post("/run", controller.run);
export default router;
