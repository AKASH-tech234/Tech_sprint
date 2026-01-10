import mongoose from "mongoose";

/**
 * CommunityImpactScore Model
 * Tracks community-level impact metrics
 * Formula: ImpactScore = (Verified Resolutions × 2) - (Reopened Issues × 3) - (Avg Resolution Delay / SLA)
 *
 * - Community-level only
 * - Publicly readable
 * - Cached & recomputed periodically
 */

const communityImpactScoreSchema = new mongoose.Schema(
  {
    // District/Community identifier
    districtId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Display name
    displayName: {
      type: String,
      required: true,
    },

    // Computed Impact Score
    impactScore: {
      type: Number,
      default: 0,
    },

    // Component metrics
    metrics: {
      // Positive factors
      verifiedResolutions: { type: Number, default: 0 },
      totalIssuesReported: { type: Number, default: 0 },
      communityVerifications: { type: Number, default: 0 },

      // Negative factors
      reopenedIssues: { type: Number, default: 0 },
      fakeIssues: { type: Number, default: 0 },

      // Time metrics
      avgResolutionTimeHours: { type: Number, default: 0 },
      slaHours: { type: Number, default: 72 }, // Default SLA: 72 hours

      // Engagement
      activeContributors: { type: Number, default: 0 },
      totalRP: { type: Number, default: 0 }, // Sum of all user RP in community
    },

    // Breakdown by category
    categoryBreakdown: {
      type: Map,
      of: {
        reported: { type: Number, default: 0 },
        resolved: { type: Number, default: 0 },
        avgResolutionHours: { type: Number, default: 0 },
      },
    },

    // Role distribution in community
    roleDistribution: {
      residents: { type: Number, default: 0 },
      civicHelpers: { type: Number, default: 0 },
      communityValidators: { type: Number, default: 0 },
      civicChampions: { type: Number, default: 0 },
    },

    // Trend data (last 30 days)
    trend: {
      direction: {
        type: String,
        enum: ["up", "down", "stable"],
        default: "stable",
      },
      changePercent: { type: Number, default: 0 },
      previousScore: { type: Number, default: 0 },
    },

    // Cache metadata
    lastComputedAt: {
      type: Date,
      default: Date.now,
    },

    // Computation interval (in hours)
    computeIntervalHours: {
      type: Number,
      default: 6,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
communityImpactScoreSchema.index({ impactScore: -1 });
communityImpactScoreSchema.index({ lastComputedAt: 1 });

/**
 * Calculate the impact score using the formula
 */
communityImpactScoreSchema.methods.calculateScore = function () {
  const {
    verifiedResolutions,
    reopenedIssues,
    avgResolutionTimeHours,
    slaHours,
  } = this.metrics;

  // ImpactScore = (Verified Resolutions × 2) - (Reopened Issues × 3) - (Avg Resolution Delay / SLA)
  const resolutionScore = verifiedResolutions * 2;
  const reopenedPenalty = reopenedIssues * 3;
  const delayPenalty = slaHours > 0 ? avgResolutionTimeHours / slaHours : 0;

  const score = Math.max(0, resolutionScore - reopenedPenalty - delayPenalty);

  // Store previous score for trend
  this.trend.previousScore = this.impactScore;
  this.impactScore = Math.round(score * 100) / 100;

  // Calculate trend
  if (this.trend.previousScore > 0) {
    const change =
      ((this.impactScore - this.trend.previousScore) /
        this.trend.previousScore) *
      100;
    this.trend.changePercent = Math.round(change * 10) / 10;
    this.trend.direction = change > 1 ? "up" : change < -1 ? "down" : "stable";
  }

  this.lastComputedAt = new Date();
  return this.impactScore;
};

/**
 * Check if recomputation is needed
 */
communityImpactScoreSchema.methods.needsRecomputation = function () {
  const hoursSinceLastCompute =
    (Date.now() - this.lastComputedAt) / (1000 * 60 * 60);
  return hoursSinceLastCompute >= this.computeIntervalHours;
};

export default mongoose.model(
  "CommunityImpactScore",
  communityImpactScoreSchema
);
