import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Media must belong to a user"],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
    },
    fileId: {
      type: String,
      required: [true, "ImageKit fileId is required"],
      unique: true,
    },
    url: {
      type: String,
      required: [true, "File URL is required"],
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },
    fileType: {
      type: String,
      enum: ["image", "video", "audio", "document", "other"],
      default: "other",
    },
    folder: {
      type: String,
      default: "/media-uploads",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Media", mediaSchema);
