import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./attendance.controller.js";
import {
  createSessionSchema,
  listSessionsSchema,
  idParamSchema,
  generateQrSchema,
  validateQrSchema,
  submitRecordSchema,
  listRecordsSchema,
} from "./attendance.validation.js";

const router = Router();

router.use(authenticate);
router.post("/sessions", authorize("admin", "faculty"), validate(createSessionSchema), controller.createSession);
router.get("/sessions", validate(listSessionsSchema), controller.listSessions);
router.post("/sessions/:id/qr", authorize("admin", "faculty"), validate(generateQrSchema), controller.generateQr);
router.post("/sessions/:id/revoke", authorize("admin", "faculty"), validate(idParamSchema), controller.revokeSession);
router.post("/validate-qr", validate(validateQrSchema), controller.validateQr);
router.post("/webauthn/authentication/options", controller.webauthnOptions);
router.post("/webauthn/authentication/verify", controller.webauthnVerify);
router.post("/sessions/:id/records", validate(submitRecordSchema), controller.submitRecord);
router.get("/records", validate(listRecordsSchema), controller.listRecords);
router.post("/sessions/:id/close", authorize("admin", "faculty"), validate(idParamSchema), controller.closeSession);
router.get("/paper", controller.paper);

export default router;
