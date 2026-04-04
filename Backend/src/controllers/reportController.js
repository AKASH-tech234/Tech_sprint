import Report from '../models/Report.js';
import Issue from '../models/Issue.js';
import { User } from '../models/userModel.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { isOfficialAdmin } from '../utils/officialPermissions.js';
import { outcomeGamificationService } from "../services/outcomeGamificationService.js";

// =====================================================
// TEAM MEMBER ENDPOINTS (Submit Reports)
// =====================================================

/**
 * POST /api/issues/:issueId/reports
 * Submit a verification or resolution report
 */
export const submitReport = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const userId = req.user._id;

  console.log('📝 [SubmitReport] Request received for issue:', issueId);
  console.log('📝 [SubmitReport] Body:', req.body);
  console.log('📝 [SubmitReport] Files:', req.files ? req.files.length : 0);

  // Parse form data
  const {
    reportType,
    outcome,
    rootCause,
    remarks,
    workSummary,
    stepsTaken,
    resourcesUsed,
    completionConfirmed
  } = req.body;

  // Validate report type
  if (!reportType || !['verification', 'resolution'].includes(reportType)) {
    throw new ApiError(400, 'Invalid report type. Must be "verification" or "resolution"');
  }

  // Find the issue
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  // Validate issue status for report type
  if (reportType === 'verification') {
    if (issue.status !== 'acknowledged') {
      throw new ApiError(400, 'Verification can only be submitted for acknowledged issues');
    }
    if (!outcome || !['verified', 'not-verified'].includes(outcome)) {
      throw new ApiError(400, 'Verification outcome is required (verified or not-verified)');
    }
    if (outcome === 'verified' && !rootCause) {
      throw new ApiError(400, 'Root cause is required when issue is verified');
    }
    if (outcome === 'not-verified' && !remarks) {
      throw new ApiError(400, 'Remarks are required when issue is not verified');
    }
  }

  if (reportType === 'resolution') {
    if (issue.status !== 'in-progress') {
      throw new ApiError(400, 'Resolution can only be submitted for in-progress issues');
    }
    if (!workSummary) {
      throw new ApiError(400, 'Work summary is required for resolution report');
    }
  }

  // Get uploaded image URLs
  const useCloudinary = process.env.USE_CLOUDINARY === 'true';
  const imageUrls = req.files ? req.files.map(file => {
    if (useCloudinary) {
      return file.path;
    }
    return `${req.protocol}://${req.get('host')}/uploads/issues/${file.filename}`;
  }) : [];

  // For resolution reports, at least one proof image is required
  if (reportType === 'resolution' && imageUrls.length === 0) {
    throw new ApiError(400, 'At least one proof image is required for resolution report');
  }

  // Create the report
  const reportData = {
    issue: issue._id,
    reportType,
    submittedBy: userId,
    status: 'pending',
    remarks
  };

  // Add type-specific fields
  if (reportType === 'verification') {
    reportData.outcome = outcome;
    reportData.rootCause = rootCause;
    reportData.evidence = imageUrls;
  } else {
    reportData.workSummary = workSummary;
    reportData.stepsTaken = stepsTaken;
    reportData.resourcesUsed = resourcesUsed;
    reportData.completionConfirmed = completionConfirmed === 'true' || completionConfirmed === true;
    reportData.proof = imageUrls;
  }

  const report = await Report.create(reportData);

  // Populate submitter info
  await report.populate('submittedBy', 'username email');
  await report.populate('issue', 'issueId title');

  console.log('✅ [SubmitReport] Report created:', report._id);

  res.status(201).json(
    new ApiResponse(201, { report }, 'Report submitted successfully and pending review')
  );
});

// =====================================================
// ADMIN ENDPOINTS (Review Reports)
// =====================================================

/**
 * GET /api/officials/reports/pending
 * Get pending reports for admin review
 */
export const getPendingReports = asyncHandler(async (req, res) => {
  const { type } = req.query;

  console.log('📋 [GetPendingReports] Request received, type:', type);

  // Build query
  const query = { status: 'pending' };
  if (type && ['verification', 'resolution'].includes(type)) {
    query.reportType = type;
  }

  // Get pending reports with issue details
  const reports = await Report.find(query)
    .populate({
      path: 'issue',
      select: 'issueId title description category priority status location images createdAt reportedBy',
      populate: {
        path: 'reportedBy',
        select: 'username email'
      }
    })
    .populate('submittedBy', 'username email')
    .sort({ 
      // Sort by issue priority (high first), then by submission time (oldest first)
      createdAt: 1 
    });

  // Sort by priority weight manually since we need to sort by populated field
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const sortedReports = reports.sort((a, b) => {
    const priorityA = priorityWeight[a.issue?.priority] || 0;
    const priorityB = priorityWeight[b.issue?.priority] || 0;
    
    if (priorityB !== priorityA) {
      return priorityB - priorityA; // High priority first
    }
    return new Date(a.submittedAt) - new Date(b.submittedAt); // Oldest first
  });

  // Get counts
  const verificationCount = await Report.countDocuments({ status: 'pending', reportType: 'verification' });
  const resolutionCount = await Report.countDocuments({ status: 'pending', reportType: 'resolution' });

  console.log('✅ [GetPendingReports] Found', sortedReports.length, 'reports');

  res.json(new ApiResponse(200, {
    reports: sortedReports,
    totalPending: sortedReports.length,
    verificationCount,
    resolutionCount
  }, 'Pending reports fetched'));
});

/**
 * GET /api/officials/reports/:reportId
 * Get single report details
 */
export const getReportDetails = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await Report.findById(reportId)
    .populate({
      path: 'issue',
      populate: [
        { path: 'reportedBy', select: 'username email' },
        { path: 'assignedTo', select: 'username email' }
      ]
    })
    .populate('submittedBy', 'username email')
    .populate('reviewedBy', 'username email');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  res.json(new ApiResponse(200, { report }, 'Report details fetched'));
});

/**
 * POST /api/officials/reports/:reportId/review
 * Review (approve/reject) a report
 */
export const reviewReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { decision, remarks, newStatus, notifyReporter } = req.body;
  const adminId = req.user._id;

  console.log('🔍 [ReviewReport] Request received for report:', reportId);
  console.log('🔍 [ReviewReport] Decision:', decision);

  // Validate decision
  if (!decision || !['approve', 'reject'].includes(decision)) {
    throw new ApiError(400, 'Invalid decision. Must be "approve" or "reject"');
  }

  // Find the report
  const report = await Report.findById(reportId).populate('issue');
  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  if (report.status !== 'pending') {
    throw new ApiError(400, 'Report has already been reviewed');
  }

  // Get the issue
  const issue = await Issue.findById(report.issue._id);
  if (!issue) {
    throw new ApiError(404, 'Associated issue not found');
  }

  // Update report status
  report.status = decision === 'approve' ? 'approved' : 'rejected';
  report.reviewedBy = adminId;
  report.reviewedAt = new Date();
  report.adminRemarks = remarks;

  await report.save();

  // If approved, update issue status based on report type
  if (decision === 'approve') {
    if (report.reportType === 'verification') {
      // Verification approved → status becomes 'in-progress'
      if (report.outcome === 'verified') {
        issue.status = 'in-progress';
        console.log('✅ [ReviewReport] Issue status changed to in-progress');
      } else {
        // If not verified, issue can be rejected
        issue.status = 'rejected';
        console.log('✅ [ReviewReport] Issue status changed to rejected (not verified)');
      }
    } else if (report.reportType === 'resolution') {
      // Resolution approved → status becomes 'resolved'
      issue.status = 'resolved';
      console.log('✅ [ReviewReport] Issue status changed to resolved');

      // ======================================
      // GAMIFICATION: outcome-driven RP awards
      // - Only award from trusted review (official admin)
      // - Keep awards server-side (never from client)
      // ======================================
      try {
        if (issue.districtId && issue.reportedBy) {
          // Treat approved proof images as verified after-photos
          if (Array.isArray(report.proof) && report.proof.length > 0) {
            issue.gamification = issue.gamification || {};
            issue.gamification.afterPhotoUploaded = true;
            issue.gamification.afterPhotoUrl = report.proof[0];
            issue.gamification.afterPhotoVerified = true;
            await issue.save();

            if (!issue.gamification.rpAwardedForAfterPhoto) {
              const afterPhotoAward =
                await outcomeGamificationService.awardAfterPhotoUploaded(
                  issue.reportedBy,
                  issue._id,
                  issue.districtId
                );
              if (afterPhotoAward?.success) {
                issue.gamification.rpAwardedForAfterPhoto = true;
                await issue.save();
              }
            }
          }

          // Verified resolution award (service enforces quorumMet check)
          await outcomeGamificationService.processResolutionVerification(
            issue._id,
            adminId,
            true
          );
        }
      } catch (error) {
        console.error(
          "❌ [Gamification] Error processing approved resolution report:",
          error.message
        );
      }

      // TODO: If notifyReporter is true, send notification to issue reporter
      if (notifyReporter) {
        console.log('📧 [ReviewReport] Should notify reporter:', issue.reportedBy);
        // Notification logic can be added here (email, push notification, etc.)
      }
    }

    await issue.save();
  }

  // Populate response
  await report.populate('submittedBy', 'username email');
  await report.populate('reviewedBy', 'username email');
  await report.populate('issue', 'issueId title status');

  console.log('✅ [ReviewReport] Report reviewed successfully');

  res.json(new ApiResponse(200, { 
    report,
    issueStatus: issue.status 
  }, `Report ${decision}d successfully`));
});

/**
 * GET /api/officials/reports/history/:issueId
 * Get all reports for a specific issue
 */
export const getIssueReports = asyncHandler(async (req, res) => {
  const { issueId } = req.params;

  const reports = await Report.find({ issue: issueId })
    .populate('submittedBy', 'username email')
    .populate('reviewedBy', 'username email')
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, { reports }, 'Issue reports fetched'));
});
