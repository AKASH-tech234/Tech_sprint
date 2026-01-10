/**
 * RAG Configuration
 * Central configuration and validation for the RAG system
 */

export const ragConfig = {
  // Master switch
  enabled: process.env.RAG_ENABLED === "true",

  // Pinecone settings
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    indexName: process.env.PINECONE_INDEX_NAME || "citizenvoice-rag",
    environment: process.env.PINECONE_ENVIRONMENT || "us-east-1",
    namespace: {
      issues: "issues",
      metrics: "metrics",
      wardStats: "ward_stats",
      processDocs: "process_docs",
    },
  },

  // LLM settings
  llm: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY_RAG || process.env.OPENAI_API_KEY,
    maxTokens: parseInt(process.env.RAG_MAX_TOKENS || "500", 10),
    temperature: parseFloat(process.env.RAG_TEMPERATURE || "0.1"),
    model: "gpt-4o-mini",
  },

  // Embedding settings
  embedding: {
    model: "text-embedding-3-small",
    dimensions: 1536,
    batchSize: 100,
  },

  // Retrieval settings
  retrieval: {
    topK: parseInt(process.env.RAG_TOP_K_RESULTS || "5", 10),
    minScore: 0.7, // Minimum similarity score
    maxContextLength: 4000, // Max tokens for context
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RAG_RATE_LIMIT_WINDOW_MS || "60000", 10),
    maxRequests: parseInt(process.env.RAG_RATE_LIMIT_MAX_REQUESTS || "10", 10),
  },

  // Cache settings
  cache: {
    ttl: parseInt(process.env.RAG_CACHE_TTL || "300", 10), // 5 minutes
    maxSize: 1000, // Max cached queries
  },

  // Timeouts
  timeouts: {
    embedding: 10000, // 10 seconds
    retrieval: 5000, // 5 seconds
    llm: 15000, // 15 seconds
  },
};

/**
 * Check if RAG is properly configured
 * @returns {object} { configured: boolean, missing: string[] }
 */
export function validateRagConfig() {
  const required = [
    { key: "PINECONE_API_KEY", value: ragConfig.pinecone.apiKey },
    { key: "GEMINI_API_KEY", value: ragConfig.llm.geminiApiKey },
  ];

  const missing = required
    .filter((item) => !item.value)
    .map((item) => item.key);

  if (missing.length > 0) {
    console.warn(`⚠️ RAG disabled: missing ${missing.join(", ")}`);
    return { configured: false, missing };
  }

  if (!ragConfig.enabled) {
    console.info("ℹ️ RAG is disabled via RAG_ENABLED=false");
    return { configured: false, missing: [], reason: "disabled" };
  }

  return { configured: true, missing: [] };
}

/**
 * Get the current RAG status
 */
export function getRagStatus() {
  const validation = validateRagConfig();
  return {
    enabled: ragConfig.enabled,
    configured: validation.configured,
    missing: validation.missing,
    reason: validation.reason,
    endpoints: validation.configured
      ? {
          explain: "/api/rag/explain",
          status: "/api/rag/status",
        }
      : null,
  };
}

export default ragConfig;
