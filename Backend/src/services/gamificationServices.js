import CommunityContribution from "../models/CommunityContribution.js";
import ActivityLog from "../models/ActivityLog.js";
import Issue from "../models/Issue.js";

// Points system configuration
const POINTS_CONFIG = {
  issue_reported: 10,
  issue_verified: 15,
  accurate_verification: 25,
  issue_resolved: 30,
  comment_posted: 3,
  upvote_received: 2,
  first_report: 50,
  first_verification: 50,
  streak_7_days: 100,
  streak_30_days: 500,
  top_monthly_reporter: 200,
  top_monthly_verifier: 200,
};

// Badge definitions
const BADGES = {
  first_reporter: {
    name: "First Reporter",
    description: "Reported your first issue",
    icon: "🎯",
    rarity: "common",
    criteria: { issuesReported: 1 },
  },
  civic_enthusiast: {
    name: "Civic Enthusiast",
    description: "Reported 10 issues",
    icon: "⭐",
    rarity: "common",
    criteria: { issuesReported: 10 },
  },
  community_guardian: {
    name: "Community Guardian",
    description: "Reported 50 issues",
    icon: "🛡️",
    rarity: "rare",
    criteria: { issuesReported: 50 },
  },
  eagle_eye: {
    name: "Eagle Eye",
    description: "Verified 25 issues",
    icon: "👁️",
    rarity: "rare",
    criteria: { issuesVerified: 25 },
  },
  accuracy_master: {
    name: "Accuracy Master",
    description: "95% verification accuracy",
    icon: "🎯",
    rarity: "epic",
    criteria: { verificationAccuracy: 0.95 },
  },
  streak_master: {
    name: "Streak Master",
    description: "30-day activity streak",
    icon: "🔥",
    rarity: "epic",
    criteria: { currentStreak: 30 },
  },
  change_maker: {
    name: "Change Maker",
    description: "100 issues reported",
    icon: "💎",
    rarity: "legendary",
    criteria: { issuesReported: 100 },
  },
};

class GamificationService {
  /**
   * Award points for an activity
   */
  async awardPoints(userId, activityType, metadata = {}) {
    console.log(
      `🎮 [Gamification] Awarding points for ${activityType} to user ${userId}`
    );

    // Get or create contribution record
    let contribution = await CommunityContribution.findOne({ user: userId });

    if (!contribution) {
      contribution = await CommunityContribution.create({ user: userId });
    }

    // Calculate points
    const points = POINTS_CONFIG[activityType] || 0;

    if (points === 0) {
      console.warn(
        `⚠️ [Gamification] No points configured for ${activityType}`
      );
      return contribution;
    }

    // Update points and level
    const previousLevel = contribution.level;
    const result = contribution.addPoints(points, activityType);

    // Update statistics
    await this.updateStatistics(contribution, activityType, metadata);

    // Check for badges and achievements
    await this.checkBadges(contribution);
    await this.checkAchievements(contribution);

    // Log activity
    await ActivityLog.create({
      user: userId,
      activityType,
      pointsEarned: points,
      metadata,
      relatedIssue: metadata.issueId || null,
    });

    // Save contribution
    await contribution.save();

    // Check for level up
    if (contribution.level > previousLevel) {
      await this.handleLevelUp(userId, contribution.level);
    }

    console.log(
      `✅ [Gamification] Awarded ${points} points. Total: ${contribution.points}`
    );

    return contribution;
  }

  /**
   * Update user statistics
   */
  async updateStatistics(contribution, activityType, metadata) {
    switch (activityType) {
      case "issue_reported":
        contribution.stats.issuesReported += 1;
        break;
      case "issue_verified":
        contribution.stats.issuesVerified += 1;
        if (metadata.accurate) {
          contribution.stats.accurateVerifications += 1;
        }
        break;
      case "issue_resolved":
        contribution.stats.issuesResolved += 1;
        break;
      case "comment_posted":
        contribution.stats.commentsPosted += 1;
        break;
      case "upvote_received":
        contribution.stats.upvotesReceived += 1;
        break;
    }

    // Update streak
    contribution.updateStreak();

    // Calculate impact score
    this.calculateImpactScore(contribution);
  }

  /**
   * Calculate overall impact score
   */
  calculateImpactScore(contribution) {
    const { stats } = contribution;

    let score = 0;
    score += stats.issuesReported * 5;
    score += stats.issuesVerified * 7;
    score += stats.accurateVerifications * 10;
    score += stats.issuesResolved * 15;
    score += stats.currentStreak * 3;
    score += stats.upvotesReceived * 2;

    contribution.impactScore = score;
  }

  /**
   * Check and award badges
   */
  async checkBadges(contribution) {
    const earnedBadges = [];

    for (const [badgeId, badgeConfig] of Object.entries(BADGES)) {
      // Check if already earned
      const hasEarned = contribution.badges.some(
        (b) => b.name === badgeConfig.name
      );
      if (hasEarned) continue;

      // Check criteria
      let meetsRequirements = true;

      if (badgeConfig.criteria.issuesReported) {
        meetsRequirements =
          contribution.stats.issuesReported >=
          badgeConfig.criteria.issuesReported;
      }

      if (badgeConfig.criteria.issuesVerified) {
        meetsRequirements =
          meetsRequirements &&
          contribution.stats.issuesVerified >=
            badgeConfig.criteria.issuesVerified;
      }

      if (badgeConfig.criteria.currentStreak) {
        meetsRequirements =
          meetsRequirements &&
          contribution.stats.currentStreak >=
            badgeConfig.criteria.currentStreak;
      }

      if (badgeConfig.criteria.verificationAccuracy) {
        const accuracy =
          contribution.stats.issuesVerified > 0
            ? contribution.stats.accurateVerifications /
              contribution.stats.issuesVerified
            : 0;
        meetsRequirements =
          meetsRequirements &&
          accuracy >= badgeConfig.criteria.verificationAccuracy;
      }

      // Award badge
      if (meetsRequirements) {
        contribution.badges.push({
          name: badgeConfig.name,
          description: badgeConfig.description,
          icon: badgeConfig.icon,
          rarity: badgeConfig.rarity,
          earnedAt: new Date(),
        });

        earnedBadges.push(badgeConfig);

        // Award bonus points
        await this.awardBonusPoints(contribution.user, badgeConfig.rarity);
      }
    }

    return earnedBadges;
  }

  /**
   * Award bonus points for badge rarity
   */
  async awardBonusPoints(userId, rarity) {
    const bonusPoints = {
      common: 25,
      rare: 50,
      epic: 100,
      legendary: 250,
    };

    const points = bonusPoints[rarity] || 0;
    if (points > 0) {
      await ActivityLog.create({
        user: userId,
        activityType: "badge_earned",
        pointsEarned: points,
        metadata: { rarity },
      });
    }
  }

  /**
   * Check and update achievements
   */
  async checkAchievements(contribution) {
    // Define achievements
    const achievements = [
      {
        type: "first_report",
        target: 1,
        checkFn: () => contribution.stats.issuesReported >= 1,
      },
      {
        type: "first_verification",
        target: 1,
        checkFn: () => contribution.stats.issuesVerified >= 1,
      },
      {
        type: "streak_7",
        target: 7,
        checkFn: () => contribution.stats.currentStreak >= 7,
      },
      {
        type: "streak_30",
        target: 30,
        checkFn: () => contribution.stats.currentStreak >= 30,
      },
      {
        type: "top_reporter",
        target: 100,
        checkFn: () => contribution.stats.issuesReported >= 100,
      },
      {
        type: "top_verifier",
        target: 100,
        checkFn: () => contribution.stats.issuesVerified >= 100,
      },
    ];

    for (const achievement of achievements) {
      // Find existing achievement
      let existingAchievement = contribution.achievements.find(
        (a) => a.type === achievement.type
      );

      if (!existingAchievement) {
        // Create new achievement
        contribution.achievements.push({
          type: achievement.type,
          progress: { current: 0, target: achievement.target },
          completed: false,
        });
        existingAchievement =
          contribution.achievements[contribution.achievements.length - 1];
      }

      // Update progress
      if (!existingAchievement.completed && achievement.checkFn()) {
        existingAchievement.completed = true;
        existingAchievement.completedAt = new Date();
        existingAchievement.progress.current = achievement.target;

        // Award achievement points
        await this.awardAchievementPoints(contribution.user, achievement.type);
      }
    }
  }

  /**
   * Award points for achievement completion
   */
  async awardAchievementPoints(userId, achievementType) {
    const achievementPoints = {
      first_report: 50,
      first_verification: 50,
      streak_7: 100,
      streak_30: 500,
      top_reporter: 200,
      top_verifier: 200,
    };

    const points = achievementPoints[achievementType] || 0;
    if (points > 0) {
      await ActivityLog.create({
        user: userId,
        activityType: "achievement_completed",
        pointsEarned: points,
        metadata: { achievementType },
      });
    }
  }

  /**
   * Handle level up event
   */
  async handleLevelUp(userId, newLevel) {
    console.log(`🎉 [Gamification] User ${userId} leveled up to ${newLevel}!`);

    await ActivityLog.create({
      user: userId,
      activityType: "level_up",
      pointsEarned: newLevel * 10,
      metadata: { level: newLevel },
    });

    // You can add notifications here
  }

  /**
   * Get user's gamification profile
   */
  async getUserProfile(userId) {
    const contribution = await CommunityContribution.findOne({
      user: userId,
    }).populate("user", "username email avatar");

    if (!contribution) {
      return {
        points: 0,
        level: 1,
        tier: "bronze",
        badges: [],
        achievements: [],
        stats: {},
      };
    }

    return contribution;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(timeframe = "all", limit = 100) {
    let matchQuery = {};

    if (timeframe === "weekly") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      matchQuery = { "stats.lastActiveDate": { $gte: weekAgo } };
    } else if (timeframe === "monthly") {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      matchQuery = { "stats.lastActiveDate": { $gte: monthAgo } };
    }

    const leaderboard = await CommunityContribution.find(matchQuery)
      .populate("user", "username avatar fullAddress")
      .sort({ points: -1 })
      .limit(limit)
      .lean();

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user._id,
      username: entry.user.username,
      avatar: entry.user.avatar,
      area: entry.user.fullAddress?.area || "N/A",
      points: entry.points,
      level: entry.level,
      tier: entry.tier,
      stats: entry.stats,
      badges: entry.badges.length,
      impactScore: entry.impactScore,
    }));
  }

  /**
   * Get user's activity timeline
   */
  async getActivityTimeline(userId, limit = 20) {
    const activities = await ActivityLog.find({ user: userId })
      .populate("relatedIssue", "issueId title")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return activities;
  }

  /**
   * Calculate next level requirements
   */
  getNextLevelRequirements(currentLevel) {
    const nextLevel = currentLevel + 1;
    const pointsRequired = Math.pow(nextLevel - 1, 2) * 100;

    return {
      nextLevel,
      pointsRequired,
      formula: "Points = (Level - 1)² × 100",
    };
  }
}

export const gamificationService = new GamificationService();
export default gamificationService;
