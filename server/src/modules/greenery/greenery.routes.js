import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./greenery.controller.js";
import { assessmentSchema, actionCreateSchema, actionPatchSchema } from "./greenery.validation.js";

const router = Router();
router.use(authenticate);
router.get("/blocks", controller.listBlocks);
router.get("/blocks/:id", controller.getBlock);
router.post("/assessments", authorize("admin", "faculty"), validate(assessmentSchema), controller.createAssessment);
router.get("/actions", controller.listActions);
router.post("/actions", authorize("admin", "faculty"), validate(actionCreateSchema), controller.createAction);
router.patch("/actions/:id", authorize("admin", "faculty"), validate(actionPatchSchema), controller.patchAction);

export default router;
