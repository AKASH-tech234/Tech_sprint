// Backend/index.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("Backend Environment loaded:");
console.log("  - PORT:", process.env.PORT);
console.log("  - NODE_ENV:", process.env.NODE_ENV);
console.log("  - MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "NOT SET");
console.log("  - JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "NOT SET");
console.log("  - GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "NOT SET");

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./src/db/index.js";
import authRoutes from "./src/routes/authRoutes.js";

const app = express();

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

// Health check
app.get("/", (req, res) => {
  res.send("CitizenVoice API is running");
});

// Routes
app.use("/api/auth", authRoutes);


// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("Server running on http://localhost:" + PORT);
      console.log("API Docs available at http://localhost:" + PORT + "/api");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();