// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";

// // 🔥 MUST BE FIRST — BEFORE ANY OTHER IMPORTS
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, ".env") });



// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// // import dotenv from "dotenv";
// import http from "http";
// import { Server } from "socket.io";
// import cookieParser from "cookie-parser";
// // import path from "path";
// // import { fileURLToPath } from "url";
// import multer from "multer";
// import fs from "fs";


// 🔥 LOAD ENV FIRST — BEFORE EVERYTHING


//import "./env.js";

// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import http from "http";
// import { Server } from "socket.io";
// import cookieParser from "cookie-parser";
// import path from "path";
// import { fileURLToPath } from "url";
// import multer from "multer";
// import fs from "fs";


import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* ✅ FIX FOR ES MODULE __dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import issueRoutes from "./src/routes/issueRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import officialRoutes from "./src/routes/officialRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import verificationRoutes from "./src/routes/verificationRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";

import Message from "./src/models/message.js";



// Load environment variables FIRST
// dotenv.config({ path: path.join(__dirname, ".env") });


// // Get __dirname equivalent in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads", "issues");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Created uploads directory");
}

// Create profiles uploads directory
const profilesDir = path.join(__dirname, "uploads", "profiles");
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
  console.log("📁 Created profiles uploads directory");
}

const app = express();
const server = http.createServer(app);

// -------------------- SOCKET.IO --------------------
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  },
});

// Track online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(" Socket connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    // Also join a user-specific room for notifications
    socket.join(`user_${userId}`);
    onlineUsers.set(userId, socket.id);
    console.log(` User ${userId} joined room`);
    
    // Broadcast user online status
    io.emit("userOnline", userId);
  });

  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    try {
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        message,
        read: false,
      });

      const messageData = {
        _id: newMessage._id,
        senderId,
        receiverId,
        message,
        createdAt: newMessage.createdAt,
      };

      // Send to receiver
      io.to(receiverId).emit("receiveMessage", messageData);
      
      // Also send back to sender for confirmation
      io.to(senderId).emit("messageSent", messageData);
    } catch (error) {
      console.error(" Message save failed:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("userTyping", { userId: senderId });
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("userStoppedTyping", { userId: senderId });
  });

  socket.on("disconnect", () => {
    // Find and remove user from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit("userOffline", userId);
        break;
      }
    }
    console.log(" Socket disconnected:", socket.id);
  });
});

// -------------------- Middleware --------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));
app.use(cookieParser());

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------- Routes --------------------
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/officials", officialRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/notifications", notificationRoutes);

// Make io accessible in controllers
app.set('io', io);


app.get("/", (req, res) => {
  res.send("CitizenVoice Backend is running 🚀");
});

// -------------------- Error Handling --------------------
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum is 5 files.",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  console.error(" Error:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// -------------------- Server --------------------
const start = async () => {
  try {
    const connectionDb = await mongoose.connect(process.env.MONGO_URI);
    console.log(` MONGO Connected: ${connectionDb.connection.host}`);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(" Failed to connect to MongoDB", err);
    process.exit(1);
  }
};

// Process safety
process.on("unhandledRejection", (reason) => {
  console.error(" Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});



start();
