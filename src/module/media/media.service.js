import { toFile } from "@imagekit/nodejs";
import imageKit from "../../common/config/imagekit.js";
import Media from "./media.model.js";
import ApiError from "../../common/utils/api-error.js";

/**
 * Determine general category from MIME type
 */
const resolveFileType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  ) {
    return "document";
  }
  return "other";
};

/**
 * 1. Upload a single file from memory buffer directly to ImageKit
 */
export const uploadFile = async (userId, file, folder = "/media-uploads") => {
  if (!file || !file.buffer) {
    throw ApiError.badRequest("No file buffer provided for upload");
  }

  // Convert in-memory buffer to an ImageKit-compatible File object
  const fileObj = await toFile(file.buffer, file.originalname, {
    type: file.mimetype,
  });

  // Unique sanitized filename prefix to avoid collisions
  const safeFileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

  // Upload to ImageKit cloud directly from RAM buffer
  const ikResponse = await imageKit.files.upload({
    file: fileObj,
    fileName: safeFileName,
    folder,
  });

  // Save media record and metadata in MongoDB
  const media = await Media.create({
    user: userId,
    fileName: ikResponse.name,
    originalName: file.originalname,
    fileId: ikResponse.fileId,
    url: ikResponse.url,
    thumbnailUrl: ikResponse.thumbnailUrl || ikResponse.url,
    size: file.size,
    mimeType: file.mimetype,
    fileType: resolveFileType(file.mimetype),
    folder,
  });

  return media;
};

/**
 * 2. Upload multiple files from memory buffer in parallel
 */
export const uploadMultipleFiles = async (userId, files, folder = "/media-uploads") => {
  if (!files || files.length === 0) {
    throw ApiError.badRequest("No files provided for upload");
  }

  // Upload all files concurrently
  const uploadPromises = files.map((file) => uploadFile(userId, file, folder));
  const results = await Promise.all(uploadPromises);
  return results;
};

/**
 * 3. Retrieve all media uploaded by the authenticated user with pagination & filter
 */
export const getUserMedia = async (userId, { page = 1, limit = 10, fileType }) => {
  const query = { user: userId };
  if (fileType) {
    query.fileType = fileType;
  }

  const numericPage = Math.max(1, Number(page));
  const numericLimit = Math.max(1, Math.min(100, Number(limit)));
  const skip = (numericPage - 1) * numericLimit;

  const [mediaList, total] = await Promise.all([
    Media.find(query).sort({ createdAt: -1 }).skip(skip).limit(numericLimit),
    Media.countDocuments(query),
  ]);

  return {
    media: mediaList,
    pagination: {
      total,
      page: numericPage,
      limit: numericLimit,
      totalPages: Math.ceil(total / numericLimit),
    },
  };
};

/**
 * 4. Get a single media item by ID (ensuring ownership)
 */
export const getMediaById = async (userId, mediaId) => {
  const media = await Media.findOne({ _id: mediaId, user: userId });
  if (!media) {
    throw ApiError.notFound("Media file not found or unauthorized");
  }
  return media;
};

/**
 * 5. Delete media from ImageKit cloud and MongoDB
 */
export const deleteMedia = async (userId, mediaId) => {
  const media = await Media.findOne({ _id: mediaId, user: userId });
  if (!media) {
    throw ApiError.notFound("Media file not found or unauthorized");
  }

  // Delete from ImageKit CDN
  try {
    await imageKit.files.delete(media.fileId);
  } catch (err) {
    console.error(`Warning: Failed to delete file ${media.fileId} from ImageKit:`, err.message);
  }

  // Delete record from MongoDB
  await Media.findByIdAndDelete(mediaId);

  return {
    id: mediaId,
    fileId: media.fileId,
    deleted: true,
  };
};
