import mongoose from "mongoose";

/**
 * ReputationEvent Model
 * Tracks individual RP (Reputation Points) events for auditing and transparency
 * Each event is community-scoped and linked to a verified outcome
 */
const reputationEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Community/District scoping - RP is per-community
    districtId: {
      type: String,
      required: true,
      index: true,
    },

    // Event type determines points
    eventType: {
      type: String,
      enum: [
        // Positive events (outcome-based only)
        "issue_verified_resolved", // +10 RP - Issue verified as resolved
        "after_photo_uploaded", // +8 RP  - Valid after-photo upload
        "accurate_categorization", // +5 RP  - Accurate issue categorization
        "false_resolution_flagged", // +12 RP - Flag false resolution (confirmed)
        "community_confirmed_report", // +15 RP - Community-confirmed report

        // Penalty events
        "fake_issue_penalty", // -20 RP - Fake or reopened issue
        "spam_penalty", // -10 RP - Spam reporting

        // Role-related
        "role_upgrade", // 0 RP - Role change notification
      ],
      required: true,
    },

    // Points awarded (positive) or deducted (negative)
    points: {
      type: Number,
      required: true,
    },

    // Related entities for audit trail
    relatedIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
    },

    relatedVerification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityVerification",
    },

    // Verification quorum met (must be true for RP award)
    quorumMet: {
      type: Boolean,
      default: false,
    },

    // Idempotency key to prevent duplicate awards
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Additional metadata for audit
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Who/what triggered this event
    triggeredBy: {
      type: String,
      enum: ["system", "verification", "official", "community_vote"],
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
reputationEventSchema.index({ user: 1, districtId: 1 });
reputationEventSchema.index({ eventType: 1, createdAt: -1 });
reputationEventSchema.index({ districtId: 1, createdAt: -1 });

export default mongoose.model("ReputationEvent", reputationEventSchema);
