//when using google authentication make sure to put client ID in frontend and backend 
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import cookieParser from "cookie-parser";

import authRoutes from "./src/routes/authRoutes.js";

// Load environment variables FIRST
dotenv.config();

const app = express();
const server = http.createServer(app);

// -------------------- Middleware --------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));

// ✅ REQUIRED for cookie-based auth
app.use(cookieParser());

// -------------------- Routes --------------------
// ✅ Correct base path for auth
app.use("/api/auth", authRoutes);

// Health check (optional but useful)
app.get("/", (req, res) => {
  res.send("CitizenVoice Backend is running 🚀");
});

// -------------------- Server --------------------
const start = async () => {
  try {
    const connectionDb = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MONGO Connected: ${connectionDb.connection.host}`);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB", err);
    process.exit(1);
  }
};

start();
 