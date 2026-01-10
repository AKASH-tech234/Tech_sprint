/**
 * RAG Indexer
 * Background indexing pipeline for MongoDB → Pinecone
 */

import Issue from "../models/Issue.js";
import Report from "../models/Report.js";
import {
  upsertDocuments,
  deleteDocuments,
  getIndexStats,
} from "./vectorStore.js";
import {
  issueToRagDocument,
  reportToRagDocument,
  buildDepartmentMetricsDocument,
  buildWardStatsDocument,
} from "./documentBuilder.js";
import ragConfig, { validateRagConfig } from "./config.js";

/**
 * Index a single issue
 * @param {object} issue - Issue document
 */
export async function indexIssue(issue) {
  if (!validateRagConfig().configured) {
    return { indexed: false, reason: "RAG not configured" };
  }

  try {
    const ragDoc = issueToRagDocument(issue);
    await upsertDocuments([ragDoc], ragConfig.pinecone.namespace.issues);

    console.log(`📄 Indexed issue ${issue.issueId}`);
    return { indexed: true, issueId: issue.issueId };
  } catch (error) {
    console.error(`❌ Failed to index issue ${issue.issueId}:`, error);
    return { indexed: false, error: error.message };
  }
}

/**
 * Index multiple issues in batch
 * @param {Array} issues - Array of Issue documents
 */
export async function indexIssuesBatch(issues) {
  if (!validateRagConfig().configured) {
    return { indexed: 0, reason: "RAG not configured" };
  }

  try {
    const ragDocs = issues.map((issue) => issueToRagDocument(issue));
    await upsertDocuments(ragDocs, ragConfig.pinecone.namespace.issues);

    console.log(`📄 Indexed ${issues.length} issues`);
    return { indexed: issues.length };
  } catch (error) {
    console.error("❌ Failed to batch index issues:", error);
    return { indexed: 0, error: error.message };
  }
}

/**
 * Remove an issue from the index
 * @param {string} issueId - Issue ID to remove
 */
export async function removeIssue(issueId) {
  if (!validateRagConfig().configured) {
    return { removed: false, reason: "RAG not configured" };
  }

  try {
    await deleteDocuments(
      [`issue_${issueId}`],
      ragConfig.pinecone.namespace.issues
    );
    console.log(`🗑️ Removed issue ${issueId} from index`);
    return { removed: true, issueId };
  } catch (error) {
    console.error(`❌ Failed to remove issue ${issueId}:`, error);
    return { removed: false, error: error.message };
  }
}

/**
 * Index a resolution report
 * @param {object} report - Report document (populated with issue)
 */
export async function indexReport(report) {
  if (!validateRagConfig().configured) {
    return { indexed: false, reason: "RAG not configured" };
  }

  try {
    const ragDoc = reportToRagDocument(report);
    await upsertDocuments([ragDoc], ragConfig.pinecone.namespace.issues);

    console.log(`📄 Indexed report ${report._id}`);
    return { indexed: true, reportId: report._id };
  } catch (error) {
    console.error(`❌ Failed to index report:`, error);
    return { indexed: false, error: error.message };
  }
}

/**
 * Rebuild all issue indexes
 * For initial setup or recovery
 */
export async function rebuildIssueIndex() {
  if (!validateRagConfig().configured) {
    return { rebuilt: false, reason: "RAG not configured" };
  }

  console.log("🔄 Starting full issue index rebuild...");

  try {
    // Fetch all issues (consider pagination for large datasets)
    const batchSize = 100;
    let skip = 0;
    let totalIndexed = 0;

    while (true) {
      const issues = await Issue.find({}).skip(skip).limit(batchSize).lean();

      if (issues.length === 0) break;

      const ragDocs = issues.map((issue) => issueToRagDocument(issue));
      await upsertDocuments(ragDocs, ragConfig.pinecone.namespace.issues);

      totalIndexed += issues.length;
      skip += batchSize;

      console.log(`  Progress: ${totalIndexed} issues indexed`);
    }

    console.log(`✅ Issue index rebuild complete: ${totalIndexed} issues`);
    return { rebuilt: true, count: totalIndexed };
  } catch (error) {
    console.error("❌ Issue index rebuild failed:", error);
    return { rebuilt: false, error: error.message };
  }
}

/**
 * Rebuild department metrics
 * Run daily via cron or manual trigger
 */
export async function rebuildMetrics() {
  if (!validateRagConfig().configured) {
    return { rebuilt: false, reason: "RAG not configured" };
  }

  console.log("🔄 Rebuilding department metrics...");

  try {
    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const periodStart = startDate.toISOString().split("T")[0];
    const periodEnd = endDate.toISOString().split("T")[0];

    // Aggregate metrics by department and district
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            department: {
              $switch: {
                branches: [
                  { case: { $eq: ["$category", "pothole"] }, then: "roads" },
                  {
                    case: { $eq: ["$category", "streetlight"] },
                    then: "electricity",
                  },
                  {
                    case: { $eq: ["$category", "garbage"] },
                    then: "sanitation",
                  },
                  {
                    case: { $eq: ["$category", "water"] },
                    then: "water_supply",
                  },
                  { case: { $eq: ["$category", "traffic"] }, then: "traffic" },
                  {
                    case: { $eq: ["$category", "noise"] },
                    then: "pollution_control",
                  },
                  {
                    case: { $eq: ["$category", "safety"] },
                    then: "public_safety",
                  },
                ],
                default: "general",
              },
            },
            districtId: "$districtId",
            category: "$category",
          },
          totalIssues: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          resolutionDays: {
            $push: {
              $cond: [
                { $eq: ["$status", "resolved"] },
                {
                  $divide: [
                    { $subtract: ["$updatedAt", "$createdAt"] },
                    1000 * 60 * 60 * 24,
                  ],
                },
                null,
              ],
            },
          },
        },
      },
    ];

    const results = await Issue.aggregate(pipeline);

    // Group by department + district for final metrics
    const metricsMap = new Map();

    for (const result of results) {
      const key = `${result._id.department}_${result._id.districtId}`;

      if (!metricsMap.has(key)) {
        metricsMap.set(key, {
          department: result._id.department,
          districtId: result._id.districtId || "unknown",
          periodStart,
          periodEnd,
          totalIssues: 0,
          resolvedCount: 0,
          resolutionDays: [],
          byCategory: {},
        });
      }

      const metrics = metricsMap.get(key);
      metrics.totalIssues += result.totalIssues;
      metrics.resolvedCount += result.resolvedCount;

      const validDays = result.resolutionDays.filter((d) => d !== null);
      metrics.resolutionDays.push(...validDays);

      metrics.byCategory[result._id.category] = {
        count: result.totalIssues,
        avgDays:
          validDays.length > 0
            ? validDays.reduce((a, b) => a + b, 0) / validDays.length
            : null,
      };
    }

    // Convert to RAG documents and upsert
    const ragDocs = [];

    for (const metrics of metricsMap.values()) {
      const validDays = metrics.resolutionDays;
      metrics.avgResolutionDays =
        validDays.length > 0
          ? validDays.reduce((a, b) => a + b, 0) / validDays.length
          : null;
      metrics.minResolutionDays =
        validDays.length > 0 ? Math.min(...validDays) : null;
      metrics.maxResolutionDays =
        validDays.length > 0 ? Math.max(...validDays) : null;

      delete metrics.resolutionDays; // Clean up

      const ragDoc = buildDepartmentMetricsDocument(metrics);
      ragDocs.push(ragDoc);
    }

    if (ragDocs.length > 0) {
      await upsertDocuments(ragDocs, ragConfig.pinecone.namespace.metrics);
    }

    console.log(`✅ Department metrics rebuilt: ${ragDocs.length} documents`);
    return { rebuilt: true, count: ragDocs.length };
  } catch (error) {
    console.error("❌ Metrics rebuild failed:", error);
    return { rebuilt: false, error: error.message };
  }
}

/**
 * Rebuild ward statistics
 * Run daily via cron or manual trigger
 */
export async function rebuildWardStats() {
  if (!validateRagConfig().configured) {
    return { rebuilt: false, reason: "RAG not configured" };
  }

  console.log("🔄 Rebuilding ward statistics...");

  try {
    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const periodStart = startDate.toISOString().split("T")[0];
    const periodEnd = endDate.toISOString().split("T")[0];

    // Aggregate by district
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          districtId: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            districtId: "$districtId",
            ward: "$location.district",
            category: "$category",
          },
          totalIssues: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          avgWaitDays: {
            $avg: {
              $cond: [
                { $eq: ["$status", "resolved"] },
                {
                  $divide: [
                    { $subtract: ["$updatedAt", "$createdAt"] },
                    1000 * 60 * 60 * 24,
                  ],
                },
                null,
              ],
            },
          },
        },
      },
    ];

    const results = await Issue.aggregate(pipeline);

    // Group by district for final stats
    const statsMap = new Map();

    for (const result of results) {
      const key = `${result._id.districtId}_${result._id.ward}`;

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          districtId: result._id.districtId,
          ward: result._id.ward,
          periodStart,
          periodEnd,
          issueDistribution: {},
          resolutionRates: {},
          avgWaitTimes: {},
          totalIssues: 0,
        });
      }

      const stats = statsMap.get(key);
      stats.totalIssues += result.totalIssues;
      stats.issueDistribution[result._id.category] = {
        count: result.totalIssues,
        percentage: 0, // Calculate after all data
      };
      stats.resolutionRates[result._id.category] =
        result.totalIssues > 0
          ? Math.round((result.resolvedCount / result.totalIssues) * 100)
          : 0;
      stats.avgWaitTimes[result._id.category] = result.avgWaitDays
        ? result.avgWaitDays.toFixed(1)
        : "N/A";
    }

    // Calculate percentages
    for (const stats of statsMap.values()) {
      for (const [cat, data] of Object.entries(stats.issueDistribution)) {
        data.percentage =
          stats.totalIssues > 0
            ? Math.round((data.count / stats.totalIssues) * 100)
            : 0;
      }
    }

    // Convert to RAG documents and upsert
    const ragDocs = Array.from(statsMap.values()).map(buildWardStatsDocument);

    if (ragDocs.length > 0) {
      await upsertDocuments(ragDocs, ragConfig.pinecone.namespace.wardStats);
    }

    console.log(`✅ Ward statistics rebuilt: ${ragDocs.length} documents`);
    return { rebuilt: true, count: ragDocs.length };
  } catch (error) {
    console.error("❌ Ward stats rebuild failed:", error);
    return { rebuilt: false, error: error.message };
  }
}

/**
 * Get indexer status
 */
export async function getIndexerStatus() {
  const stats = await getIndexStats();
  return {
    configured: validateRagConfig().configured,
    stats,
  };
}

/**
 * Prune old resolved issues (>6 months)
 */
export async function pruneOldIssues() {
  if (!validateRagConfig().configured) {
    return { pruned: false, reason: "RAG not configured" };
  }

  console.log("🧹 Pruning old issues from index...");

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Find old resolved issues
    const oldIssues = await Issue.find({
      status: "resolved",
      updatedAt: { $lt: sixMonthsAgo },
    })
      .select("issueId")
      .lean();

    if (oldIssues.length === 0) {
      console.log("No old issues to prune");
      return { pruned: true, count: 0 };
    }

    const idsToDelete = oldIssues.map((issue) => `issue_${issue.issueId}`);
    await deleteDocuments(idsToDelete, ragConfig.pinecone.namespace.issues);

    console.log(`✅ Pruned ${oldIssues.length} old issues`);
    return { pruned: true, count: oldIssues.length };
  } catch (error) {
    console.error("❌ Prune failed:", error);
    return { pruned: false, error: error.message };
  }
}

export const ragIndexer = {
  indexIssue,
  indexIssuesBatch,
  removeIssue,
  indexReport,
  rebuildIssueIndex,
  rebuildMetrics,
  rebuildWardStats,
  getIndexerStatus,
  pruneOldIssues,
};

export default ragIndexer;
