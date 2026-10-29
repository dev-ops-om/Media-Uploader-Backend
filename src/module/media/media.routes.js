import { Router } from "express";
import * as controller from "./media.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { upload } from "../../common/middleware/multer.middleware.js";

const router = Router();

// Protect all media endpoints with authentication
router.use(authenticate);

// 1. Upload media (field name: "file")
router.post("/upload", upload.single("file"), controller.uploadMedia);

// 2. Get all uploaded files of logged-in user
router.get("/", controller.getAllMedia);

// 3. Get single file details
router.get("/:id", controller.getMediaById);

// 4. Delete file
router.delete("/:id", controller.deleteMedia);

export default router;
