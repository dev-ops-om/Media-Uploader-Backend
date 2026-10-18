import express from "express";

const app=express();
//global route
// app.use(express.json())


app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// Basic Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is healthy!" });
});

export default app;