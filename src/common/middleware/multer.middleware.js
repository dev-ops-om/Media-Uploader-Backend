import multer from "multer";

/**
 * Memory Storage Configuration:
 * Using memoryStorage stores the uploaded file directly in RAM as a Buffer (req.file.buffer).
 * This eliminates the need to write temporary files to the disk, avoiding disk I/O bottlenecks,
 * filesystem cleanup overhead, and ensuring compatibility with read-only/ephemeral container runtimes.
 */
const storage = multer.memoryStorage();

/**
 * File Filter:
 * Whitelist allowed MIME types for secure media uploads.
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Image formats
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    // Audio & Video
    "video/mp4",
    "video/webm",
    "audio/mpeg",
    "audio/wav",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter,
});
