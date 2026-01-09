// src/services/authService.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

console.log("🔧 [AuthService] API Base URL:", API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  withCredentials: true, // ✅ REQUIRED for HTTP-only cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(
      `📤 [API Request] ${config.method?.toUpperCase()} ${config.url}`,
      config.data || ""
    );
    return config;
  },
  (error) => {
    console.error("❌ [API Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => {
    console.log(`📥 [API Response] ${response.status}`, response.data);
    return response;
  },
   (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    const err = new Error(message);
    err.status = error.response?.status;

    console.error("❌ [API Error]", {
      status: err.status,
      message: err.message,
      data: error.response?.data,
    });

    throw err;
  }
);

class AuthService {
  // Login with email/password
  async login(email, password) {
    console.log("🔐 [AuthService] Login attempt for:", email);
    const { data } = await api.post("/login", { email, password });
    console.log("✅ [AuthService] Login successful:", data.data);
    return data.data;
  }

  // Signup with email/password
  async signup(username, email, password, role) {
    console.log("📝 [AuthService] Signup attempt:", { username, email, role });
    const { data } = await api.post("/signup", {
      username,
      email,
      password,
      role,
    });
    console.log("✅ [AuthService] Signup successful:", data.data);
    return data.data;
  }

  // Google OAuth authentication
  async googleAuth(credential, role) {
    console.log("🔷 [AuthService] Google Auth attempt for role:", role);
    const { data } = await api.post("/google", { credential, role });
    console.log("✅ [AuthService] Google Auth successful:", data.data);
    return data.data;
  }

  // Check if user is authenticated (reads from HTTP-only cookie on server)
  async checkAuth() {
    console.log("🔍 [AuthService] Checking authentication...");
    try {
      const { data } = await api.get("/check");
      console.log("✅ [AuthService] Auth check result:", data.data);
      return data.data;
    } catch (error) {
      console.error("❌ [AuthService] Auth check error:", error);
      return { authenticated: false, user: null };
    }
  }

  // Get current user data (protected route)
  async getCurrentUser() {
    console.log("👤 [AuthService] Getting current user...");
    const { data } = await api.get("/me");
    console.log("✅ [AuthService] Current user:", data.data);
    return data.data;
  }

  // Logout user (clears HTTP-only cookie)
  async logout() {
    console.log("🚪 [AuthService] Logging out...");
    try {
      await api.post("/logout");
      console.log("✅ [AuthService] Logout successful");
    } catch (error) {
      console.error("❌ [AuthService] Logout error:", error);
    }
  }

  // Request password reset (Forgot Password)
  async forgotPassword(email) {
    console.log("🔑 [AuthService] Forgot password request for:", email);
    const { data } = await api.post("/forgot-password", { email });
    console.log("✅ [AuthService] Forgot password response:", data.message);
    return data;
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    console.log("🔑 [AuthService] Reset password request");
    const { data } = await api.post("/reset-password", { token, newPassword });
    console.log("✅ [AuthService] Reset password response:", data.message);
    return data;
  }
}

export const authService = new AuthService();
