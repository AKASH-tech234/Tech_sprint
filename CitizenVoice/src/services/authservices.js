// src/services/authService.js


const API_BASE_URL =
  process.env.VITE_API_BASE_URL || "http://localhost:5000/api";

class AuthService {
  // Login with email/password
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important: include cookies
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Login failed");
    }

    // API returns { statusCode, data: { user }, message, success }
    // Token is now set as HTTP-only cookie by the server
    return result.data;
  }

  // Signup with email/password
  async signup(username, email, password, role) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important: include cookies
      body: JSON.stringify({ username, email, password, role }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Signup failed");
    }

    return result.data;
  }

  // Google OAuth authentication
  async googleAuth(credential, role) {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important: include cookies
      body: JSON.stringify({ credential, role }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Google authentication failed");
    }

    return result.data;
  }

  // Check if user is authenticated (reads from HTTP-only cookie on server)
  async checkAuth() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check`, {
        method: "GET",
        credentials: "include", // Important: include cookies
      });

      const result = await response.json();

      if (!response.ok) {
        return { authenticated: false, user: null };
      }

      return result.data;
    } catch (error) {
      console.error("Auth check error:", error);
      return { authenticated: false, user: null };
    }
  }

  // Get current user data (protected route)
  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      credentials: "include", // Important: include cookies
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch user data");
    }

    return result.data;
  }

  // Logout user (clears HTTP-only cookie)
  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include", // Important: include cookies
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }
}

export const authService = new AuthService();
