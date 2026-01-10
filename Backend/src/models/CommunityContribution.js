import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  icon: String,
  rarity: {
    type: String,
    enum: ["common", "rare", "epic", "legendary"],
    default: "common",
  },
  earnedAt: {
    type: Date,
    default: Date.now,
  },
});

const achievementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "first_report",
      "first_verification",
      "streak_7",
      "streak_30",
      "issue_resolved",
      "top_reporter",
      "top_verifier",
      "community_hero",
      "accuracy_master",
    ],
    required: true,
  },
  progress: {
    current: { type: Number, default: 0 },
    target: { type: Number, required: true },
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
});

const contributionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Points and Level
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum", "diamond", "guardian"],
      default: "bronze",
    },

    // Statistics
    stats: {
      issuesReported: { type: Number, default: 0 },
      issuesVerified: { type: Number, default: 0 },
      accurateVerifications: { type: Number, default: 0 },
      issuesResolved: { type: Number, default: 0 },
      commentsPosted: { type: Number, default: 0 },
      upvotesReceived: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActiveDate: Date,
    },

    // Badges and Achievements
    badges: [badgeSchema],
    achievements: [achievementSchema],

    // Impact Metrics
    impactScore: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Leaderboard Rankings
    rankings: {
      overall: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for leaderboard queries
contributionSchema.index({ points: -1 });
contributionSchema.index({ impactScore: -1 });
contributionSchema.index({ "stats.issuesReported": -1 });
contributionSchema.index({ "stats.issuesVerified": -1 });
contributionSchema.index({ tier: 1, points: -1 });

// Methods
contributionSchema.methods.addPoints = function (amount, reason) {
  this.points += amount;
  this.updateLevel();
  this.updateTier();
  return { points: this.points, level: this.level, tier: this.tier };
};

contributionSchema.methods.updateLevel = function () {
  // Level formula: sqrt(points / 100)
  this.level = Math.floor(Math.sqrt(this.points / 100)) + 1;
};

contributionSchema.methods.updateTier = function () {
  if (this.points >= 10000) this.tier = "guardian";
  else if (this.points >= 5000) this.tier = "diamond";
  else if (this.points >= 2500) this.tier = "platinum";
  else if (this.points >= 1000) this.tier = "gold";
  else if (this.points >= 500) this.tier = "silver";
  else this.tier = "bronze";
};

contributionSchema.methods.updateStreak = function () {
  const today = new Date().setHours(0, 0, 0, 0);
  const lastActive = this.stats.lastActiveDate
    ? new Date(this.stats.lastActiveDate).setHours(0, 0, 0, 0)
    : 0;

  const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Same day, do nothing
    return;
  } else if (daysDiff === 1) {
    // Consecutive day, increment streak
    this.stats.currentStreak += 1;
  } else {
    // Streak broken
    this.stats.currentStreak = 1;
  }

  if (this.stats.currentStreak > this.stats.longestStreak) {
    this.stats.longestStreak = this.stats.currentStreak;
  }

  this.stats.lastActiveDate = new Date();
};

export default mongoose.model("CommunityContribution", contributionSchema);
