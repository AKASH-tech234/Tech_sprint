/**
 * RAG Prompt Templates
 * All prompts used by the RAG system
 */

/**
 * System prompt for citizen explanation queries
 */
export const CITIZEN_SYSTEM_PROMPT = `You are a transparency assistant for CitizenVoice, a civic issue tracking platform used by citizens to report and track local issues like potholes, garbage, streetlights, etc.

CRITICAL RULES - YOU MUST FOLLOW EXACTLY:

1. ONLY use information from the RETRIEVED CONTEXT provided below
2. If the context doesn't contain enough information, say: "I don't have specific data about this in my records. Based on general patterns in your area..."
3. NEVER make up statistics, dates, department names, or issue IDs
4. NEVER suggest actions the user should take (like "contact the department" or "file a complaint")
5. NEVER claim to know real-time status - always say "based on available data" or "historically"
6. Use simple, citizen-friendly language - avoid jargon
7. Always mention specific departments and timeframes when they appear in the context
8. If asked to take action (change status, assign, delete, etc.), respond: "I can only provide explanations based on historical data. Please use the dashboard to take any actions on your issue."

RESPONSE FORMAT:
- Keep answers under 200 words
- Use bullet points for lists
- Be empathetic - citizens are often frustrated about delays
- End with: "This is based on historical data and may not reflect real-time status."

RETRIEVED CONTEXT:
{context}

USER QUESTION: {question}

Provide a clear, helpful, and factual explanation based ONLY on the context above:`;

/**
 * Query classification prompt
 */
export const QUERY_CLASSIFIER_PROMPT = `Classify this user query into exactly one of these categories:

ALLOWED (proceed with RAG retrieval):
- status_explanation: Asking why an issue has a certain status or what happened
- delay_context: Asking if a delay is normal or expected
- historical_pattern: Asking about similar past issues or patterns
- department_performance: Asking about how a department performs
- process_clarification: Asking how the system or process works
- timeline_estimation: Asking how long something typically takes

BLOCKED (reject without RAG):
- action_request: Asking to change, delete, assign, or modify something
- personal_data: Asking for other users' information or private data
- off_topic: Not related to civic issues at all
- complaint: Just venting without asking a question

User Query: "{query}"

Respond with ONLY the category name (e.g., "status_explanation" or "action_request"), nothing else.`;

/**
 * Context enrichment prompt - extracts key entities from query
 */
export const ENTITY_EXTRACTION_PROMPT = `Extract key entities from this civic issue query. Return a JSON object.

Query: "{query}"

Extract and return as JSON:
{
  "issueId": "ISS-xxx if mentioned, otherwise null",
  "category": "pothole|streetlight|garbage|water|traffic|noise|safety|other if mentioned, otherwise null",
  "district": "district name if mentioned, otherwise null",
  "ward": "ward/area name if mentioned, otherwise null",
  "department": "department name if mentioned, otherwise null",
  "timeframe": "time period if mentioned (e.g., '5 days', 'last week'), otherwise null",
  "intent": "explain_status|compare_delay|find_similar|department_info|process_info"
}

Return ONLY valid JSON, no other text.`;

/**
 * Response when insufficient data is found
 */
export const INSUFFICIENT_DATA_TEMPLATE = `I don't have specific data about this in my records.

Here's what I can share based on general patterns in your area:

{generalInfo}

For the most accurate and up-to-date information about your specific issue, please check the issue details on your dashboard.

This is based on historical data and may not reflect real-time status.`;

/**
 * Response when RAG is disabled
 */
export const RAG_DISABLED_RESPONSE = {
  success: false,
  error: {
    code: "RAG_DISABLED",
    message: "AI explanations are currently not available",
    fallback:
      "Please check your issue details on the dashboard for status information.",
  },
};

/**
 * Response when query is blocked
 */
export const BLOCKED_QUERY_RESPONSES = {
  action_request: {
    answer:
      "I can only provide explanations and historical context. To take actions like changing status, assigning issues, or updating information, please use the relevant buttons and forms on your dashboard.",
    confidence: "high",
    sources: [],
    disclaimer: "I am an explanation assistant, not an action system.",
  },
  personal_data: {
    answer:
      "I cannot provide information about other users or private data. I can only help explain issue statuses, delays, and historical patterns.",
    confidence: "high",
    sources: [],
    disclaimer: "Privacy restrictions apply.",
  },
  off_topic: {
    answer:
      "I'm designed to help explain civic issues tracked in CitizenVoice - things like potholes, garbage, streetlights, and other local infrastructure problems. Could you ask a question related to a civic issue?",
    confidence: "high",
    sources: [],
    disclaimer: "I specialize in civic issue explanations.",
  },
  complaint: {
    answer:
      "I understand you're frustrated. To help you better, could you ask a specific question? For example: 'Why is my issue still pending?' or 'Is this delay normal for pothole issues?'",
    confidence: "medium",
    sources: [],
    disclaimer: "Please ask a specific question for a helpful response.",
  },
};

/**
 * Error response templates
 */
export const ERROR_RESPONSES = {
  timeout: {
    success: false,
    error: {
      code: "RAG_TIMEOUT",
      message: "The request took too long. Please try a simpler question.",
      retryAfter: 30,
    },
  },
  vectorStoreError: {
    success: false,
    error: {
      code: "RETRIEVAL_ERROR",
      message:
        "Unable to search historical data right now. Please try again later.",
      retryAfter: 60,
    },
  },
  llmError: {
    success: false,
    error: {
      code: "LLM_ERROR",
      message:
        "Unable to generate explanation. Showing retrieved data instead.",
      retryAfter: 60,
    },
  },
  rateLimited: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message:
        "Too many requests. Please wait a moment before asking another question.",
      retryAfter: 60,
    },
  },
};

/**
 * Build the full prompt with context and question
 */
export function buildPrompt(context, question) {
  return CITIZEN_SYSTEM_PROMPT.replace("{context}", context).replace(
    "{question}",
    question
  );
}

/**
 * Format retrieved documents into context string
 */
export function formatContextFromDocs(documents) {
  if (!documents || documents.length === 0) {
    return "No relevant historical data found.";
  }

  return documents
    .map((doc, index) => {
      const metadata = doc.metadata || {};
      const docType = metadata.docType || "unknown";
      const content = doc.pageContent || doc.textContent || "";

      return `[Document ${index + 1} - ${docType}]
${content}
---`;
    })
    .join("\n\n");
}

export default {
  CITIZEN_SYSTEM_PROMPT,
  QUERY_CLASSIFIER_PROMPT,
  ENTITY_EXTRACTION_PROMPT,
  INSUFFICIENT_DATA_TEMPLATE,
  RAG_DISABLED_RESPONSE,
  BLOCKED_QUERY_RESPONSES,
  ERROR_RESPONSES,
  buildPrompt,
  formatContextFromDocs,
};
