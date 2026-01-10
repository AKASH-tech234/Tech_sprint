/**
 * Outcome-Driven Gamification Service
 *
 * CORE PRINCIPLES:
 * - No points for activity alone
 * - Points ONLY after community-verified outcomes
 * - No global leaderboards (all scoring is community-scoped)
 *
 * RP (Reputation Points) System:
 * +10 RP - Issue verified as resolved
 * +8 RP  - Upload valid after-photo
 * +5 RP  - Accurate issue categorization
 * +12 RP - Flag false resolution (confirmed)
 * +15 RP - Community-confirmed report
 *
 * Penalties:
 * -20 RP - Fake/reopened issue
 * -10 RP - Spam reporting + cooldown + RP decay
 *
 * Role Progression (RP Thresholds):
 * Resident: default (0-49 RP)
 * Civic Helper: ≥50 RP
 * Community Validator: ≥120 RP
 * Civic Champion: ≥300 RP
 */

import CommunityReputation from "../models/CommunityReputation.js";
import ReputationEvent from "../models/ReputationEvent.js";
import CommunityImpactScore from "../models/CommunityImpactScore.js";
import ActivityLog from "../models/ActivityLog.js";
import Issue from "../models/Issue.js";
import mongoose from "mongoose";

// RP Configuration - MANDATORY points (do not change)
const RP_CONFIG = {
  // Positive outcomes
  issue_verified_resolved: 10,
  after_photo_uploaded: 8,
  accurate_categorization: 5,
  false_resolution_flagged: 12,
  community_confirmed_report: 15,

  // Penalties
  fake_issue_penalty: -20,
  spam_penalty: -10,
};

// Role thresholds
const ROLE_THRESHOLDS = {
  resident: 0,
  civic_helper: 50,
  community_validator: 120,
  civic_champion: 300,
};

// Verification quorum (minimum verifications needed)
const VERIFICATION_QUORUM = 3;

class OutcomeGamificationService {
  /**
   * ========================================
   * CORE RP AWARDING METHODS
   * ========================================
   */

  /**
   * Award RP for issue verified as resolved
   * Only awarded AFTER verification quorum is met
   * @param {string} userId - User who reported the issue
   * @param {string} issueId - Issue that was resolved
   * @param {string} districtId - Community district
   * @returns {Object} Result with RP awarded and role changes
   */
  async awardIssueVerifiedResolved(userId, issueId, districtId) {
    const eventType = "issue_verified_resolved";
    const points = RP_CONFIG[eventType];

    // Generate idempotency key
    const idempotencyKey = `${eventType}_${userId}_${issueId}`;

    // Check for duplicate
    if (await this._isDuplicate(idempotencyKey)) {
      console.log(
        `⚠️ [Gamification] Duplicate RP award prevented: ${idempotencyKey}`
      );
      return { success: false, reason: "Already awarded" };
    }

    // Verify issue has met quorum
    const issue = await Issue.findById(issueId);
    if (!issue?.gamification?.quorumMet) {
      console.log(`⚠️ [Gamification] Quorum not met for issue ${issueId}`);
      return { success: false, reason: "Verification quorum not met" };
    }

    // Award RP
    return this._awardRP(userId, districtId, eventType, points, {
      idempotencyKey,
      relatedIssue: issueId,
      quorumMet: true,
    });
  }

  /**
   * Award RP for valid after-photo upload
   * Only after photo is verified by community
   */
  async awardAfterPhotoUploaded(userId, issueId, districtId) {
    const eventType = "after_photo_uploaded";
    const points = RP_CONFIG[eventType];
    const idempotencyKey = `${eventType}_${userId}_${issueId}`;

    if (await this._isDuplicate(idempotencyKey)) {
      return { success: false, reason: "Already awarded" };
    }

    const issue = await Issue.findById(issueId);
    if (!issue?.gamification?.afterPhotoVerified) {
      return { success: false, reason: "After-photo not verified" };
    }

    return this._awardRP(userId, districtId, eventType, points, {
      idempotencyKey,
      relatedIssue: issueId,
    });
  }

  /**
   * Award RP for accurate issue categorization
   * Determined by community verification consensus
   */
  async awardAccurateCategorization(userId, issueId, districtId) {
    const eventType = "accurate_categorization";
    const points = RP_CONFIG[eventType];
    const idempotencyKey = `${eventType}_${userId}_${issueId}`;

    if (await this._isDuplicate(idempotencyKey)) {
      return { success: false, reason: "Already awarded" };
    }

    const issue = await Issue.findById(issueId);
    if (!issue?.gamification?.categoryAccurate) {
      return { success: false, reason: "Category accuracy not confirmed" };
    }

    return this._awardRP(userId, districtId, eventType, points, {
      idempotencyKey,
      relatedIssue: issueId,
    });
  }

  /**
   * Award RP for flagging false resolution (after confirmation)
   */
  async awardFalseResolutionFlagged(userId, issueId, districtId) {
    const eventType = "false_resolution_flagged";
    const points = RP_CONFIG[eventType];
    const idempotencyKey = `${eventType}_${userId}_${issueId}`;

    if (await this._isDuplicate(idempotencyKey)) {
      return { success: false, reason: "Already awarded" };
    }

    return this._awardRP(userId, districtId, eventType, points, {
      idempotencyKey,
      relatedIssue: issueId,
      quorumMet: true,
    });
  }

  /**
   * Award RP for community-confirmed report
   * Awarded to reporter when their issue is confirmed by quorum
   */
  async awardCommunityConfirmedReport(userId, issueId, districtId) {
    const eventType = "community_confirmed_report";
    const points = RP_CONFIG[eventType];
    const idempotencyKey = `${eventType}_${userId}_${issueId}`;

    if (await this._isDuplicate(idempotencyKey)) {
      return { success: false, reason: "Already awarded" };
    }

    const issue = await Issue.findById(issueId);
    if (!issue?.gamification?.quorumMet) {
      return { success: false, reason: "Community quorum not met" };
    }

    return this._awardRP(userId, districtId, eventType, points, {
      idempotencyKey,
      relatedIssue: issueId,
      quorumMet: true,
    });
  }

  /**
   * ========================================
   * PENALTY METHODS
   * ========================================
   */

  /**
   * Apply penalty for fake/reopened issue
   */
  async applyFakeIssuePenalty(
    userId,
    issueId,
    districtId,
    reason = "Fake issue detected"
  ) {
    const eventType = "fake_issue_penalty";
    const points = RP_CONFIG[eventType]; // -20
    const idempotencyKey = `${eventType}_${userId}_${issueId}`;

    if (await this._isDuplicate(idempotencyKey)) {
      return { success: false, reason: "Penalty already applied" };
    }

    // Update issue
    await Issue.findByIdAndUpdate(issueId, {
      "gamification.flaggedAsFake": true,
      "gamification.wasReopened": true,
      $inc: { "gamification.reopenedCount": 1 },
    });

    return this._awardRP(userId, districtId, eventType, points, {
      idempotencyKey,
      relatedIssue: issueId,
      metadata: { reason },
    });
  }

  /**
   * Apply spam penalty with cooldown
   */
  async applySpamPenalty(userId, districtId, reason = "Spam detected") {
    const eventType = "spam_penalty";
    const points = RP_CONFIG[eventType]; // -10
    const idempotencyKey = `${eventType}_${userId}_${Date.now()}`;

    // Get or create reputation record
    const reputation = await this._getOrCreateReputation(userId, districtId);

    // Apply cooldown (24 hours)
    reputation.applyCooldown(24, reason);
    reputation.stats.spamPenalties += 1;
    await reputation.save();

    // Log activity
    await ActivityLog.create({
      user: userId,
      activityType: "cooldown_applied",
      pointsEarned: 0,
      metadata: { reason, cooldownHours: 24 },
    });

    return this._awardRP(userId, districtId, eventType, points, {
      idempotencyKey,
      metadata: { reason, cooldownApplied: true },
    });
  }

  /**
   * ========================================
   * VERIFICATION QUORUM LOGIC
   * ========================================
   */

  /**
   * Process verification and check quorum
   * Called after each community verification
   */
  async processVerification(issueId, verifierId, verificationResult) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const issue = await Issue.findById(issueId).session(session);
      if (!issue) {
        throw new Error("Issue not found");
      }

      const districtId = issue.districtId;
      const reporterId = issue.reportedBy;

      // Check if quorum is already met
      if (issue.gamification?.quorumMet) {
        await session.commitTransaction();
        return { quorumAlreadyMet: true };
      }

      // Calculate total verifications
      const totalVerifications =
        (issue.verifiedCount || 0) + (issue.incorrectCount || 0);

      // Check if quorum is now met
      if (totalVerifications >= VERIFICATION_QUORUM) {
        // Determine consensus (more correct than incorrect)
        const isAccurate = issue.verifiedCount > issue.incorrectCount;

        // Update issue
        issue.gamification = issue.gamification || {};
        issue.gamification.quorumMet = true;
        issue.gamification.quorumMetAt = new Date();
        issue.gamification.categoryAccurate = isAccurate;

        await issue.save({ session });

        // Award RP to reporter for community-confirmed report
        if (isAccurate && !issue.gamification.rpAwardedForCommunityConfirm) {
          await this.awardCommunityConfirmedReport(
            reporterId,
            issueId,
            districtId
          );

          // Award accurate categorization bonus
          if (!issue.gamification.rpAwardedForCategorization) {
            await this.awardAccurateCategorization(
              reporterId,
              issueId,
              districtId
            );
          }
        }

        await session.commitTransaction();

        // Update community impact score (async, non-blocking)
        this._updateCommunityImpactScore(districtId).catch(console.error);

        return {
          quorumMet: true,
          isAccurate,
          rpAwarded: isAccurate,
        };
      }

      await session.commitTransaction();
      return {
        quorumMet: false,
        verificationsNeeded: VERIFICATION_QUORUM - totalVerifications,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Process issue resolution verification
   * Called when an issue is marked as resolved
   */
  async processResolutionVerification(issueId, verifierId, isResolved) {
    const issue = await Issue.findById(issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    const districtId = issue.districtId;
    const reporterId = issue.reportedBy;

    if (isResolved) {
      // Mark as verified resolved
      issue.gamification = issue.gamification || {};
      issue.gamification.resolutionVerified = true;
      issue.gamification.resolutionVerifiedAt = new Date();
      await issue.save();

      // Award RP to reporter
      if (!issue.gamification.rpAwardedForResolution) {
        await this.awardIssueVerifiedResolved(reporterId, issueId, districtId);
        issue.gamification.rpAwardedForResolution = true;
        await issue.save();
      }

      // Update community metrics
      await this._updateCommunityImpactScore(districtId);

      return { resolved: true, rpAwarded: true };
    } else {
      // False resolution - award RP to the verifier who flagged it
      await this.awardFalseResolutionFlagged(verifierId, issueId, districtId);

      // Reopen the issue
      issue.status = "in-progress";
      issue.gamification = issue.gamification || {};
      issue.gamification.wasReopened = true;
      issue.gamification.reopenedCount =
        (issue.gamification.reopenedCount || 0) + 1;
      await issue.save();

      return { resolved: false, falseResolutionFlagged: true };
    }
  }

  /**
   * ========================================
   * USER PROFILE & LEADERBOARD
   * ========================================
   */

  /**
   * Get user's community-scoped reputation profile
   */
  async getUserProfile(userId, districtId = null) {
    // If districtId provided, get specific community reputation
    if (districtId) {
      const reputation = await CommunityReputation.findOne({
        user: userId,
        districtId,
      }).populate("user", "username avatar email");

      if (!reputation) {
        return this._getDefaultProfile(userId);
      }

      return {
        userId,
        districtId,
        totalRP: reputation.totalRP,
        role: reputation.role,
        roleDisplayName: this._getRoleDisplayName(reputation.role),
        stats: reputation.stats,
        nextRoleThreshold: this._getNextRoleThreshold(reputation.totalRP),
        isInCooldown: reputation.isInCooldown(),
        cooldownExpires: reputation.spamCooldown.expiresAt,
      };
    }

    // Get all community reputations for user
    const reputations = await CommunityReputation.find({ user: userId });

    return {
      userId,
      communities: reputations.map((rep) => ({
        districtId: rep.districtId,
        totalRP: rep.totalRP,
        role: rep.role,
        roleDisplayName: this._getRoleDisplayName(rep.role),
      })),
      totalCommunities: reputations.length,
    };
  }

  /**
   * Get community-scoped leaderboard
   * No global leaderboards - all scoring is community-scoped
   */
  async getCommunityLeaderboard(districtId, limit = 20) {
    const leaderboard = await CommunityReputation.find({ districtId })
      .populate("user", "username avatar")
      .sort({ totalRP: -1 })
      .limit(limit)
      .lean();

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user?._id,
      username: entry.user?.username || "Unknown",
      avatar: entry.user?.avatar,
      totalRP: entry.totalRP,
      role: entry.role,
      roleDisplayName: this._getRoleDisplayName(entry.role),
      stats: {
        issuesReported: entry.stats.issuesReported,
        issuesVerifiedResolved: entry.stats.issuesVerifiedResolved,
      },
    }));
  }

  /**
   * Get community impact score
   */
  async getCommunityImpactScore(districtId) {
    let impactScore = await CommunityImpactScore.findOne({ districtId });

    if (!impactScore) {
      impactScore = await this._createCommunityImpactScore(districtId);
    } else if (impactScore.needsRecomputation()) {
      await this._updateCommunityImpactScore(districtId);
      impactScore = await CommunityImpactScore.findOne({ districtId });
    }

    return impactScore;
  }

  /**
   * Get user's RP history
   */
  async getUserRPHistory(userId, districtId = null, limit = 20) {
    const query = { user: userId };
    if (districtId) {
      query.districtId = districtId;
    }

    const events = await ReputationEvent.find(query)
      .populate("relatedIssue", "issueId title")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return events.map((event) => ({
      id: event._id,
      eventType: event.eventType,
      points: event.points,
      districtId: event.districtId,
      issueId: event.relatedIssue?.issueId,
      issueTitle: event.relatedIssue?.title,
      quorumMet: event.quorumMet,
      createdAt: event.createdAt,
    }));
  }

  /**
   * ========================================
   * PRIVATE HELPER METHODS
   * ========================================
   */

  /**
   * Core RP awarding logic (private)
   */
  async _awardRP(userId, districtId, eventType, points, options = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get or create reputation record
      let reputation = await CommunityReputation.findOne({
        user: userId,
        districtId,
      }).session(session);

      if (!reputation) {
        reputation = new CommunityReputation({
          user: userId,
          districtId,
        });
      }

      // Check cooldown for positive awards
      if (points > 0 && reputation.isInCooldown()) {
        await session.abortTransaction();
        return {
          success: false,
          reason: "User is in spam cooldown",
          cooldownExpires: reputation.spamCooldown.expiresAt,
        };
      }

      // Award RP
      const previousRP = reputation.totalRP;
      const roleChange = reputation.addRP(points);

      // Update stats
      this._updateStats(reputation, eventType);

      await reputation.save({ session });

      // Create reputation event for audit trail
      const event = new ReputationEvent({
        user: userId,
        districtId,
        eventType,
        points,
        relatedIssue: options.relatedIssue,
        relatedVerification: options.relatedVerification,
        quorumMet: options.quorumMet || false,
        idempotencyKey: options.idempotencyKey,
        metadata: options.metadata,
        triggeredBy: options.triggeredBy || "system",
      });

      await event.save({ session });

      // Log activity
      await ActivityLog.create(
        [
          {
            user: userId,
            activityType: eventType,
            pointsEarned: points,
            metadata: {
              districtId,
              previousRP,
              newRP: reputation.totalRP,
              roleChange,
            },
            relatedIssue: options.relatedIssue,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      console.log(
        `✅ [Gamification] Awarded ${points} RP to user ${userId} for ${eventType}`
      );

      return {
        success: true,
        pointsAwarded: points,
        previousRP,
        newRP: reputation.totalRP,
        role: reputation.role,
        roleChange,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error(`❌ [Gamification] Error awarding RP:`, error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Check for duplicate RP award
   */
  async _isDuplicate(idempotencyKey) {
    const existing = await ReputationEvent.findOne({ idempotencyKey });
    return !!existing;
  }

  /**
   * Get or create reputation record
   */
  async _getOrCreateReputation(userId, districtId) {
    let reputation = await CommunityReputation.findOne({
      user: userId,
      districtId,
    });

    if (!reputation) {
      reputation = await CommunityReputation.create({
        user: userId,
        districtId,
      });
    }

    return reputation;
  }

  /**
   * Update stats based on event type
   */
  _updateStats(reputation, eventType) {
    switch (eventType) {
      case "issue_verified_resolved":
        reputation.stats.issuesVerifiedResolved += 1;
        break;
      case "after_photo_uploaded":
        reputation.stats.afterPhotosUploaded += 1;
        break;
      case "accurate_categorization":
        reputation.stats.accurateCategorizations += 1;
        break;
      case "false_resolution_flagged":
        reputation.stats.falseResolutionsFlagged += 1;
        break;
      case "community_confirmed_report":
        reputation.stats.communityConfirmedReports += 1;
        break;
      case "fake_issue_penalty":
        reputation.stats.fakeIssuesPenalties += 1;
        break;
      case "spam_penalty":
        reputation.stats.spamPenalties += 1;
        break;
    }
  }

  /**
   * Get role display name
   */
  _getRoleDisplayName(role) {
    const displayNames = {
      resident: "Resident",
      civic_helper: "Civic Helper",
      community_validator: "Community Validator",
      civic_champion: "Civic Champion",
    };
    return displayNames[role] || "Resident";
  }

  /**
   * Get next role threshold
   */
  _getNextRoleThreshold(currentRP) {
    if (currentRP >= 300) {
      return { role: "civic_champion", threshold: 300, achieved: true };
    }
    if (currentRP >= 120) {
      return {
        role: "civic_champion",
        threshold: 300,
        rpNeeded: 300 - currentRP,
      };
    }
    if (currentRP >= 50) {
      return {
        role: "community_validator",
        threshold: 120,
        rpNeeded: 120 - currentRP,
      };
    }
    return { role: "civic_helper", threshold: 50, rpNeeded: 50 - currentRP };
  }

  /**
   * Get default profile
   */
  _getDefaultProfile(userId) {
    return {
      userId,
      totalRP: 0,
      role: "resident",
      roleDisplayName: "Resident",
      stats: {},
      nextRoleThreshold: { role: "civic_helper", threshold: 50, rpNeeded: 50 },
    };
  }

  /**
   * Create community impact score
   */
  async _createCommunityImpactScore(districtId) {
    // Parse district name from ID
    const parts = districtId.split("__");
    const displayName = parts.map((p) => p.replace(/-/g, " ")).join(", ");

    return CommunityImpactScore.create({
      districtId,
      displayName,
    });
  }

  /**
   * Update community impact score
   */
  async _updateCommunityImpactScore(districtId) {
    try {
      // Get or create
      let impactScore = await CommunityImpactScore.findOne({ districtId });
      if (!impactScore) {
        impactScore = await this._createCommunityImpactScore(districtId);
      }

      // Aggregate metrics from issues
      const issueStats = await Issue.aggregate([
        { $match: { districtId } },
        {
          $group: {
            _id: null,
            totalReported: { $sum: 1 },
            verifiedResolutions: {
              $sum: { $cond: ["$gamification.resolutionVerified", 1, 0] },
            },
            reopenedIssues: {
              $sum: { $cond: ["$gamification.wasReopened", 1, 0] },
            },
            avgResolutionTime: {
              $avg: {
                $cond: [
                  { $eq: ["$status", "resolved"] },
                  { $subtract: ["$updatedAt", "$createdAt"] },
                  null,
                ],
              },
            },
          },
        },
      ]);

      // Aggregate reputation stats
      const repStats = await CommunityReputation.aggregate([
        { $match: { districtId } },
        {
          $group: {
            _id: null,
            totalRP: { $sum: "$totalRP" },
            activeContributors: { $sum: 1 },
            residents: {
              $sum: { $cond: [{ $eq: ["$role", "resident"] }, 1, 0] },
            },
            civicHelpers: {
              $sum: { $cond: [{ $eq: ["$role", "civic_helper"] }, 1, 0] },
            },
            communityValidators: {
              $sum: {
                $cond: [{ $eq: ["$role", "community_validator"] }, 1, 0],
              },
            },
            civicChampions: {
              $sum: { $cond: [{ $eq: ["$role", "civic_champion"] }, 1, 0] },
            },
          },
        },
      ]);

      // Update metrics
      if (issueStats.length > 0) {
        const stats = issueStats[0];
        impactScore.metrics.totalIssuesReported = stats.totalReported || 0;
        impactScore.metrics.verifiedResolutions =
          stats.verifiedResolutions || 0;
        impactScore.metrics.reopenedIssues = stats.reopenedIssues || 0;
        impactScore.metrics.avgResolutionTimeHours = stats.avgResolutionTime
          ? stats.avgResolutionTime / (1000 * 60 * 60)
          : 0;
      }

      if (repStats.length > 0) {
        const stats = repStats[0];
        impactScore.metrics.totalRP = stats.totalRP || 0;
        impactScore.metrics.activeContributors = stats.activeContributors || 0;
        impactScore.roleDistribution = {
          residents: stats.residents || 0,
          civicHelpers: stats.civicHelpers || 0,
          communityValidators: stats.communityValidators || 0,
          civicChampions: stats.civicChampions || 0,
        };
      }

      // Calculate score
      impactScore.calculateScore();
      await impactScore.save();

      console.log(
        `✅ [Gamification] Updated community impact score for ${districtId}: ${impactScore.impactScore}`
      );

      return impactScore;
    } catch (error) {
      console.error(
        `❌ [Gamification] Error updating community impact score:`,
        error
      );
    }
  }
}

// Export singleton instance
export const outcomeGamificationService = new OutcomeGamificationService();
export default outcomeGamificationService;
