import express from 'express';
import communityController from '../controllers/communityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no auth required for viewing stats)
router.get('/stats', communityController.getCommunityStats);
router.get('/leaderboard', communityController.getCommunityLeaderboard);
router.get('/issues', communityController.getCommunityIssues);
router.get('/heatmap', communityController.getDistrictHeatmap);

// Protected routes (auth required)
router.get('/chat', protect, communityController.getCommunityChat);
router.post('/chat', protect, communityController.sendCommunityMessage);
router.post('/chat/:messageId/react', protect, communityController.reactToMessage);

export default router;
