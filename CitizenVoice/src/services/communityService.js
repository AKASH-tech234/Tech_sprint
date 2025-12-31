// src/services/communityService.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/communities`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(
      `📤 [Community API] ${config.method?.toUpperCase()} ${config.url}`,
      config.data || ""
    );
    return config;
  },
  (error) => {
    console.error("❌ [Community API Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 [Community API Response] ${response.status}`, response.data);
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    const err = new Error(message);
    err.status = error.response?.status;

    console.error("❌ [Community API Error]", {
      status: err.status,
      message: err.message,
    });

    throw err;
  }
);

class CommunityService {
  // Get all communities with optional filters
  async getCommunities(filters = {}) {
    const params = new URLSearchParams();
    if (filters.state) params.append("state", filters.state);
    if (filters.district) params.append("district", filters.district);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const { data } = await api.get(`/?${params.toString()}`);
    return data.data;
  }

  // Get user's joined communities
  async getMyCommunities() {
    const { data } = await api.get("/my");
    return data.data;
  }

  // Get community by district code
  async getCommunityByCode(districtCode) {
    const { data } = await api.get(`/${districtCode}`);
    return data.data;
  }

  // Join a community
  async joinCommunity(communityId) {
    const { data } = await api.post(`/${communityId}/join`);
    return data.data;
  }

  // Leave a community
  async leaveCommunity(communityId) {
    const { data } = await api.post(`/${communityId}/leave`);
    return data.data;
  }

  // Get community messages
  async getMessages(districtCode, page = 1, limit = 50) {
    const { data } = await api.get(
      `/${districtCode}/messages?page=${page}&limit=${limit}`
    );
    return data.data;
  }

  // Send a message to community chat
  async sendMessage(districtCode, content, type = "text") {
    const { data } = await api.post(`/${districtCode}/messages`, {
      content,
      type,
    });
    return data.data;
  }

  // Get community members
  async getMembers(districtCode) {
    const { data } = await api.get(`/${districtCode}/members`);
    return data.data;
  }
}

export const communityService = new CommunityService();
