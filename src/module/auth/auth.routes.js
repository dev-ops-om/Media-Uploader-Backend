import { Router } from "express";
import LoginDto from "./dto/login.dto.js"; 
import * as controller from "./auth.controller.js";
import validate from "../../common/middleware/validate.middleware.js";
import RegisterDto from "../auth/dto/register.dto.js";
import ForgotPasswordDto from "./dto/forget-password.dto.js";
import ResetPasswordDto from "./dto/reset-password.dto.js";
import { authenticate } from "./auth.middleware.js";
import { upload } from "../../common/middleware/multer.middleware.js";
const router=Router();

//public token
router.post("/register",validate(RegisterDto),controller.register);
router.post("/login",validate(LoginDto),controller.login)
router.get("/verify-email/:token", controller.verifyEmail);
router.post("/refresh-token",controller.refreshToken);

//password protection
router.post("/forgot-password", validate(ForgotPasswordDto), controller.forgotPassword);
router.put("/reset-password/:token", validate(ResetPasswordDto), controller.resetPassword);


//protected routes
router.get("/me", authenticate, controller.getMe);
router.post("/logout",authenticate,controller.logout);
router.post("/avatar",authenticate,upload.single("avatar"),controller.uploadAvatar);

export default router;