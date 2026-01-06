// Backend/src/routes/verificationRoutes.js
import express from 'express';
import { protect, restrictTo, rbac } from '../middleware/authMiddleware.js';
import {
  verifyIssue,
  getVerificationStats,
  getVerifierList,
  checkUserVerification,
  getUnverifiedIssuesInArea,
} from '../controllers/verificationController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Community verification routes
router.post('/issues/:issueId/verify', restrictTo('community'), verifyIssue);
router.get('/issues/:issueId/verification/stats', getVerificationStats);
router.get('/issues/:issueId/verification/verifiers', restrictTo('official', 'community'), getVerifierList);
router.get('/issues/:issueId/verification/check', checkUserVerification);

// Community specific routes
router.get('/community/unverified-issues', restrictTo('community'), getUnverifiedIssuesInArea);

export default router;
