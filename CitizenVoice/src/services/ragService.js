/**
 * RAG Service
 * Frontend API client for the RAG transparency system
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance with credentials
const api = axios.create({
  baseURL: `${API_URL}/rag`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Ask the RAG system to explain something
 * @param {object} params - Query parameters
 * @param {string} params.query - The user's question
 * @param {string} [params.issueId] - Optional issue ID for context
 * @param {string} [params.districtId] - Optional district ID for filtering
 * @returns {Promise<object>} RAG response
 */
export async function explain({ query, issueId, districtId }) {
  try {
    const response = await api.post("/explain", {
      query,
      issueId,
      districtId,
    });
    return response.data;
  } catch (error) {
    // Handle rate limiting
    if (error.response?.status === 429) {
      return {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many questions. Please wait a moment.",
          retryAfter: error.response.headers["retry-after"] || 60,
        },
      };
    }

    // Handle other errors
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message:
          error.response?.data?.message || "Unable to connect to AI service",
      },
    };
  }
}

/**
 * Get RAG system status
 * @returns {Promise<object>} Status information
 */
export async function getStatus() {
  try {
    const response = await api.get("/status");
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: {
        enabled: false,
        configured: false,
      },
    };
  }
}

/**
 * Predefined question templates for common queries
 */
export const questionTemplates = {
  whyPending: (issueId) => ({
    query: `Why is issue ${issueId} still pending?`,
    issueId,
  }),

  isDelayNormal: (category, district) => ({
    query: `Is this delay normal for ${category} issues in ${district}?`,
    districtId: district,
  }),

  departmentPerformance: (department, district) => ({
    query: `How does the ${department} department perform in resolving issues?`,
    districtId: district,
  }),

  similarIssues: (category, location) => ({
    query: `Have there been similar ${category} issues near ${location}?`,
  }),

  processExplanation: () => ({
    query:
      "What happens after an issue is reported? What are the typical steps?",
  }),

  timelineEstimate: (category) => ({
    query: `How long do ${category} issues typically take to resolve?`,
  }),
};

/**
 * Format category for display
 */
export function formatCategory(category) {
  const names = {
    pothole: "Pothole",
    streetlight: "Streetlight",
    garbage: "Garbage",
    water: "Water Supply",
    traffic: "Traffic",
    noise: "Noise",
    safety: "Safety",
    other: "Other",
  };
  return names[category] || category;
}

/**
 * Format department for display
 */
export function formatDepartment(department) {
  const names = {
    roads: "Roads & Infrastructure",
    electricity: "Electricity",
    sanitation: "Sanitation",
    water_supply: "Water Supply",
    traffic: "Traffic & Transport",
    pollution_control: "Pollution Control",
    public_safety: "Public Safety",
    general: "General Services",
  };
  return names[department] || department;
}

export const ragService = {
  explain,
  getStatus,
  questionTemplates,
  formatCategory,
  formatDepartment,
};

export default ragService;
