import * as mediaService from "./media.service.js";
import ApiResponse from "../../common/utils/api-response.js";
import ApiError from "../../common/utils/api-error.js";

// Upload a media file
export const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest("No file selected. Please attach a file with field name 'file'");
    }

    const media = await mediaService.uploadMedia(req.user.id, req.file, req.body.title);
    return ApiResponse.created(res, "File uploaded successfully", media);
  } catch (error) {
    next(error);
  }
};

// Get all files for the logged-in user
export const getAllMedia = async (req, res, next) => {
  try {
    const mediaList = await mediaService.getAllUserMedia(req.user.id);
    return ApiResponse.ok(res, "Media files fetched successfully", mediaList);
  } catch (error) {
    next(error);
  }
};

// Get a single file by ID
export const getMediaById = async (req, res, next) => {
  try {
    const media = await mediaService.getMediaById(req.params.id);
    return ApiResponse.ok(res, "Media details fetched successfully", media);
  } catch (error) {
    next(error);
  }
};

// Delete a file
export const deleteMedia = async (req, res, next) => {
  try {
    const result = await mediaService.deleteMedia(req.user.id, req.params.id);
    return ApiResponse.ok(res, "Media deleted successfully", result);
  } catch (error) {
    next(error);
  }
};
