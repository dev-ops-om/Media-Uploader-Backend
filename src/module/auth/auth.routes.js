import { Router } from "express";
import * as controller from "./auth.controller.js";
import validate from "../../common/middleware/validate.middleware.js";
import RegisterDto from "../auth/dto/register.dto.js"

const router=Router();
router.post("/register",validate(RegisterDto),controller.register);

export default router;