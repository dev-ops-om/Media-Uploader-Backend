import * as authService from "./auth.service.js";

import ApiResponse from "../../common/utils/api-response.js";


const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    return ApiResponse.created(
      res,
      "User registered successfully. Please verify your email.",
      user
    );
  } catch (error) {
    next(error); // Passes any ApiError to our global error handling middleware
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    // Read token from URL parameter: /verify-email/:token
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
    // Set Refresh Token in a secure HTTP-Only Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Prevents browser JavaScript from reading the cookie (anti-XSS)
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // Protects against Cross-Site Request Forgery (CSRF)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    // Send access token and user info in response body
    return ApiResponse.ok(res, "Login successful", { user, accessToken });
  } catch (error) {
    next(error);
  }
};





export { register,verifyEmail ,login};