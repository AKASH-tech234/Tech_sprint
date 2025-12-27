// Backend/src/routes/authRoutes.js
import express from "express";
import {
  signup,
  login,
  getCurrentUser,
  logout,
  googleAuth,
  checkAuth,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/check", checkAuth);
router.post("/logout", logout);

// Protected routes
router.get("/me", protect, getCurrentUser);

export default router;
