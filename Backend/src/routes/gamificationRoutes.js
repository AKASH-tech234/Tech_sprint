import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getUserProfile,
  getCommunityLeaderboard,
  getLeaderboard,
  getRPHistory,
  getActivityTimeline,
  getBadgesAndAchievements,
  getCommunityImpactScore,
  compareWithUser,
  getRoleProgression,
} from "../controllers/gamificationController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// User profile (supports ?districtId for community-scoped)
router.get("/profile", getUserProfile);

// Role progression info (public info about RP system)
router.get("/roles", getRoleProgression);

// Community-scoped leaderboard (outcome-based)
router.get("/leaderboard/:districtId", getCommunityLeaderboard);

// Legacy global leaderboard (for backward compatibility)
router.get("/leaderboard", getLeaderboard);

// RP history (supports ?districtId)
router.get("/rp-history", getRPHistory);

// Activity timeline
router.get("/activity", getActivityTimeline);

// Badges and achievements
router.get("/badges", getBadgesAndAchievements);

// Community impact score
router.get("/impact/:districtId", getCommunityImpactScore);

// Compare with another user
router.get("/compare/:userId", compareWithUser);

export default router;
