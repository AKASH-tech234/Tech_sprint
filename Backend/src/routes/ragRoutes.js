import express from "express";
import {
  protect,
  optionalAuth,
  restrictTo,
} from "../middleware/authMiddleware.js";
import {
  explainQuery,
  getRagStatus,
  getAssistance,
  getRecommendations,
  chatWithAssistant,
} from "../controllers/ragController.js";

const router = express.Router();

// Public routes (with optional auth for better responses)
router.get("/status", getRagStatus);

// Routes with optional auth (works for both logged in and anonymous)
router.post("/explain", optionalAuth, explainQuery);

// Protected routes (require authentication)
router.use(protect);

// Get AI assistance for issue reporting
router.post("/assistance", getAssistance);

// Get verification recommendations (community only)
router.get("/recommendations", restrictTo("community"), getRecommendations);

// Chat interface
router.post("/chat", chatWithAssistant);

export default router;
