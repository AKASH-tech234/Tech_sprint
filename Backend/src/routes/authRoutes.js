// Backend/src/routes/authRoutes.js
import express from "express";
import {
  signup,
  login,
  getCurrentUser,
  logout,
  googleAuth,
  checkAuth,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/check", checkAuth);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", protect, getCurrentUser);

export default router;
