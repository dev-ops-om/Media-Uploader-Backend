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
export { register };