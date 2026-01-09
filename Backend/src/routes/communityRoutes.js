import express from 'express';
import communityController from '../controllers/communityController.js';

const router = express.Router();

router.get('/stats', communityController.getCommunityStats);
router.get('/leaderboard', communityController.getCommunityLeaderboard);

export default router;
