/**
 * Query Processor
 * Analyzes and classifies user queries before RAG processing
 */

import { ChatOpenAI } from "@langchain/openai";
import ragConfig from "./config.js";
import { QUERY_CLASSIFIER_PROMPT, BLOCKED_QUERY_RESPONSES } from "./prompts.js";

// Allowed query categories
const ALLOWED_CATEGORIES = [
  "status_explanation",
  "delay_context",
  "historical_pattern",
  "department_performance",
  "process_clarification",
  "timeline_estimation",
];

// Blocked query categories
const BLOCKED_CATEGORIES = [
  "action_request",
  "personal_data",
  "off_topic",
  "complaint",
];

// Simple keyword-based pre-filter (fast, no LLM call)
const ACTION_KEYWORDS = [
  "change",
  "update",
  "modify",
  "delete",
  "remove",
  "assign",
  "transfer",
  "close",
  "reopen",
  "cancel",
  "escalate",
];

const PERSONAL_DATA_KEYWORDS = [
  "other user",
  "someone else",
  "their info",
  "their address",
  "phone number",
  "email address",
  "personal details",
];

/**
 * Pre-filter query using keywords (fast, no LLM)
 * @param {string} query - User query
 * @returns {object|null} Blocked response or null if allowed
 */
export function preFilterQuery(query) {
  const lowerQuery = query.toLowerCase();

  // Check for action requests
  if (ACTION_KEYWORDS.some((kw) => lowerQuery.includes(kw))) {
    // Check if it's asking HOW to do something (allowed)
    if (lowerQuery.includes("how do i") || lowerQuery.includes("how to")) {
      return null; // Allow - it's a process question
    }
    // Check for imperative mood (blocked)
    if (
      /^(please\s+)?(change|update|delete|assign|close|reopen)/i.test(query)
    ) {
      return {
        blocked: true,
        category: "action_request",
        response: BLOCKED_QUERY_RESPONSES.action_request,
      };
    }
  }

  // Check for personal data requests
  if (PERSONAL_DATA_KEYWORDS.some((kw) => lowerQuery.includes(kw))) {
    return {
      blocked: true,
      category: "personal_data",
      response: BLOCKED_QUERY_RESPONSES.personal_data,
    };
  }

  return null;
}

/**
 * Classify query using LLM (more accurate, slower)
 * @param {string} query - User query
 * @returns {Promise<object>} Classification result
 */
export async function classifyQueryWithLLM(query) {
  if (!ragConfig.llm.openaiApiKey) {
    // Fallback: allow all queries if LLM not available
    return { category: "status_explanation", allowed: true };
  }

  try {
    const llm = new ChatOpenAI({
      openAIApiKey: ragConfig.llm.openaiApiKey,
      modelName: "gpt-4o-mini",
      temperature: 0,
      maxTokens: 50,
    });

    const prompt = QUERY_CLASSIFIER_PROMPT.replace("{query}", query);
    const response = await llm.invoke(prompt);
    const category = response.content
      .trim()
      .toLowerCase()
      .replace(/[^a-z_]/g, "");

    const isAllowed = ALLOWED_CATEGORIES.includes(category);
    const isBlocked = BLOCKED_CATEGORIES.includes(category);

    return {
      category,
      allowed: isAllowed,
      blocked: isBlocked,
      response: isBlocked ? BLOCKED_QUERY_RESPONSES[category] : null,
    };
  } catch (error) {
    console.error("Query classification failed:", error.message || error);

    // Check if it's a rate limit error
    if (
      error.status === 429 ||
      error.message?.includes("429") ||
      error.message?.includes("quota")
    ) {
      return {
        category: "rate_limited",
        allowed: false,
        blocked: true,
        response:
          "I'm receiving too many requests right now. Please wait a moment and try again.",
        retryAfter: 60,
      };
    }

    // Fallback: allow the query for other errors
    return { category: "status_explanation", allowed: true };
  }
}

/**
 * Full query classification pipeline
 * @param {string} query - User query
 * @returns {Promise<object>} Classification result
 */
export async function classifyQuery(query) {
  // Step 1: Fast keyword pre-filter
  const preFilter = preFilterQuery(query);
  if (preFilter?.blocked) {
    return preFilter;
  }

  // Step 2: LLM classification for ambiguous queries
  const llmResult = await classifyQueryWithLLM(query);
  return llmResult;
}

/**
 * Extract entities from query for metadata filtering
 * @param {string} query - User query
 * @param {object} context - Additional context (issueId, districtId)
 * @returns {object} Extracted entities
 */
export function extractQueryEntities(query, context = {}) {
  const entities = {
    issueId: context.issueId || null,
    districtId: context.districtId || null,
    category: null,
    department: null,
    timeframe: null,
  };

  const lowerQuery = query.toLowerCase();

  // Extract issue ID pattern
  const issueIdMatch = query.match(/ISS-\d+/i);
  if (issueIdMatch) {
    entities.issueId = issueIdMatch[0].toUpperCase();
  }

  // Extract category
  const categories = [
    "pothole",
    "streetlight",
    "garbage",
    "water",
    "traffic",
    "noise",
    "safety",
  ];
  for (const cat of categories) {
    if (lowerQuery.includes(cat)) {
      entities.category = cat;
      break;
    }
  }

  // Extract department
  const departments = {
    roads: ["roads", "road", "infrastructure", "potholes"],
    electricity: ["electricity", "electric", "streetlight", "light"],
    sanitation: ["sanitation", "garbage", "waste", "trash"],
    water_supply: ["water", "supply", "drainage"],
    traffic: ["traffic", "transport", "signal"],
  };

  for (const [dept, keywords] of Object.entries(departments)) {
    if (keywords.some((kw) => lowerQuery.includes(kw))) {
      entities.department = dept;
      break;
    }
  }

  // Extract timeframe
  const timeframePatterns = [
    { pattern: /(\d+)\s*days?/i, unit: "days" },
    { pattern: /(\d+)\s*weeks?/i, unit: "weeks" },
    { pattern: /(\d+)\s*months?/i, unit: "months" },
    { pattern: /last\s+(week|month|year)/i, unit: "relative" },
  ];

  for (const { pattern, unit } of timeframePatterns) {
    const match = query.match(pattern);
    if (match) {
      entities.timeframe = { value: match[1] || match[0], unit };
      break;
    }
  }

  return entities;
}

/**
 * Build Pinecone filter from extracted entities
 * @param {object} entities - Extracted entities
 * @returns {object} Pinecone filter object
 */
export function buildMetadataFilter(entities) {
  const filter = {};

  if (entities.issueId) {
    filter.issueId = { $eq: entities.issueId };
  }

  if (entities.districtId) {
    filter.districtId = { $eq: entities.districtId };
  }

  if (entities.category) {
    filter.category = { $eq: entities.category };
  }

  if (entities.department) {
    filter.department = { $eq: entities.department };
  }

  return filter;
}

export default {
  preFilterQuery,
  classifyQuery,
  classifyQueryWithLLM,
  extractQueryEntities,
  buildMetadataFilter,
};
