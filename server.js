import app from "./src/app.js";
import dotenv from "dotenv";
import connectDB from "./src/common/config/db.js"
dotenv.config();

 const PORT=process.env.PORT || 8080;
const startServer=async ()=>{

    //rule of thumb: COnnect to the DB first then start listening
    await connectDB();

    app.listen(PORT,()=>{
         console.log(` Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`)
    });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});