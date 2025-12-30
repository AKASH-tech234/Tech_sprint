//when using google authentication make sure to put client ID in frontend and backend 
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import issueRoutes from "./src/routes/issueRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import officialRoutes from "./src/routes/officialRoutes.js";


import http from "http";
import { Server } from "socket.io";


// Load environment variables FIRST
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'issues');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  },
});



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

// ✅ Serve static files (for local uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------- Routes --------------------
// ✅ Correct base path for auth
app.use("/api/auth", authRoutes);

app.use("/api/issues", issueRoutes);

// Official dashboard routes
app.use("/api/officials", officialRoutes);

// Health check (optional but useful)
app.get("/", (req, res) => {
  res.send("CitizenVoice Backend is running 🚀");
});

// -------------------- Error Handling --------------------
// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File too large. Maximum size is 5MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Too many files. Maximum is 5 files.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
  
  // Custom error handling
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
  
  // General error handling
  console.error('❌ Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit the process, just log the error
});


io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // User joins their private room
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });

  // Send message
  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
    io.to(receiverId).emit("receiveMessage", {
      senderId,
      message,
      createdAt: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});


start();
 