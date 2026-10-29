import { Router } from "express";
import * as controller from "./media.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { upload } from "../../common/middleware/multer.middleware.js";

const router = Router();

// Protect all media endpoints with JWT authentication
router.use(authenticate);

// 1. Single file upload (field name: 'file')
router.post("/upload", upload.single("file"), controller.uploadSingle);

// 2. Multiple files upload (field name: 'files', max 10 files)
router.post("/upload-multiple", upload.array("files", 10), controller.uploadMultiple);

// 3. Get all uploaded media files for current user
router.get("/", controller.getAllMedia);

// 4. Get single media file by ID
router.get("/:id", controller.getMediaById);

// 5. Delete media file by ID
router.delete("/:id", controller.deleteMedia);

export default router;
