import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import ApiResponse from "./common/utils/api-response.js";
import ApiError from "./common/utils/api-error.js";
import authRoutes from "./module/auth/auth.routes.js";
import mediaRoutes from "./module/media/media.routes.js";

const app = express();

// Global Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Basic Health Check Route
app.get("/health", (req, res) => {
  return ApiResponse.ok(res, "Server is healthy!", {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/media", mediaRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;
