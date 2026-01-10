import { ragService } from "../services/ragService.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

/**
 * Explain query - main RAG endpoint for frontend chat
 * POST /api/rag/explain
 */
export const explainQuery = asyncHandler(async (req, res) => {
  const { query, issueId, districtId } = req.body;

  if (!query || query.trim().length < 3) {
    throw new ApiError(400, "Query must be at least 3 characters");
  }

  const filters = {
    ...(issueId && { issueId }),
    ...(districtId && { location: { city: districtId } }),
  };

  const result = await ragService.getContextualHelp(query, filters);

  res.json({
    success: true,
    data: {
      answer: result.answer,
      confidence: result.confidence,
      sources:
        result.similarCases?.map((c) => ({ type: "issue", id: c.id })) || [],
      disclaimer:
        "This is an AI-generated explanation based on historical data.",
    },
  });
});

/**
 * Get RAG system status
 * GET /api/rag/status
 */
export const getRagStatus = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      enabled: true,
      configured: true,
      model: "gpt-4o-mini",
    },
  });
});

/**
 * Get AI assistance for reporting an issue
 * POST /api/rag/assistance
 */
export const getAssistance = asyncHandler(async (req, res) => {
  const { query, category, location } = req.body;

  if (!query || query.trim().length < 5) {
    throw new ApiError(400, "Query must be at least 5 characters");
  }

  const filters = {
    ...(category && { category }),
    ...(location && { location }),
  };

  const result = await ragService.getContextualHelp(query, filters);

  res.json(new ApiResponse(200, result, "Assistance generated successfully"));
});

/**
 * Get verification recommendations
 * GET /api/rag/recommendations
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const recommendations = await ragService.getVerificationRecommendations(
    userId
  );

  res.json(new ApiResponse(200, recommendations, "Recommendations generated"));
});

/**
 * Get chat-style conversation
 * POST /api/rag/chat
 */
export const chatWithAssistant = asyncHandler(async (req, res) => {
  const { messages, context } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, "Messages array is required");
  }

  // Implementation for multi-turn conversation
  // Store conversation history in session/database if needed

  res.json(
    new ApiResponse(
      200,
      {
        reply: "Chat feature coming soon",
      },
      "Chat processed"
    )
  );
});

export default {
  explainQuery,
  getRagStatus,
  getAssistance,
  getRecommendations,
  chatWithAssistant,
};
