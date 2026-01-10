import mongoose from "mongoose";

/**
 * CommunityReputation Model
 * Stores community-scoped reputation for each user
 * Following outcome-driven gamification principles:
 * - No points for activity alone
 * - Points only after community-verified outcomes
 * - No global leaderboards - all scoring is community-scoped
 */

const communityReputationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Community/District scoping
    districtId: {
      type: String,
      required: true,
    },

    // Total Reputation Points (community-scoped)
    totalRP: {
      type: Number,
      default: 0,
      min: 0, // RP cannot go negative (floor at 0)
    },

    // Role based on RP thresholds
    // Resident: default (0-49 RP)
    // Civic Helper: ≥50 RP
    // Community Validator: ≥120 RP
    // Civic Champion: ≥300 RP
    role: {
      type: String,
      enum: [
        "resident",
        "civic_helper",
        "community_validator",
        "civic_champion",
      ],
      default: "resident",
    },

    // RP thresholds for reference
    roleThresholds: {
      type: Map,
      of: Number,
      default: {
        resident: 0,
        civic_helper: 50,
        community_validator: 120,
        civic_champion: 300,
      },
    },

    // Statistics for this community
    stats: {
      issuesReported: { type: Number, default: 0 },
      issuesVerifiedResolved: { type: Number, default: 0 },
      falseResolutionsFlagged: { type: Number, default: 0 },
      communityConfirmedReports: { type: Number, default: 0 },
      afterPhotosUploaded: { type: Number, default: 0 },
      accurateCategorizations: { type: Number, default: 0 },

      // Penalty tracking
      fakeIssuesPenalties: { type: Number, default: 0 },
      spamPenalties: { type: Number, default: 0 },
      reopenedIssues: { type: Number, default: 0 },
    },

    // Cooldown for spam prevention
    spamCooldown: {
      active: { type: Boolean, default: false },
      expiresAt: { type: Date },
      reason: { type: String },
    },

    // Last activity for decay calculations
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index - one reputation record per user per community
communityReputationSchema.index({ user: 1, districtId: 1 }, { unique: true });

// Indexes for leaderboard queries (community-scoped)
communityReputationSchema.index({ districtId: 1, totalRP: -1 });
communityReputationSchema.index({ districtId: 1, role: 1 });

/**
 * Calculate role based on RP
 * Roles unlock responsibility, not authority
 */
communityReputationSchema.methods.calculateRole = function () {
  if (this.totalRP >= 300) {
    return "civic_champion";
  } else if (this.totalRP >= 120) {
    return "community_validator";
  } else if (this.totalRP >= 50) {
    return "civic_helper";
  }
  return "resident";
};

/**
 * Update role if RP changed
 */
communityReputationSchema.methods.updateRole = function () {
  const newRole = this.calculateRole();
  const oldRole = this.role;

  if (newRole !== oldRole) {
    this.role = newRole;
    return { upgraded: newRole > oldRole, oldRole, newRole };
  }

  return null;
};

/**
 * Add RP with floor protection (min 0)
 */
communityReputationSchema.methods.addRP = function (amount) {
  this.totalRP = Math.max(0, this.totalRP + amount);
  this.lastActivityAt = new Date();
  return this.updateRole();
};

/**
 * Check if user is in spam cooldown
 */
communityReputationSchema.methods.isInCooldown = function () {
  if (!this.spamCooldown.active) return false;
  if (new Date() > this.spamCooldown.expiresAt) {
    this.spamCooldown.active = false;
    return false;
  }
  return true;
};

/**
 * Apply spam cooldown
 */
communityReputationSchema.methods.applyCooldown = function (
  hours = 24,
  reason = "Spam detected"
) {
  this.spamCooldown = {
    active: true,
    expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    reason,
  };
};

export default mongoose.model("CommunityReputation", communityReputationSchema);
