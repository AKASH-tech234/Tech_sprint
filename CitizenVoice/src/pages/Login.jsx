// src/pages/Login.jsx (Updated)
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { Logo } from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const { login, googleAuth } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔐 [Login Page] Form submitted:", { email: formData.email });
    setIsLoading(true);
    setError("");

    const result = await login(formData.email, formData.password);
    console.log("📋 [Login Page] Login result:", result);

    if (result.success) {
      // Redirect based on role
      const dashboardPath = `/dashboard/${result.user.role}`;
      console.log("✅ [Login Page] Redirecting to:", dashboardPath);
      navigate(dashboardPath, { replace: true });
    } else {
      console.log("❌ [Login Page] Login failed:", result.error);
      setError(result.error || "Login failed. Please try again.");
    }

    setIsLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log("🔷 [Login Page] Google login success, credential received");
    setIsLoading(true);
    setError("");

    // For login, we'll use "citizen" as default role
    // Users can change their role from settings if needed
    const result = await googleAuth(credentialResponse.credential, "citizen");
    console.log("📋 [Login Page] Google auth result:", result);

    if (result.success) {
      const dashboardPath = `/dashboard/${result.user.role}`;
      console.log("✅ [Login Page] Redirecting to:", dashboardPath);
      navigate(dashboardPath, { replace: true });
    } else {
      console.log("❌ [Login Page] Google login failed:", result.error);
      setError(result.error || "Google login failed. Please try again.");
    }

    setIsLoading(false);
  };

  const handleGoogleError = () => {
    console.log("❌ [Login Page] Google sign-in error/cancelled");
    setError("Google sign-in was cancelled or failed. Please try again.");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left Side - Branding (same as before) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "radial-gradient(80% 55% at 50% 52%, rgba(244,63,94,0.35) 0%, rgba(236,72,153,0.36) 27%, rgba(139,92,246,0.28) 47%, rgba(99,102,241,0.35) 60%, rgba(8,12,12,0.92) 78%, rgba(10,10,10,1) 88%)",
              "radial-gradient(85% 60% at 14% 0%, rgba(251,113,133,0.45) 0%, rgba(244,63,94,0.38) 30%, rgba(48,28,24,0.0) 64%)",
              "radial-gradient(70% 50% at 86% 22%, rgba(139,92,246,0.30) 0%, rgba(16,28,28,0.0) 55%)",
            ].join(","),
            backgroundColor: "#0a0a0a",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: [
              "repeating-linear-gradient(90deg, rgba(244,63,94,0.09) 0 1px, transparent 1px 96px)",
              "repeating-linear-gradient(0deg, rgba(139,92,246,0.06) 0 1px, transparent 1px 96px)",
            ].join(","),
          }}
        />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link to="/" className="absolute top-8 left-8">
            <Logo size="default" />
          </Link>
          <div className="max-w-lg">
            <h1
              className="font-playfair text-5xl xl:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-rose-100 to-violet-200 bg-clip-text text-transparent"
              style={{ lineHeight: "1.2" }}
            >
              Welcome Back to CitizenVoice
            </h1>
            <p className="text-lg text-white/70 mb-12">
              Sign in to continue making a difference in your community.
            </p>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  12K+
                </div>
                <div className="text-sm text-white/60">Issues Resolved</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                  98%
                </div>
                <div className="text-sm text-white/60">Response Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent mb-2">
                  24h
                </div>
                <div className="text-sm text-white/60">Avg Response</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="lg:hidden inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="lg:hidden mb-8">
            <Logo size="default" />
          </div>

          {/* Login Card */}
          <div className="relative">
            <div
              className="relative rounded-2xl p-8 backdrop-blur-xl border"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                borderColor: "rgba(255,255,255,0.08)",
                boxShadow: [
                  "0 8px 32px rgba(0,0,0,0.4)",
                  "inset 0 1px 0 rgba(255,255,255,0.1)",
                ].join(","),
              }}
            >
              <div className="text-center mb-8">
                <h2 className="font-playfair text-3xl font-bold text-white mb-2">
                  Sign In
                </h2>
                <p className="text-white/60">
                  Access your CitizenVoice account
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white/80 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                      size={20}
                    />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-white/80"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                      size={20}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-rose-500 focus:ring-2 focus:ring-rose-500/50"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 text-sm text-white/60"
                  >
                    Remember me for 30 days
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 hover:from-rose-600 hover:via-pink-600 hover:to-violet-600 transition-all duration-300 shadow-lg shadow-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#0a0a0a]/80 text-white/40">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  size="large"
                  width={350}
                  text="signin_with"
                  shape="rectangular"
                  logo_alignment="left"
                />
              </div>

              <p className="text-center text-sm text-white/60 mt-6">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>

            <div
              className="absolute -inset-1 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-violet-500/20 rounded-2xl blur-xl -z-10"
              style={{ opacity: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
