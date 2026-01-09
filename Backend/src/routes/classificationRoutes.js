import express from "express";
import { classificationController } from "../controllers/classificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  uploadIssueImages,
  uploadForClassification,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

/**
 * Classification Routes
 * Handles AI-powered image classification for civic issues
 */

// Health check - no auth required
router.get("/health", classificationController.healthCheck);

// Get available categories - no auth required
router.get("/categories", classificationController.getCategories);

// Classify uploaded image(s) - accepts both 'image' and 'images' field names
router.post(
  "/classify",
  protect,
  uploadForClassification,
  classificationController.classifyImages
);

// Get department for category
router.get("/department/:category", classificationController.getDepartment);

// Test classification endpoint (for development)
router.post(
  "/test",
  protect,
  uploadIssueImages,
  classificationController.testClassification
);

export default router;
