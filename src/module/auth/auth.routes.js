import { Router } from "express";
import LoginDto from "./dto/login.dto.js"; 
import * as controller from "./auth.controller.js";
import validate from "../../common/middleware/validate.middleware.js";
import RegisterDto from "../auth/dto/register.dto.js"
import { authenticate } from "./auth.middleware.js";
const router=Router();
router.post("/register",validate(RegisterDto),controller.register);
router.post("/login",validate(LoginDto),controller.login)
router.get("/verify-email/:token", controller.verifyEmail);
router.get("/me", authenticate, controller.getMe);
export default router;