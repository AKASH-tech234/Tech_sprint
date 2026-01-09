// ============================================================
// CITIZENVOICE - PRODUCTION EMAIL TEMPLATES
// Role-aware, status-driven, mobile-friendly email templates
// ============================================================

const PLATFORM_NAME = "CitizenVoice";
const SUPPORT_EMAIL = process.env.EMAIL_FROM || "citizenvoice95@gmail.com";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ============================================================
// HELPER: Format date for display
// ============================================================
const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============================================================
// HELPER: Get role-specific greeting
// ============================================================
const getGreeting = (recipientRole, recipientName) => {
  const name = recipientName || "there";
  switch (recipientRole) {
    case "citizen":
      return `Dear ${name}`;
    case "community":
      return `Hello ${name}`;
    case "official":
      return `Dear ${name}`;
    case "team_member":
      return `Hello ${name}`;
    default:
      return `Dear ${name}`;
  }
};

// ============================================================
// HELPER: Get status-specific explanation by role
// ============================================================
const getStatusExplanation = (status, recipientRole, ctx = {}) => {
  const explanations = {
    submitted: {
      citizen: "Your report has been successfully received. Our team will review it shortly and keep you updated on any progress.",
      community: "A new report has been submitted in your area. Community coordination helps us address issues faster.",
      official: "A new report requires your attention. Please review and take appropriate action.",
      team_member: "A new report has been submitted and is pending initial review by your supervisor.",
    },
    under_review: {
      citizen: "Your report is currently being evaluated by our team. We're working to understand the issue and determine the best course of action.",
      community: "This report is under active evaluation. Stay tuned for updates on collective action.",
      official: "This report is under review. Please ensure timely evaluation and status update.",
      team_member: "This report is under review. Await further instructions from your supervising authority.",
    },
    assigned: {
      citizen: `Great news! Your report has been assigned to ${ctx.department || "the appropriate department"}${ctx.assignedToName ? ` and ${ctx.assignedToName} will be handling it` : ""}. They will begin working on it soon.`,
      community: `This report has been assigned to ${ctx.department || "a department"} for action. Community monitoring is encouraged.`,
      official: `This report has been assigned${ctx.assignedToName ? ` to ${ctx.assignedToName}` : ""}${ctx.department ? ` in ${ctx.department}` : ""}. Ensure compliance and timely resolution.`,
      team_member: `You have been assigned to this report${ctx.department ? ` under ${ctx.department}` : ""}. Please begin work as directed by your supervisor.`,
    },
    in_progress: {
      citizen: "Work is actively underway to resolve your reported issue. We appreciate your patience as our team addresses it.",
      community: "Active work is in progress on this issue. Your collective engagement helps drive faster resolution.",
      official: "Resolution work is in progress. Monitor status and ensure resources are allocated appropriately.",
      team_member: "Resolution work is in progress. Continue as per instructions and report any blockers to your supervisor.",
    },
    resolved: {
      citizen: `Your report has been resolved! ${ctx.statusNotePublic || "The issue has been successfully addressed."} Thank you for helping us improve our community.`,
      community: `This issue has been resolved. ${ctx.statusNotePublic || ""} Thank you for your collective engagement.`,
      official: `This report has been marked as resolved. ${ctx.statusNotePublic || ""} Please verify closure compliance.`,
      team_member: `This report has been resolved and closed. ${ctx.statusNotePublic || ""} Good work.`,
    },
    rejected: {
      citizen: `After careful review, your report could not be processed at this time. ${ctx.statusNotePublic || "The report did not meet the criteria for action."} You may contact support if you have questions or wish to appeal.`,
      community: `This report has been closed. ${ctx.statusNotePublic || "It did not meet criteria for further action."}`,
      official: `This report has been rejected. ${ctx.statusNotePublic || ""} Ensure documentation is complete.`,
      team_member: `This report has been rejected by administration. ${ctx.statusNotePublic || ""} No further action required.`,
    },
    reopened: {
      citizen: `Your report has been reopened for further review. ${ctx.statusNotePublic || "Additional investigation is needed."} We'll keep you updated on progress.`,
      community: `This report has been reopened for renewed review. Continued monitoring is appreciated.`,
      official: `This report has been reopened. ${ctx.statusNotePublic || ""} Please prioritize re-evaluation.`,
      team_member: `This report has been reopened by administration. ${ctx.statusNotePublic || ""} Await further instructions.`,
    },
  };

  return explanations[status]?.[recipientRole] || explanations[status]?.citizen || "Status update received.";
};

// ============================================================
// HELPER: Get next steps by role and status
// ============================================================
const getNextSteps = (status, recipientRole, ctx = {}) => {
  if (ctx.nextStepPublic) return ctx.nextStepPublic;

  const nextSteps = {
    submitted: {
      citizen: "You can track your report status anytime by logging into your dashboard.",
      community: "Keep an eye on this report and encourage others to verify the issue if witnessed.",
      official: "Review this report and assign it to the appropriate department.",
      team_member: "Await assignment instructions from your supervisor.",
    },
    under_review: {
      citizen: "No action needed from you at this time. We'll notify you when there's an update.",
      community: "Stay engaged and share any additional information that may help.",
      official: "Complete review and update status accordingly.",
      team_member: "Stand by for further instructions.",
    },
    assigned: {
      citizen: "The assigned team will begin work shortly. You'll be notified of progress.",
      community: "Monitor progress and report any related observations.",
      official: "Ensure the assigned team has necessary resources to proceed.",
      team_member: "Begin site verification and report findings to your supervisor.",
    },
    in_progress: {
      citizen: "Work is ongoing. You'll receive an update once the issue is resolved.",
      community: "Continue monitoring the situation in your area.",
      official: "Monitor progress and ensure timely completion.",
      team_member: "Complete assigned tasks and submit your resolution report.",
    },
    resolved: {
      citizen: "If you notice the issue recurring, feel free to submit a new report.",
      community: "Thank you for your participation. Report any recurrence.",
      official: "Archive this report and update metrics.",
      team_member: "This task is complete. Await your next assignment.",
    },
    rejected: {
      citizen: "If you believe this was an error, please contact our support team.",
      community: "If additional evidence is available, a new report may be submitted.",
      official: "Ensure rejection reason is documented.",
      team_member: "No further action required on this report.",
    },
    reopened: {
      citizen: "We're taking another look at your report. Thank you for your patience.",
      community: "Additional review is in progress. Your continued input is valued.",
      official: "Re-evaluate this report with priority.",
      team_member: "Prepare for potential reassignment.",
    },
  };

  return nextSteps[status]?.[recipientRole] || nextSteps[status]?.citizen || "";
};

// ============================================================
// HELPER: Get status badge color
// ============================================================
const getStatusColor = (status) => {
  const colors = {
    submitted: "#3b82f6",      // blue
    under_review: "#f59e0b",   // amber
    assigned: "#8b5cf6",       // purple
    in_progress: "#06b6d4",    // cyan
    resolved: "#22c55e",       // green
    rejected: "#ef4444",       // red
    reopened: "#f97316",       // orange
    pending: "#6b7280",        // gray
    acknowledged: "#8b5cf6",   // purple
  };
  return colors[status] || "#6b7280";
};

// ============================================================
// HELPER: Get status display name
// ============================================================
const getStatusDisplayName = (status) => {
  const names = {
    submitted: "Submitted",
    under_review: "Under Review",
    assigned: "Assigned",
    in_progress: "In Progress",
    resolved: "Resolved",
    rejected: "Rejected",
    reopened: "Reopened",
    pending: "Pending",
    acknowledged: "Acknowledged",
  };
  return names[status] || status;
};

// ============================================================
// MAIN: Build Report Status Email
// ============================================================
/**
 * Builds a role-aware, status-driven email for report updates
 * @param {Object} ctx - Context object with all required data
 * @returns {Object} { subject, html, text }
 */
export const buildReportStatusEmail = (ctx) => {
  const {
    recipientRole = "citizen",
    recipientName = "",
    reportId = "",
    reportTitle = "",
    reportCategory = "",
    reportLocation = "",
    reportStatus = "submitted",
    department = "",
    assignedToName = "",
    actedByName = "",
    actedByRole = "",
    actedAt = null,
    statusNotePublic = "",
    nextStepPublic = "",
    submittedDate = null,
    portalUrl = "",
  } = ctx;

  const displayStatus = getStatusDisplayName(reportStatus);
  const statusColor = getStatusColor(reportStatus);
  const greeting = getGreeting(recipientRole, recipientName);
  const explanation = getStatusExplanation(reportStatus, recipientRole, ctx);
  const nextSteps = getNextSteps(reportStatus, recipientRole, ctx);
  const viewUrl = portalUrl || `${CLIENT_URL}/dashboard/${recipientRole}/issues`;

  // Show "who acted" for certain statuses
  const showActedBy = ["assigned", "in_progress", "resolved", "rejected", "reopened"].includes(reportStatus) && actedByName;

  // ==================== SUBJECT ====================
  const subject = `[${displayStatus}] ${reportTitle || `Report #${reportId}`} - ${PLATFORM_NAME}`;

  // ==================== HTML BODY ====================
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Update - ${PLATFORM_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px;">
        
        <!-- Header -->
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <h1 style="color: #f43f5e; margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">
                🏛️ ${PLATFORM_NAME}
              </h1>
              <p style="color: #94a3b8; margin: 0; font-size: 13px;">
                Empowering Citizens, Building Better Communities
              </p>
            </td>
          </tr>
        </table>

        <!-- Status Badge -->
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <span style="display: inline-block; background: ${statusColor}; color: #ffffff; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                ${displayStatus}
              </span>
            </td>
          </tr>
        </table>

        <!-- Greeting -->
        <p style="color: #e2e8f0; margin: 0 0 16px 0; font-size: 16px;">
          ${greeting},
        </p>

        <!-- Status Explanation -->
        <p style="color: #cbd5e1; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
          ${explanation}
        </p>

        <!-- Report Summary Card -->
        <table width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px;">
              <h3 style="color: #f43f5e; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                📋 Report Summary
              </h3>
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color: #94a3b8; font-size: 13px; padding: 6px 0; width: 35%;">Report ID:</td>
                  <td style="color: #ffffff; font-size: 13px; padding: 6px 0; font-weight: 500;">#${reportId || "N/A"}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Title:</td>
                  <td style="color: #ffffff; font-size: 13px; padding: 6px 0; font-weight: 500;">${reportTitle || "N/A"}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Category:</td>
                  <td style="color: #ffffff; font-size: 13px; padding: 6px 0;">${reportCategory || "N/A"}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Location:</td>
                  <td style="color: #ffffff; font-size: 13px; padding: 6px 0;">${reportLocation || "N/A"}</td>
                </tr>
                ${submittedDate ? `
                <tr>
                  <td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Submitted:</td>
                  <td style="color: #ffffff; font-size: 13px; padding: 6px 0;">${formatDate(submittedDate)}</td>
                </tr>
                ` : ""}
              </table>
            </td>
          </tr>
        </table>

        ${showActedBy ? `
        <!-- Who Acted Section -->
        <table width="100%" cellspacing="0" cellpadding="0" style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px;">
              <h3 style="color: #a78bfa; margin: 0 0 12px 0; font-size: 14px;">
                👤 Action By
              </h3>
              <p style="color: #e2e8f0; margin: 0; font-size: 14px;">
                <strong>${actedByName}</strong>${actedByRole ? ` (${actedByRole})` : ""}${department ? ` • ${department}` : ""}
              </p>
              ${actedAt ? `<p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 12px;">${formatDate(actedAt)}</p>` : ""}
            </td>
          </tr>
        </table>
        ` : ""}

        ${nextSteps ? `
        <!-- Next Steps -->
        <table width="100%" cellspacing="0" cellpadding="0" style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px;">
              <h3 style="color: #4ade80; margin: 0 0 8px 0; font-size: 14px;">
                ➡️ Next Steps
              </h3>
              <p style="color: #cbd5e1; margin: 0; font-size: 14px; line-height: 1.5;">
                ${nextSteps}
              </p>
            </td>
          </tr>
        </table>
        ` : ""}

        <!-- CTA Button -->
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td style="text-align: center;">
              <a href="${viewUrl}" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                View Report Details
              </a>
            </td>
          </tr>
        </table>

        <!-- Security Note -->
        <table width="100%" cellspacing="0" cellpadding="0" style="background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2); border-radius: 8px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px 16px;">
              <p style="color: #fda4af; margin: 0; font-size: 12px;">
                🔒 This is an automated notification. Never share sensitive information via email. For support, contact us at ${SUPPORT_EMAIL}
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
              <p style="color: #64748b; margin: 0 0 8px 0; font-size: 13px;">
                ${PLATFORM_NAME} Support Team
              </p>
              <p style="color: #475569; margin: 0; font-size: 11px;">
                © ${new Date().getFullYear()} ${PLATFORM_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // ==================== PLAIN TEXT ====================
  const text = `
${PLATFORM_NAME} - Report Update
================================

Status: ${displayStatus}

${greeting},

${explanation}

📋 REPORT SUMMARY
-----------------
Report ID: #${reportId || "N/A"}
Title: ${reportTitle || "N/A"}
Category: ${reportCategory || "N/A"}
Location: ${reportLocation || "N/A"}
${submittedDate ? `Submitted: ${formatDate(submittedDate)}` : ""}

${showActedBy ? `👤 ACTION BY
------------
${actedByName}${actedByRole ? ` (${actedByRole})` : ""}${department ? ` • ${department}` : ""}
${actedAt ? formatDate(actedAt) : ""}
` : ""}
${nextSteps ? `➡️ NEXT STEPS
-------------
${nextSteps}
` : ""}
🔗 View Report: ${viewUrl}

---
This is an automated notification from ${PLATFORM_NAME}.
For support, contact: ${SUPPORT_EMAIL}
© ${new Date().getFullYear()} ${PLATFORM_NAME}. All rights reserved.
  `.trim();

  return { subject, html, text };
};

// ============================================================
// LEGACY TEMPLATES (for backward compatibility)
// ============================================================

export const issueSubmittedTemplate = (issue, user = null) => {
  const ctx = {
    recipientRole: user?.role || "citizen",
    recipientName: user?.username || issue.reportedBy?.username || "",
    reportId: issue.issueId || issue._id?.toString()?.slice(-8) || "",
    reportTitle: issue.title || "",
    reportCategory: issue.category || "",
    reportLocation: issue.location?.address || `${issue.location?.lat}, ${issue.location?.lng}` || "",
    reportStatus: "submitted",
    submittedDate: issue.createdAt || new Date(),
    portalUrl: `${CLIENT_URL}/dashboard/citizen/issues`,
  };
  return buildReportStatusEmail(ctx);
};

export const issueAssignedTemplate = (issue, assignedUser = null, actedBy = null) => {
  const ctx = {
    recipientRole: "team_member",
    recipientName: assignedUser?.username || "",
    reportId: issue.issueId || issue._id?.toString()?.slice(-8) || "",
    reportTitle: issue.title || "",
    reportCategory: issue.category || "",
    reportLocation: issue.location?.address || "",
    reportStatus: "assigned",
    assignedToName: assignedUser?.username || "",
    department: issue.department || assignedUser?.officialDetails?.department || "",
    actedByName: actedBy?.username || "",
    actedByRole: actedBy?.role || "",
    actedAt: new Date(),
    submittedDate: issue.createdAt,
    portalUrl: `${CLIENT_URL}/dashboard/official/issues/${issue._id}`,
  };
  return buildReportStatusEmail(ctx);
};

export const issueSolvedTemplate = (issue, user = null) => {
  const ctx = {
    recipientRole: user?.role || "citizen",
    recipientName: user?.username || issue.reportedBy?.username || "",
    reportId: issue.issueId || issue._id?.toString()?.slice(-8) || "",
    reportTitle: issue.title || "",
    reportCategory: issue.category || "",
    reportLocation: issue.location?.address || "",
    reportStatus: "resolved",
    statusNotePublic: "The issue has been successfully addressed by our team.",
    submittedDate: issue.createdAt,
    portalUrl: `${CLIENT_URL}/dashboard/citizen/issues`,
  };
  return buildReportStatusEmail(ctx);
};

// Status change notification for citizens
export const issueStatusChangeTemplate = (issue, newStatus, user = null, actedBy = null) => {
  const ctx = {
    recipientRole: user?.role || "citizen",
    recipientName: user?.username || issue.reportedBy?.username || "",
    reportId: issue.issueId || issue._id?.toString()?.slice(-8) || "",
    reportTitle: issue.title || "",
    reportCategory: issue.category || "",
    reportLocation: issue.location?.address || "",
    reportStatus: newStatus,
    department: issue.department || "",
    assignedToName: issue.assignedTo?.username || "",
    actedByName: actedBy?.username || "",
    actedByRole: actedBy?.role || "",
    actedAt: new Date(),
    submittedDate: issue.createdAt,
    portalUrl: `${CLIENT_URL}/dashboard/${user?.role || "citizen"}/issues`,
  };
  return buildReportStatusEmail(ctx);
};

// Password Reset Email Template
export const passwordResetTemplate = (resetUrl, username) => ({
  subject: "Password Reset Request - CitizenVoice",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; text-align: center;">
            <!-- Logo/Header -->
            <h1 style="color: #f43f5e; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">
              🏛️ CitizenVoice
            </h1>
            <p style="color: #94a3b8; margin: 0 0 30px 0; font-size: 14px;">
              Empowering Citizens, Building Better Communities
            </p>
            
            <!-- Main Content -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
              <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 22px;">
                Password Reset Request
              </h2>
              <p style="color: #cbd5e1; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                Hi${username ? ` <strong style="color: #f43f5e;">${username}</strong>` : ''},
              </p>
              <p style="color: #cbd5e1; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <!-- CTA Button -->
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 25px;">
                Reset My Password
              </a>
              
              <p style="color: #94a3b8; margin: 25px 0 0 0; font-size: 14px;">
                ⏰ This link will expire in <strong style="color: #f43f5e;">15 minutes</strong>
              </p>
            </div>
            
            <!-- Security Notice -->
            <div style="background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.3); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #fda4af; margin: 0; font-size: 13px;">
                🔒 If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <!-- Alternative Link -->
            <p style="color: #64748b; font-size: 12px; margin: 20px 0 0 0; word-break: break-all;">
              If the button doesn't work, copy and paste this link:<br>
              <a href="${resetUrl}" style="color: #8b5cf6;">${resetUrl}</a>
            </p>
            
            <!-- Footer -->
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="color: #475569; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} CitizenVoice. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
});

// Password Reset Success Email Template
export const passwordResetSuccessTemplate = (username) => ({
  subject: "Password Changed Successfully - CitizenVoice",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; text-align: center;">
            <!-- Logo/Header -->
            <h1 style="color: #f43f5e; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">
              🏛️ CitizenVoice
            </h1>
            
            <!-- Success Icon -->
            <div style="font-size: 60px; margin: 20px 0;">✅</div>
            
            <!-- Main Content -->
            <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 22px;">
              Password Changed Successfully
            </h2>
            <p style="color: #cbd5e1; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Hi${username ? ` <strong style="color: #f43f5e;">${username}</strong>` : ''},
            </p>
            <p style="color: #cbd5e1; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
              Your password has been changed successfully. You can now log in with your new password.
            </p>
            
            <!-- Security Notice -->
            <div style="background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.3); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #fda4af; margin: 0; font-size: 13px;">
                🔒 If you didn't make this change, please contact support immediately.
              </p>
            </div>
            
            <!-- Footer -->
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="color: #475569; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} CitizenVoice. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
});
