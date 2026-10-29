import User from "./auth.model.js";
import ApiError from "../../common/utils/api-error.js";
import {
  generateResetToken,
  hashToken,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "../../common/utils/jwt.utils.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "../../common/config/email.js";
import imageKit from "../../common/config/imagekit.js";
import { toFile } from "@imagekit/nodejs";

const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("Email is already registered");
  }

  const { rawToken, hashedToken } = generateResetToken();

  const user = await User.create({
    name,
    email,
    password,
    role,
    verificationToken: hashedToken,
  });

  try {
    await sendVerificationEmail(email, rawToken);
  } catch (err) {
    console.error("Failed to send verification email:", err.message);
  }

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.verificationToken;
  return userObj;
};

const verifyEmail = async (token) => {
  const trimmed = String(token).trim();
  if (!trimmed) {
    throw ApiError.badRequest("Verification token is required");
  }

  const hashedInput = hashToken(trimmed);
  let user = await User.findOne({ verificationToken: hashedInput }).select("+verificationToken");

  if (!user) {
    user = await User.findOne({ verificationToken: trimmed }).select("+verificationToken");
  }

  if (!user) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  await User.findByIdAndUpdate(user._id, {
    $set: { isVerified: true },
    $unset: { verificationToken: 1 },
  });

  return true;
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });

  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  return { user: userObj, accessToken, refreshToken };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user;
};

const refresh = async (token) => {
  if (!token) {
    throw ApiError.unauthorized("Refresh Token is required");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired refresh token. Please log in again.");
  }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== hashToken(token)) {
    throw ApiError.unauthorized("Invalid refresh token. Please log in again.");
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  return { accessToken };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};

// Simple Avatar Upload using in-memory buffer
const avatarUpload = async (userId, file) => {
  if (!file || !file.buffer) {
    throw ApiError.badRequest("Please select an avatar image to upload");
  }

  // Convert buffer to ImageKit File format
  const fileObj = await toFile(file.buffer, file.originalname);

  // Upload to ImageKit folder /user-avatars
  const uploadResponse = await imageKit.files.upload({
    file: fileObj,
    fileName: `avatar-${userId}-${Date.now()}-${file.originalname}`,
    folder: "/user-avatars",
  });

  // Save new avatar URL to user profile in MongoDB
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { avatar: uploadResponse.url },
    { new: true }
  ).select("-password");

  return {
    avatarUrl: uploadResponse.url,
    fileId: uploadResponse.fileId,
    user: updatedUser,
  };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw ApiError.notFound("No account found with that email address");
  }

  const { rawToken, hashedToken } = generateResetToken();
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  try {
    await sendResetPasswordEmail(email, rawToken);
  } catch (err) {
    console.error("Failed to send reset email:", err.message);
  }
};

const resetPassword = async (token, newPassword) => {
  const hashedToken = hashToken(token);
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw ApiError.badRequest("Invalid or expired password reset token");
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};

export {
  register,
  verifyEmail,
  login,
  getMe,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  avatarUpload,
};
