/**
 * RAG Main Orchestrator
 * Central module that coordinates the entire RAG pipeline
 */

import { ChatOpenAI } from "@langchain/openai";
import ragConfig, { validateRagConfig } from "./config.js";
import { initPinecone, querySimilar } from "./vectorStore.js";
import { initEmbeddings } from "./embeddings.js";
import {
  classifyQuery,
  extractQueryEntities,
  buildMetadataFilter,
} from "./queryProcessor.js";
import {
  buildPrompt,
  formatContextFromDocs,
  RAG_DISABLED_RESPONSE,
  ERROR_RESPONSES,
} from "./prompts.js";
import { ragCache } from "./cache.js";
import Issue from "../models/Issue.js";

// Audit logging model (optional)
let RagAuditLog = null;
try {
  // Dynamic import - won't fail if model doesn't exist
  const auditModule = await import("../models/RagAuditLog.js");
  RagAuditLog = auditModule.default;
} catch (e) {
  // Audit logging disabled
}

/**
 * Initialize the RAG system
 * Call this at app startup
 */
export async function initRag() {
  const validation = validateRagConfig();

  if (!validation.configured) {
    console.log(
      "ℹ️ RAG system not initialized:",
      validation.reason || `missing ${validation.missing.join(", ")}`
    );
    return {
      initialized: false,
      reason: validation.reason || validation.missing,
    };
  }

  try {
    await initPinecone();
    initEmbeddings();
    console.log("✅ RAG system initialized successfully");
    return { initialized: true };
  } catch (error) {
    console.error("❌ RAG initialization failed:", error);
    return { initialized: false, error: error.message };
  }
}

/**
 * Main explain function - the primary RAG interface
 * @param {object} params - Query parameters
 * @param {string} params.query - User's question
 * @param {string} params.issueId - Optional issue ID for context
 * @param {string} params.districtId - Optional district ID for filtering
 * @param {string} params.userId - User ID for logging
 * @returns {Promise<object>} RAG response
 */
export async function explain({ query, issueId, districtId, userId }) {
  const startTime = Date.now();

  // Check if RAG is configured
  if (!validateRagConfig().configured) {
    return RAG_DISABLED_RESPONSE;
  }

  // Check cache first
  const cached = ragCache.get(query, issueId, districtId);
  if (cached) {
    return {
      success: true,
      data: cached,
    };
  }

  try {
    // Step 1: Classify the query
    const classification = await classifyQuery(query);

    if (classification.blocked) {
      return {
        success: true,
        data: classification.response,
      };
    }

    // Step 2: Extract entities for filtering
    const entities = extractQueryEntities(query, { issueId, districtId });
    const metadataFilter = buildMetadataFilter(entities);

    // Step 3: Get issue context if issueId provided
    let issueContext = null;
    if (issueId || entities.issueId) {
      const targetIssueId = issueId || entities.issueId;
      issueContext = await Issue.findOne({ issueId: targetIssueId }).lean();
    }

    // Step 4: Query vector store for relevant documents
    const retrievedDocs = await querySimilar(query, {
      topK: ragConfig.retrieval.topK,
      filter: metadataFilter,
      namespace: ragConfig.pinecone.namespace.issues,
    });

    // Also query metrics if relevant
    let metricsDocs = [];
    if (
      classification.category === "department_performance" ||
      classification.category === "delay_context"
    ) {
      metricsDocs = await querySimilar(query, {
        topK: 2,
        filter: { districtId: districtId || entities.districtId },
        namespace: ragConfig.pinecone.namespace.metrics,
      });
    }

    // Step 5: Build context from retrieved documents
    const allDocs = [...retrievedDocs, ...metricsDocs];

    // Add current issue to context if available
    if (issueContext) {
      const issueText = `
[Current Issue - ${issueContext.issueId}]
Title: ${issueContext.title}
Category: ${issueContext.category}
Status: ${issueContext.status}
Priority: ${issueContext.priority}
Reported: ${new Date(issueContext.createdAt).toISOString().split("T")[0]}
Last Updated: ${new Date(issueContext.updatedAt).toISOString().split("T")[0]}
Description: ${issueContext.description}
Verification Count: ${issueContext.verifiedCount || 0}
---`;

      allDocs.unshift({
        textContent: issueText,
        metadata: { docType: "current_issue" },
      });
    }

    const contextText = formatContextFromDocs(allDocs);

    // Step 6: Generate response with LLM
    const llm = new ChatOpenAI({
      openAIApiKey: ragConfig.llm.openaiApiKey,
      modelName: ragConfig.llm.model,
      temperature: ragConfig.llm.temperature,
      maxTokens: ragConfig.llm.maxTokens,
    });

    const prompt = buildPrompt(contextText, query);
    const llmResponse = await llm.invoke(prompt);

    // Step 7: Build final response
    const answer = llmResponse.content;
    const sources = allDocs.slice(0, 3).map((doc) => ({
      type: doc.metadata?.docType || "unknown",
      id: doc.metadata?.issueId || doc.id || null,
      relevance: doc.score || null,
    }));

    const confidence =
      retrievedDocs.length >= 3
        ? "high"
        : retrievedDocs.length >= 1
        ? "medium"
        : "low";

    const responseData = {
      answer,
      confidence,
      sources,
      queryCategory: classification.category,
      disclaimer:
        "This is an AI-generated explanation based on historical data and may not reflect real-time status.",
      processingTimeMs: Date.now() - startTime,
    };

    // Cache the response
    ragCache.set(query, issueId, districtId, responseData);

    // Audit log (non-blocking)
    if (RagAuditLog && userId) {
      RagAuditLog.create({
        userId,
        query,
        issueId,
        response: answer.substring(0, 1000),
        sources: sources.map((s) => s.id).filter(Boolean),
        confidence,
        timestamp: new Date(),
        processingTimeMs: Date.now() - startTime,
      }).catch((err) => console.error("Audit log failed:", err));
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error("RAG explain error:", error.message || error);

    // Check for rate limit errors first
    if (
      error.status === 429 ||
      error.message?.includes("429") ||
      error.message?.includes("Too Many Requests")
    ) {
      return {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message:
            "I'm receiving too many requests. Please wait a minute and try again.",
          retryAfter: 60,
        },
      };
    }

    // Determine error type and return appropriate response
    if (error.message?.includes("timeout")) {
      return ERROR_RESPONSES.timeout;
    }
    if (
      error.message?.includes("Pinecone") ||
      error.message?.includes("vector")
    ) {
      return ERROR_RESPONSES.vectorStoreError;
    }
    if (error.message?.includes("Gemini") || error.message?.includes("quota")) {
      return ERROR_RESPONSES.llmError;
    }

    // Generic error
    return {
      success: false,
      error: {
        code: "RAG_ERROR",
        message: "Unable to generate explanation. Please try again.",
        retryAfter: 30,
      },
    };
  }
}

/**
 * Get RAG system status
 */
export async function getStatus() {
  const validation = validateRagConfig();
  const cacheStats = ragCache.getStats();

  return {
    enabled: ragConfig.enabled,
    configured: validation.configured,
    missing: validation.missing,
    cache: cacheStats,
    config: {
      model: ragConfig.llm.model,
      indexName: ragConfig.pinecone.indexName,
      topK: ragConfig.retrieval.topK,
    },
  };
}

/**
 * Clear RAG cache
 */
export function clearCache() {
  ragCache.clear();
  return { cleared: true };
}

export default {
  initRag,
  explain,
  getStatus,
  clearCache,
};
