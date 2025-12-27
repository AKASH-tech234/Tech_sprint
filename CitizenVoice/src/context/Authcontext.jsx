// src/context/AuthContext.jsx
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/authservices";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount (using HTTP-only cookie)
  const checkAuth = useCallback(async () => {
    console.log("🔄 [AuthContext] Checking authentication on mount...");
    try {
      const result = await authService.checkAuth();
      console.log("📋 [AuthContext] Auth check result:", result);
      if (result.authenticated && result.user) {
        console.log("✅ [AuthContext] User is authenticated:", result.user);
        setUser(result.user);
      } else {
        console.log("⚠️ [AuthContext] User is NOT authenticated");
        setUser(null);
      }
    } catch (err) {
      console.error("❌ [AuthContext] Auth check failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login with email/password
  const login = async (email, password) => {
    console.log("🔐 [AuthContext] Login called for:", email);
    try {
      setError(null);
      const data = await authService.login(email, password);
      console.log("📋 [AuthContext] Login response data:", data);
      setUser(data.user);
      console.log("✅ [AuthContext] User set after login:", data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error("❌ [AuthContext] Login error:", err.message);
      setError(err.message || "Login failed");
      return { success: false, error: err.message };
    }
  };

  // Signup with email/password
  const signup = async (username, email, password, role) => {
    console.log("📝 [AuthContext] Signup called:", { username, email, role });
    try {
      setError(null);
      const data = await authService.signup(username, email, password, role);
      console.log("📋 [AuthContext] Signup response data:", data);
      setUser(data.user);
      console.log("✅ [AuthContext] User set after signup:", data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error("❌ [AuthContext] Signup error:", err.message);
      setError(err.message || "Signup failed");
      return { success: false, error: err.message };
    }
  };

  // Google OAuth authentication
  const googleAuth = async (credential, role) => {
    console.log("🔷 [AuthContext] Google Auth called for role:", role);
    try {
      setError(null);
      const data = await authService.googleAuth(credential, role);
      console.log("📋 [AuthContext] Google Auth response data:", data);
      setUser(data.user);
      console.log("✅ [AuthContext] User set after Google Auth:", data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error("❌ [AuthContext] Google Auth error:", err.message);
      setError(err.message || "Google authentication failed");
      return { success: false, error: err.message };
    }
  };

  // Logout user (clears HTTP-only cookie on server)
  const logout = async () => {
    console.log("🚪 [AuthContext] Logout called");
    try {
      await authService.logout();
      console.log("✅ [AuthContext] Logout successful");
    } catch (err) {
      console.error("❌ [AuthContext] Logout error:", err);
    } finally {
      setUser(null);
      console.log("👤 [AuthContext] User cleared");
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    console.log("🔄 [AuthContext] Refreshing user data...");
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      console.log("✅ [AuthContext] User refreshed:", userData);
    } catch (err) {
      console.error("❌ [AuthContext] Failed to refresh user:", err);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    googleAuth,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  console.log("🔄 [AuthContext] Current state:", {
    user,
    loading,
    isAuthenticated: !!user,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
