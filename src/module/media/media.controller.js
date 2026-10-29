import * as mediaService from "./media.service.js";
import ApiResponse from "../../common/utils/api-response.js";
import ApiError from "../../common/utils/api-error.js";

/**
 * Upload single media file (Field name: "file")
 */
export const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest("No file uploaded. Please send a file with field name 'file'");
    }
    const folder = req.body.folder || "/media-uploads";
    const media = await mediaService.uploadFile(req.user.id, req.file, folder);
    return ApiResponse.created(res, "File uploaded successfully", media);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload multiple media files (Field name: "files")
 */
export const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw ApiError.badRequest("No files uploaded. Please send files with field name 'files'");
    }
    const folder = req.body.folder || "/media-uploads";
    const mediaList = await mediaService.uploadMultipleFiles(req.user.id, req.files, folder);
    return ApiResponse.created(res, "Files uploaded successfully", mediaList);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all media files uploaded by the authenticated user
 */
export const getAllMedia = async (req, res, next) => {
  try {
    const { page, limit, fileType } = req.query;
    const result = await mediaService.getUserMedia(req.user.id, { page, limit, fileType });
    return ApiResponse.ok(res, "Media files retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single media file by ID
 */
export const getMediaById = async (req, res, next) => {
  try {
    const media = await mediaService.getMediaById(req.user.id, req.params.id);
    return ApiResponse.ok(res, "Media file details retrieved successfully", media);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a media file by ID
 */
export const deleteMedia = async (req, res, next) => {
  try {
    const result = await mediaService.deleteMedia(req.user.id, req.params.id);
    return ApiResponse.ok(res, "Media file deleted successfully", result);
  } catch (error) {
    next(error);
  }
};
