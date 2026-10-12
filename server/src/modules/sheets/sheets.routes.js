import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import * as controller from "./sheets.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", controller.listSheets);
router.get("/summary", controller.summary);
router.post("/", authorize("admin", "faculty"), controller.createSheet);
router.patch("/:id", authorize("admin", "faculty"), controller.updateSheet);
router.delete("/:id", authorize("admin"), controller.deleteSheet);

export default router;
