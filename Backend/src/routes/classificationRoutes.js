import express from 'express';
import { classificationController } from '../controllers/classificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadIssueImages } from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * Classification Routes
 * Handles AI-powered image classification for civic issues
 */

// Classify uploaded image(s)
router.post(
  '/classify',
  protect,
  uploadIssueImages,
  classificationController.classifyImages
);

// Get department for category
router.get(
  '/department/:category',
  classificationController.getDepartment
);

// Test classification endpoint (for development)
router.post(
  '/test',
  protect,
  uploadIssueImages,
  classificationController.testClassification
);

export default router;
