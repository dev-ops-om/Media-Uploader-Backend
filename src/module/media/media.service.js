import { toFile } from "@imagekit/nodejs";
import imageKit from "../../common/config/imagekit.js";
import Media from "./media.model.js";
import ApiError from "../../common/utils/api-error.js";

// 1. Upload file using memory buffer directly to ImageKit
export const uploadMedia = async (userId, file, title) => {
  if (!file || !file.buffer) {
    throw ApiError.badRequest("Please select a file to upload");
  }

  // Convert buffer to ImageKit File format
  const fileObj = await toFile(file.buffer, file.originalname);

  // Upload to ImageKit
  const uploadResponse = await imageKit.files.upload({
    file: fileObj,
    fileName: `${Date.now()}-${file.originalname}`,
    folder: "/media-uploads",
  });

  // Save details in MongoDB
  const media = await Media.create({
    user: userId,
    title: title || file.originalname,
    fileUrl: uploadResponse.url,
    fileId: uploadResponse.fileId,
    thumbnailUrl: uploadResponse.thumbnailUrl || uploadResponse.url,
    mimeType: file.mimetype,
    size: file.size,
  });

  return media;
};

// 2. Get all uploaded files of the logged-in user
export const getAllUserMedia = async (userId) => {
  const mediaList = await Media.find({ user: userId }).sort({ createdAt: -1 });
  return mediaList;
};

// 3. Get single file by ID
export const getMediaById = async (mediaId) => {
  const media = await Media.findById(mediaId);
  if (!media) {
    throw ApiError.notFound("Media file not found");
  }
  return media;
};

// 4. Delete file from ImageKit and MongoDB
export const deleteMedia = async (userId, mediaId) => {
  // Find media ensuring it belongs to the logged-in user
  const media = await Media.findOne({ _id: mediaId, user: userId });
  if (!media) {
    throw ApiError.notFound("Media not found or you do not have permission to delete it");
  }

  // Delete from ImageKit cloud
  try {
    await imageKit.files.delete(media.fileId);
  } catch (error) {
    console.error("ImageKit delete error:", error.message);
  }

  // Delete from MongoDB
  await Media.findByIdAndDelete(mediaId);

  return { message: "Media deleted successfully", id: mediaId };
};
