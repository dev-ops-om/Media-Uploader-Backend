import * as authService from "./auth.service.js";
import ApiResponse from "../../common/utils/api-response.js";
import ApiError from "../../common/utils/api-error.js";

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    return ApiResponse.created(
      res,
      "User registered successfully. Please verify your email.",
      user
    );
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    await authService.verifyEmail(token);
    return ApiResponse.ok(res, "Email verified successfully! You can now log in.");
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return ApiResponse.ok(res, "Login successful", { user, accessToken });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return ApiResponse.ok(res, "User profile retrieved successfully", user);
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const { accessToken } = await authService.refresh(token);
    return ApiResponse.ok(res, "Access token refreshed successfully", { accessToken });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return ApiResponse.ok(res, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      throw ApiError.badRequest("No file uploaded. Please send a file with field name 'avatar'");
    }
    const result = await authService.avatarUpload(req.user.id, file);
    return ApiResponse.ok(res, "Avatar uploaded successfully", result);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    return ApiResponse.ok(res, "Password reset email sent successfully");
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    await authService.resetPassword(token, password);
    return ApiResponse.ok(res, "Password reset successful. You can now log in with your new password.");
  } catch (error) {
    next(error);
  }
};

export {
  register,
  verifyEmail,
  login,
  getMe,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  uploadAvatar,
};
