// Backend/src/controllers/verificationController.js
import CommunityVerification from "../models/CommunityVerification.js";
import Issue from "../models/Issue.js";
import Notification from "../models/Notification.js";
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { outcomeGamificationService } from "../services/outcomeGamificationService.js";

// Verify an issue (Community only)
export const verifyIssue = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const { status, remarks } = req.body;
  const userId = req.user._id;

  // Validate status
  if (!["correct", "incorrect"].includes(status)) {
    throw new ApiError(400, 'Status must be either "correct" or "incorrect"');
  }

  // Check if user is community role
  if (req.user.role !== "community") {
    throw new ApiError(403, "Only community members can verify issues");
  }

  // Check if profile is complete
  const user = await User.findById(userId);
  if (!user.isProfileComplete) {
    throw new ApiError(
      403,
      "Please complete your profile before verifying issues"
    );
  }

  // Find the issue
  const issue = await Issue.findById(issueId).populate(
    "reportedBy",
    "username email"
  );
  if (!issue) {
    throw new ApiError(404, "Issue not found");
  }

  // Check if user already verified this issue
  const existingVerification = await CommunityVerification.findOne({
    issue: issueId,
    verifiedBy: userId,
  });

  if (existingVerification) {
    throw new ApiError(400, "You have already verified this issue");
  }

  // Create verification record
  const verification = await CommunityVerification.create({
    issue: issueId,
    verifiedBy: userId,
    status,
    remarks: remarks || null,
  });

  // Update issue counts
  if (status === "correct") {
    issue.verifiedCount = (issue.verifiedCount || 0) + 1;
  } else {
    issue.incorrectCount = (issue.incorrectCount || 0) + 1;
  }
  await issue.save();

  // ======================================
  // GAMIFICATION: Process verification and check quorum
  // ======================================
  let gamificationResult = null;
  try {
    gamificationResult = await outcomeGamificationService.processVerification(
      issueId,
      userId,
      status
    );
    console.log(
      "🎮 [Gamification] Verification processed:",
      gamificationResult
    );
  } catch (error) {
    // Log but don't fail the request
    console.error(
      "❌ [Gamification] Error processing verification:",
      error.message
    );
  }

  // Send notification to issue reporter
  if (
    issue.reportedBy &&
    issue.reportedBy._id.toString() !== userId.toString()
  ) {
    const notificationMessage = gamificationResult?.quorumMet
      ? `Your issue (${issue.issueId}) has been community-verified! ${
          gamificationResult.isAccurate ? "You earned reputation points!" : ""
        }`
      : `Your issue (${issue.issueId}) has received a public verification (${
          status === "correct" ? "Correct" : "Incorrect"
        }) by a community member.`;

    await Notification.create({
      recipient: issue.reportedBy._id,
      type: "issue_verification",
      title: gamificationResult?.quorumMet
        ? "Issue Community Verified!"
        : "Issue Verified",
      message: notificationMessage,
      relatedIssue: issue._id,
      relatedUser: userId,
      metadata: {
        verificationStatus: status,
        issueId: issue.issueId,
        quorumMet: gamificationResult?.quorumMet || false,
        rpAwarded: gamificationResult?.rpAwarded || false,
      },
    });

    // Emit socket event for real-time notification
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${issue.reportedBy._id}`).emit("notification", {
        type: "issue_verification",
        title: gamificationResult?.quorumMet
          ? "Issue Community Verified!"
          : "Issue Verified",
        message: notificationMessage,
        issueId: issue.issueId,
        quorumMet: gamificationResult?.quorumMet || false,
      });
    }
  }

  res.status(201).json(
    new ApiResponse(
      201,
      {
        verification,
        verifiedCount: issue.verifiedCount,
        incorrectCount: issue.incorrectCount,
        gamification: gamificationResult,
      },
      "Issue verified successfully"
    )
  );
});

// Get verification stats for an issue
export const getVerificationStats = asyncHandler(async (req, res) => {
  const { issueId } = req.params;

  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, "Issue not found");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        verifiedCount: issue.verifiedCount || 0,
        incorrectCount: issue.incorrectCount || 0,
        totalVerifications:
          (issue.verifiedCount || 0) + (issue.incorrectCount || 0),
      },
      "Verification stats retrieved"
    )
  );
});

// Get verifier list for an issue (Officials, Team Leaders, Team Members)
export const getVerifierList = asyncHandler(async (req, res) => {
  const { issueId } = req.params;

  // Only officials can see verifier list
  if (!["official", "community"].includes(req.user.role)) {
    throw new ApiError(403, "You do not have permission to view verifier list");
  }

  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, "Issue not found");
  }

  const verifications = await CommunityVerification.find({ issue: issueId })
    .populate({
      path: "verifiedBy",
      select:
        "username fullAddress aadhaarNumber mobileNumber isProfileComplete communityDetails",
    })
    .sort({ createdAt: -1 });

  // Filter and mask sensitive data
  const verifierList = verifications
    .filter((v) => v.verifiedBy && v.verifiedBy.isProfileComplete)
    .map((v) => {
      const verifier = v.verifiedBy;
      return {
        id: v._id,
        status: v.status,
        verifiedAt: v.createdAt,
        remarks: v.remarks,
        verifier: {
          name: verifier.username,
          area:
            verifier.fullAddress?.area ||
            verifier.communityDetails?.area ||
            "N/A",
          // Mask Aadhaar: show only last 4 digits
          aadhaarMasked: verifier.aadhaarNumber
            ? `XXXX-XXXX-${verifier.aadhaarNumber.slice(-4)}`
            : null,
          // Mask Mobile: show only last 4 digits
          mobileMasked: verifier.mobileNumber
            ? `XXXXXX${verifier.mobileNumber.slice(-4)}`
            : null,
        },
      };
    });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        verifierList,
        totalCorrect: verifications.filter((v) => v.status === "correct")
          .length,
        totalIncorrect: verifications.filter((v) => v.status === "incorrect")
          .length,
      },
      "Verifier list retrieved"
    )
  );
});

// Check if user has verified an issue
export const checkUserVerification = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const userId = req.user._id;

  const verification = await CommunityVerification.findOne({
    issue: issueId,
    verifiedBy: userId,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        hasVerified: !!verification,
        verification: verification || null,
      },
      "User verification status retrieved"
    )
  );
});

// Get unverified issues in community area
export const getUnverifiedIssuesInArea = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { districtId } = req.query;

  // Check if community role
  if (req.user.role !== "community") {
    throw new ApiError(403, "Only community members can access this");
  }

  const user = await User.findById(userId);
  const userArea = user.fullAddress?.area || user.communityDetails?.area;

  // Get issues that user hasn't verified yet
  const verifiedByUser = await CommunityVerification.find({
    verifiedBy: userId,
  }).select("issue");
  const verifiedIssueIds = verifiedByUser.map((v) => v.issue);

  // Build query
  const query = {
    _id: { $nin: verifiedIssueIds },
    status: { $in: ["reported", "acknowledged", "in-progress"] },
  };

  // Filter by districtId if provided
  if (districtId) {
    query.districtId = districtId;
  }

  // If user has area, filter by area (optional - can be removed for all issues)
  // if (userArea) {
  //   query['location.address'] = { $regex: userArea, $options: 'i' };
  // }

  const issues = await Issue.find(query)
    .populate("reportedBy", "username")
    .select(
      "issueId title description location images status priority createdAt verifiedCount incorrectCount districtId"
    )
    .sort({ createdAt: -1 })
    .limit(50);

  res
    .status(200)
    .json(new ApiResponse(200, { issues }, "Unverified issues retrieved"));
});

export const submitVerification = async (req, res) => {
  const verification = await Verification.create(req.body);

  const issue = await Issue.findById(verification.issue).populate(
    "reportedBy official"
  );

  await sendEmail({
    to: issue.official.email,
    subject: "Verification Report Submitted",
    html: `<p>Verification report submitted for issue ${issue.title}</p>`,
  });

  await sendEmail({
    to: issue.reportedBy.email,
    subject: "Verification Report Submitted",
    html: `<p>Your issue is under verification.</p>`,
  });

  res.json(verification);
};

export const approveVerification = async (req, res) => {
  const verification = await Verification.findByIdAndUpdate(
    req.params.id,
    { status: "Approved" },
    { new: true }
  ).populate("issue teamMember");

  await sendEmail({
    to: verification.teamMember.email,
    subject: "Verification Approved",
    html: `<p>You may proceed further.</p>`,
  });

  await sendEmail({
    to: verification.issue.reportedBy.email,
    subject: "Issue Approved",
    html: `<p>Your issue has been approved.</p>`,
  });

  res.json(verification);
};
