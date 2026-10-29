import dns from "node:dns";
// Resolve cloud SRV records reliably across all network environments
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/common/config/db.js";

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB first
    await connectDB();

    // 2. Start Express Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
