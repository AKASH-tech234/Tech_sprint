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
    try {
      const result = await authService.checkAuth();
      if (result.authenticated && result.user) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
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
    try {
      setError(null);
      const data = await authService.login(email, password);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message || "Login failed");
      return { success: false, error: err.message };
    }
  };

  // Signup with email/password
  const signup = async (username, email, password, role) => {
    try {
      setError(null);
      const data = await authService.signup(username, email, password, role);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message || "Signup failed");
      return { success: false, error: err.message };
    }
  };

  // Google OAuth authentication
  const googleAuth = async (credential, role) => {
    try {
      setError(null);
      const data = await authService.googleAuth(credential, role);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message || "Google authentication failed");
      return { success: false, error: err.message };
    }
  };

  // Logout user (clears HTTP-only cookie on server)
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error("Failed to refresh user:", err);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
