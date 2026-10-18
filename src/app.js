import express from "express";
import ApiResponse from "./common/utils/api-response.js";
import ApiError from "./common/utils/api-error.js";


const app=express();
//global route
// app.use(express.json())


app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// Basic Health Check Route
app.get("/health", (req, res) => {
 return  ApiResponse.ok(res, "Server is healthy!", { uptime: process.uptime() });
});


// 404 handler for undefined routes
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});
// Global Error Handling Middleware (must have 4 arguments: err, req, res, next)
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