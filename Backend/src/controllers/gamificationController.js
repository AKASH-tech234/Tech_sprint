/**
 * Gamification Controller
 *
 * Handles API endpoints for outcome-driven gamification system.
 * Controllers only call services - no business logic here.
 */

import { outcomeGamificationService } from "../services/outcomeGamificationService.js";
import { gamificationService } from "../services/gamificationServices.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Badge definitions for display (from legacy service)
const BADGES = {
  first_reporter: {
    name: "First Reporter",
    description: "Reported your first issue",
    icon: "🎯",
    rarity: "common",
  },
  civic_enthusiast: {
    name: "Civic Enthusiast",
    description: "Reported 10 issues",
    icon: "⭐",
    rarity: "common",
  },
  community_guardian: {
    name: "Community Guardian",
    description: "Reported 50 issues",
    icon: "🛡️",
    rarity: "rare",
  },
  eagle_eye: {
    name: "Eagle Eye",
    description: "Verified 25 issues",
    icon: "👁️",
    rarity: "rare",
  },
  accuracy_master: {
    name: "Accuracy Master",
    description: "95% verification accuracy",
    icon: "🎯",
    rarity: "epic",
  },
  streak_master: {
    name: "Streak Master",
    description: "30-day activity streak",
    icon: "🔥",
    rarity: "epic",
  },
  change_maker: {
    name: "Change Maker",
    description: "100 issues reported",
    icon: "💎",
    rarity: "legendary",
  },
};

/**
 * Get user's gamification profile
 * GET /api/gamification/profile
 * Optional query param: ?districtId=xxx for community-scoped profile
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { districtId } = req.query;

  // Get outcome-based reputation profile
  const reputationProfile = await outcomeGamificationService.getUserProfile(
    userId,
    districtId
  );

  // Get legacy contribution profile for badges/achievements
  const legacyProfile = await gamificationService.getUserProfile(userId);

  const profile = {
    // Outcome-based reputation
    reputation: reputationProfile,

    // Legacy gamification (points, badges, achievements)
    legacy: {
      points: legacyProfile.points || 0,
      level: legacyProfile.level || 1,
      tier: legacyProfile.tier || "bronze",
      badges: legacyProfile.badges || [],
      achievements: legacyProfile.achievements || [],
      stats: legacyProfile.stats || {},
      impactScore: legacyProfile.impactScore || 0,
    },
  };

  res.json(new ApiResponse(200, profile, "Profile fetched successfully"));
});

/**
 * Get community-scoped leaderboard
 * GET /api/gamification/leaderboard/:districtId
 * Query params: ?limit=20
 */
export const getCommunityLeaderboard = asyncHandler(async (req, res) => {
  const { districtId } = req.params;
  const { limit = 20 } = req.query;

  if (!districtId) {
    throw new ApiError(400, "District ID is required");
  }

  const leaderboard = await outcomeGamificationService.getCommunityLeaderboard(
    districtId,
    parseInt(limit)
  );

  res.json(
    new ApiResponse(
      200,
      {
        leaderboard,
        districtId,
        total: leaderboard.length,
      },
      "Community leaderboard fetched successfully"
    )
  );
});

/**
 * Get legacy global leaderboard (for backward compatibility)
 * GET /api/gamification/leaderboard?timeframe=all&limit=100
 */
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { timeframe = "all", limit = 100 } = req.query;

  const leaderboard = await gamificationService.getLeaderboard(
    timeframe,
    parseInt(limit)
  );

  res.json(
    new ApiResponse(
      200,
      {
        leaderboard,
        timeframe,
        total: leaderboard.length,
      },
      "Leaderboard fetched successfully"
    )
  );
});

/**
 * Get user's RP history
 * GET /api/gamification/rp-history
 * Query params: ?districtId=xxx&limit=20
 */
export const getRPHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { districtId, limit = 20 } = req.query;

  const history = await outcomeGamificationService.getUserRPHistory(
    userId,
    districtId,
    parseInt(limit)
  );

  res.json(
    new ApiResponse(
      200,
      {
        history,
        total: history.length,
      },
      "RP history fetched"
    )
  );
});

/**
 * Get activity timeline
 * GET /api/gamification/activity?limit=20
 */
export const getActivityTimeline = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 20 } = req.query;

  const activities = await gamificationService.getActivityTimeline(
    userId,
    parseInt(limit)
  );

  res.json(
    new ApiResponse(
      200,
      {
        activities,
        total: activities.length,
      },
      "Activity timeline fetched"
    )
  );
});

/**
 * Get badges and achievements
 * GET /api/gamification/badges
 */
export const getBadgesAndAchievements = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await gamificationService.getUserProfile(userId);

  const availableBadges = Object.values(BADGES).map((badge) => ({
    ...badge,
    earned: profile.badges?.some((b) => b.name === badge.name) || false,
  }));

  const achievements = profile.achievements || [];

  res.json(
    new ApiResponse(
      200,
      {
        earnedBadges: profile.badges || [],
        availableBadges,
        achievements,
        completionPercentage:
          achievements.length > 0
            ? Math.round(
                (achievements.filter((a) => a.completed).length /
                  achievements.length) *
                  100
              )
            : 0,
      },
      "Badges and achievements fetched"
    )
  );
});

/**
 * Get community impact score
 * GET /api/gamification/impact/:districtId
 */
export const getCommunityImpactScore = asyncHandler(async (req, res) => {
  const { districtId } = req.params;

  if (!districtId) {
    throw new ApiError(400, "District ID is required");
  }

  const impactScore = await outcomeGamificationService.getCommunityImpactScore(
    districtId
  );

  res.json(new ApiResponse(200, impactScore, "Community impact score fetched"));
});

/**
 * Get stats comparison (legacy)
 * GET /api/gamification/compare/:userId
 */
export const compareWithUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { userId } = req.params;

  const [currentUser, compareUser] = await Promise.all([
    gamificationService.getUserProfile(currentUserId),
    gamificationService.getUserProfile(userId),
  ]);

  const comparison = {
    points: {
      you: currentUser.points || 0,
      them: compareUser.points || 0,
      difference: (currentUser.points || 0) - (compareUser.points || 0),
    },
    level: {
      you: currentUser.level || 1,
      them: compareUser.level || 1,
      difference: (currentUser.level || 1) - (compareUser.level || 1),
    },
    badges: {
      you: currentUser.badges?.length || 0,
      them: compareUser.badges?.length || 0,
      difference:
        (currentUser.badges?.length || 0) - (compareUser.badges?.length || 0),
    },
  };

  res.json(new ApiResponse(200, comparison, "Comparison completed"));
});

/**
 * Get role progression info
 * GET /api/gamification/roles
 */
export const getRoleProgression = asyncHandler(async (req, res) => {
  const roles = [
    {
      role: "resident",
      displayName: "Resident",
      threshold: 0,
      description: "Default role for all community members",
      icon: "🏠",
    },
    {
      role: "civic_helper",
      displayName: "Civic Helper",
      threshold: 50,
      description: "Active contributor with verified outcomes",
      icon: "🤝",
    },
    {
      role: "community_validator",
      displayName: "Community Validator",
      threshold: 120,
      description: "Trusted member who can verify issues",
      icon: "✅",
    },
    {
      role: "civic_champion",
      displayName: "Civic Champion",
      threshold: 300,
      description: "Community leader with exceptional contributions",
      icon: "🏆",
    },
  ];

  const rpActions = [
    { action: "Issue verified as resolved", points: 10 },
    { action: "Upload valid after-photo", points: 8 },
    { action: "Accurate issue categorization", points: 5 },
    { action: "Flag false resolution (confirmed)", points: 12 },
    { action: "Community-confirmed report", points: 15 },
  ];

  const penalties = [
    { action: "Fake/reopened issue", points: -20 },
    {
      action: "Spam reporting",
      points: -10,
      note: "Includes cooldown + RP decay",
    },
  ];

  res.json(
    new ApiResponse(
      200,
      {
        roles,
        rpActions,
        penalties,
        note: "Roles unlock responsibility, not authority. Cannot resolve issues alone.",
      },
      "Role progression info fetched"
    )
  );
});

export default {
  getUserProfile,
  getCommunityLeaderboard,
  getLeaderboard,
  getRPHistory,
  getActivityTimeline,
  getBadgesAndAchievements,
  getCommunityImpactScore,
  compareWithUser,
  getRoleProgression,
};
