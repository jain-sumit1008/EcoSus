import { Router } from "express";
import { loginLimiter } from "../../middleware/rateLimiter.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import { loginSchema } from "./auth.validation.js";
import * as controller from "./auth.controller.js";

const router = Router();

router.post("/login", loginLimiter, validate(loginSchema), controller.login);
router.post("/google", loginLimiter, controller.googleLogin);
router.post("/logout", authenticate, controller.logout);
router.get("/me", authenticate, controller.me);
router.post("/switch-role", authenticate, controller.switchRole);

export default router;
