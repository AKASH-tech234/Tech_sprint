import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    activityType: {
      type: String,
      enum: [
        // Legacy activity types
        "issue_reported",
        "issue_verified",
        "issue_resolved",
        "comment_posted",
        "upvote_given",
        "badge_earned",
        "achievement_completed",
        "level_up",
        "tier_promoted",

        // Outcome-based gamification events
        "issue_verified_resolved", // +10 RP
        "after_photo_uploaded", // +8 RP
        "accurate_categorization", // +5 RP
        "false_resolution_flagged", // +12 RP
        "community_confirmed_report", // +15 RP

        // Penalty events
        "fake_issue_penalty", // -20 RP
        "spam_penalty", // -10 RP
        "cooldown_applied", // Spam cooldown

        // Role progression
        "role_upgraded", // Role change
        "role_downgraded", // Role demotion (RP decay)
      ],
      required: true,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    relatedIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
    },
  },
  {
    timestamps: true,
  }
);

// Index for user activity timeline
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ activityType: 1, createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
