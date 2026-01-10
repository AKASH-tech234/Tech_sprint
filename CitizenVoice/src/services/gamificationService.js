/**
 * Gamification Service
 * Frontend API service for outcome-driven gamification system
 */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Create axios instance with auth
const api = axios.create({
  baseURL: `${API_BASE_URL}/gamification`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(
      `📤 [Gamification API] ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ [Gamification API Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Request failed";
    console.error("❌ [Gamification API Error]", message);
    throw new Error(message);
  }
);

class GamificationService {
  /**
   * Get user's gamification profile
   * @param {string} districtId - Optional district ID for community-scoped profile
   */
  async getUserProfile(districtId = null) {
    const params = districtId ? { districtId } : {};
    const { data } = await api.get("/profile", { params });
    return data.data;
  }

  /**
   * Get community-scoped leaderboard
   * @param {string} districtId - District/community ID
   * @param {number} limit - Number of results to return
   */
  async getCommunityLeaderboard(districtId, limit = 20) {
    const { data } = await api.get(
      `/leaderboard/${encodeURIComponent(districtId)}`,
      {
        params: { limit },
      }
    );
    return data.data;
  }

  /**
   * Get global leaderboard (legacy)
   * @param {string} timeframe - 'all', 'weekly', 'monthly'
   * @param {number} limit - Number of results
   */
  async getLeaderboard(timeframe = "all", limit = 100) {
    const { data } = await api.get("/leaderboard", {
      params: { timeframe, limit },
    });
    return data.data;
  }

  /**
   * Get user's RP history
   * @param {string} districtId - Optional district filter
   * @param {number} limit - Number of results
   */
  async getRPHistory(districtId = null, limit = 20) {
    const params = { limit };
    if (districtId) params.districtId = districtId;

    const { data } = await api.get("/rp-history", { params });
    return data.data;
  }

  /**
   * Get activity timeline
   * @param {number} limit - Number of activities
   */
  async getActivityTimeline(limit = 20) {
    const { data } = await api.get("/activity", { params: { limit } });
    return data.data;
  }

  /**
   * Get badges and achievements
   */
  async getBadgesAndAchievements() {
    const { data } = await api.get("/badges");
    return data.data;
  }

  /**
   * Get community impact score
   * @param {string} districtId - District/community ID
   */
  async getCommunityImpactScore(districtId) {
    const { data } = await api.get(`/impact/${encodeURIComponent(districtId)}`);
    return data.data;
  }

  /**
   * Get role progression info
   */
  async getRoleProgression() {
    const { data } = await api.get("/roles");
    return data.data;
  }

  /**
   * Compare with another user
   * @param {string} userId - User ID to compare with
   */
  async compareWithUser(userId) {
    const { data } = await api.get(`/compare/${userId}`);
    return data.data;
  }

  /**
   * Get role display info
   * @param {string} role - Role identifier
   */
  getRoleInfo(role) {
    const roles = {
      resident: {
        displayName: "Resident",
        icon: "🏠",
        color: "gray",
        threshold: 0,
      },
      civic_helper: {
        displayName: "Civic Helper",
        icon: "🤝",
        color: "blue",
        threshold: 50,
      },
      community_validator: {
        displayName: "Community Validator",
        icon: "✅",
        color: "purple",
        threshold: 120,
      },
      civic_champion: {
        displayName: "Civic Champion",
        icon: "🏆",
        color: "gold",
        threshold: 300,
      },
    };
    return roles[role] || roles.resident;
  }

  /**
   * Get RP action info
   * @param {string} eventType - Event type identifier
   */
  getRPActionInfo(eventType) {
    const actions = {
      issue_verified_resolved: {
        label: "Issue Resolved",
        points: 10,
        icon: "✅",
      },
      after_photo_uploaded: { label: "After Photo", points: 8, icon: "📸" },
      accurate_categorization: {
        label: "Accurate Category",
        points: 5,
        icon: "🎯",
      },
      false_resolution_flagged: {
        label: "False Resolution Flag",
        points: 12,
        icon: "🚩",
      },
      community_confirmed_report: {
        label: "Community Confirmed",
        points: 15,
        icon: "👥",
      },
      fake_issue_penalty: { label: "Fake Issue", points: -20, icon: "❌" },
      spam_penalty: { label: "Spam", points: -10, icon: "⚠️" },
    };
    return actions[eventType] || { label: eventType, points: 0, icon: "?" };
  }

  /**
   * Calculate progress to next role
   * @param {number} currentRP - Current RP
   */
  getProgressToNextRole(currentRP) {
    if (currentRP >= 300) {
      return { role: "civic_champion", progress: 100, achieved: true };
    }
    if (currentRP >= 120) {
      return {
        role: "civic_champion",
        progress: Math.round(((currentRP - 120) / (300 - 120)) * 100),
        rpNeeded: 300 - currentRP,
        nextThreshold: 300,
      };
    }
    if (currentRP >= 50) {
      return {
        role: "community_validator",
        progress: Math.round(((currentRP - 50) / (120 - 50)) * 100),
        rpNeeded: 120 - currentRP,
        nextThreshold: 120,
      };
    }
    return {
      role: "civic_helper",
      progress: Math.round((currentRP / 50) * 100),
      rpNeeded: 50 - currentRP,
      nextThreshold: 50,
    };
  }
}

export const gamificationService = new GamificationService();
export default gamificationService;
