/**
 * Document Builder
 * Transforms MongoDB documents into RAG-ready documents for embedding
 */

import Issue from "../models/Issue.js";
import Report from "../models/Report.js";

/**
 * Convert an Issue document to RAG format
 * @param {object} issue - Mongoose Issue document
 * @returns {object} RAG document { id, textContent, metadata }
 */
export function issueToRagDocument(issue) {
  const daysOpen = Math.floor(
    (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const resolvedDate =
    issue.status === "resolved" && issue.updatedAt
      ? new Date(issue.updatedAt).toISOString().split("T")[0]
      : null;

  const daysToResolve = resolvedDate
    ? Math.floor(
        (new Date(issue.updatedAt) - new Date(issue.createdAt)) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Build text content for embedding
  const textContent = `
Issue ID: ${issue.issueId}
Title: ${issue.title}
Category: ${issue.category}
Priority: ${issue.priority}
Status: ${issue.status}
Location: ${issue.location?.address || "Unknown"}, ${
    issue.location?.district || ""
  }, ${issue.location?.state || ""}
Reported Date: ${new Date(issue.createdAt).toISOString().split("T")[0]}
Last Updated: ${new Date(issue.updatedAt).toISOString().split("T")[0]}
Days Since Reported: ${daysOpen}
${resolvedDate ? `Resolved Date: ${resolvedDate}` : ""}
${daysToResolve ? `Days to Resolve: ${daysToResolve}` : ""}

Description: ${issue.description}

Community Verification:
- Verified Count: ${issue.verifiedCount || 0}
- Incorrect Flags: ${issue.incorrectCount || 0}
${
  issue.verifiedCount >= 3
    ? "- Status: Community verified"
    : "- Status: Awaiting verification"
}

${issue.upvotes?.length > 0 ? `Upvotes: ${issue.upvotes.length}` : ""}
${issue.comments?.length > 0 ? `Comments: ${issue.comments.length}` : ""}
  `.trim();

  // Metadata for filtering (NOT embedded)
  const metadata = {
    docType: "issue",
    issueId: issue.issueId,
    districtId: issue.districtId || null,
    ward: issue.location?.district || null,
    category: issue.category,
    department: categoryToDepartment(issue.category),
    status: issue.status,
    priority: issue.priority,
    reportedDate: new Date(issue.createdAt).toISOString().split("T")[0],
    resolvedDate: resolvedDate,
    daysToResolve: daysToResolve,
    dateRange: new Date(issue.createdAt).toISOString().substring(0, 7), // "2026-01"
  };

  return {
    id: `issue_${issue.issueId}`,
    textContent,
    metadata,
  };
}

/**
 * Convert a Resolution Report to RAG format
 * @param {object} report - Mongoose Report document (populated with issue)
 * @returns {object} RAG document
 */
export function reportToRagDocument(report) {
  const issue = report.issue;

  const textContent = `
Resolution Report for Issue: ${issue?.issueId || "Unknown"}
Report Type: ${report.reportType}
Status: ${report.status}
Submitted: ${new Date(report.submittedAt).toISOString().split("T")[0]}

${
  report.reportType === "verification"
    ? `
Verification Outcome: ${report.outcome || "N/A"}
Root Cause Analysis: ${report.rootCause || "Not provided"}
`
    : ""
}

${
  report.reportType === "resolution"
    ? `
Work Summary: ${report.workSummary || "Not provided"}
Steps Taken: ${report.stepsTaken || "Not provided"}
Resources Used: ${report.resourcesUsed || "Not provided"}
Completion Confirmed: ${report.completionConfirmed ? "Yes" : "No"}
`
    : ""
}

Officer Remarks: ${report.remarks || "None"}
  `.trim();

  const metadata = {
    docType: "report",
    issueId: issue?.issueId || null,
    reportType: report.reportType,
    status: report.status,
    districtId: issue?.districtId || null,
    category: issue?.category || null,
    department: categoryToDepartment(issue?.category),
    submittedDate: new Date(report.submittedAt).toISOString().split("T")[0],
  };

  return {
    id: `report_${report._id}`,
    textContent,
    metadata,
  };
}

/**
 * Build department metrics document from aggregated data
 * @param {object} metrics - Aggregated metrics data
 * @returns {object} RAG document
 */
export function buildDepartmentMetricsDocument(metrics) {
  const {
    department,
    districtId,
    periodStart,
    periodEnd,
    totalIssues,
    resolvedCount,
    avgResolutionDays,
    minResolutionDays,
    maxResolutionDays,
    byCategory,
    trend,
  } = metrics;

  const resolutionRate =
    totalIssues > 0 ? ((resolvedCount / totalIssues) * 100).toFixed(1) : 0;

  const categoryBreakdown = byCategory
    ? Object.entries(byCategory)
        .map(
          ([cat, data]) =>
            `  - ${cat}: ${data.count} issues, avg ${
              data.avgDays?.toFixed(1) || "N/A"
            } days`
        )
        .join("\n")
    : "No category breakdown available";

  const textContent = `
Department: ${formatDepartmentName(department)}
District: ${formatDistrictId(districtId)}
Period: ${periodStart} to ${periodEnd}

Performance Summary:
- Total Issues: ${totalIssues}
- Resolved: ${resolvedCount} (${resolutionRate}%)
- Average Resolution Time: ${avgResolutionDays?.toFixed(1) || "N/A"} days
- Fastest Resolution: ${minResolutionDays || "N/A"} days
- Slowest Resolution: ${maxResolutionDays || "N/A"} days

By Category:
${categoryBreakdown}

${trend ? `Trend: ${trend}` : ""}
  `.trim();

  const metadata = {
    docType: "department_metrics",
    department,
    districtId,
    periodStart,
    periodEnd,
    dateRange: periodEnd.substring(0, 7),
  };

  return {
    id: `metrics_${department}_${districtId}_${periodEnd}`,
    textContent,
    metadata,
  };
}

/**
 * Build ward statistics document from aggregated data
 * @param {object} stats - Aggregated ward statistics
 * @returns {object} RAG document
 */
export function buildWardStatsDocument(stats) {
  const {
    districtId,
    ward,
    periodStart,
    periodEnd,
    issueDistribution,
    resolutionRates,
    avgWaitTimes,
    communityActivity,
  } = stats;

  const distributionText = issueDistribution
    ? Object.entries(issueDistribution)
        .map(([cat, data]) => `  - ${cat}: ${data.count} (${data.percentage}%)`)
        .join("\n")
    : "No data available";

  const resolutionText = resolutionRates
    ? Object.entries(resolutionRates)
        .map(([cat, rate]) => `  - ${cat}: ${rate}%`)
        .join("\n")
    : "No data available";

  const waitTimeText = avgWaitTimes
    ? Object.entries(avgWaitTimes)
        .map(([cat, days]) => `  - ${cat}: ${days} days`)
        .join("\n")
    : "No data available";

  const textContent = `
Ward: ${ward || "Unknown"}
District: ${formatDistrictId(districtId)}
Period: ${periodStart} to ${periodEnd}

Issue Distribution:
${distributionText}

Resolution Rates:
${resolutionText}

Average Wait Times:
${waitTimeText}

${
  communityActivity
    ? `
Community Activity:
- Active Verifiers: ${communityActivity.activeVerifiers || 0}
- Verification Rate: ${communityActivity.verificationRate || 0}%
`
    : ""
}
  `.trim();

  const metadata = {
    docType: "ward_stats",
    districtId,
    ward,
    periodStart,
    periodEnd,
    dateRange: periodEnd.substring(0, 7),
  };

  return {
    id: `ward_${districtId}_${ward}_${periodEnd}`,
    textContent,
    metadata,
  };
}

/**
 * Map category to department
 */
function categoryToDepartment(category) {
  const mapping = {
    pothole: "roads",
    streetlight: "electricity",
    garbage: "sanitation",
    water: "water_supply",
    traffic: "traffic",
    noise: "pollution_control",
    safety: "public_safety",
    other: "general",
  };
  return mapping[category] || "general";
}

/**
 * Format department name for display
 */
function formatDepartmentName(department) {
  const names = {
    roads: "Roads & Infrastructure Department",
    electricity: "Electricity Department",
    sanitation: "Sanitation Department",
    water_supply: "Water Supply Department",
    traffic: "Traffic & Transport Department",
    pollution_control: "Pollution Control Department",
    public_safety: "Public Safety Department",
    general: "General Services",
  };
  return names[department] || department;
}

/**
 * Format districtId for display
 */
function formatDistrictId(districtId) {
  if (!districtId) return "Unknown";

  // Format: "maharashtra__mumbai" → "Mumbai, Maharashtra"
  const parts = districtId.split("__");
  if (parts.length === 2) {
    const state = parts[0].replace(/-/g, " ");
    const district = parts[1].replace(/-/g, " ");
    return `${capitalize(district)}, ${capitalize(state)}`;
  }
  return districtId;
}

function capitalize(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default {
  issueToRagDocument,
  reportToRagDocument,
  buildDepartmentMetricsDocument,
  buildWardStatsDocument,
};
