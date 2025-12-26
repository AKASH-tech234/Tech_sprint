import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Logo } from "../components/ui/Logo";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Frontend only - just log the data
    console.log("Login Data:", formData);
    alert("Login attempted");
  };

  const handleGoogleLogin = () => {
    console.log("Google Login clicked");
    alert("Google login attempted");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Gradient */}
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

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: [
              "repeating-linear-gradient(90deg, rgba(244,63,94,0.09) 0 1px, transparent 1px 96px)",
              "repeating-linear-gradient(0deg, rgba(139,92,246,0.06) 0 1px, transparent 1px 96px)",
            ].join(","),
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link to="/" className="absolute top-8 left-8">
            <Logo size="default" />
          </Link>

          <div className="max-w-lg">
            <h1
              className="font-playfair text-5xl xl:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-rose-100 to-violet-200 bg-clip-text text-transparent"
              style={{
                lineHeight: "1.2",
              }}
            >
              Welcome Back to CitizenVoice
            </h1>
            <p className="text-lg text-white/70 mb-12">
              Sign in to continue making a difference in your community. Track
              your reports, engage with officials, and drive real change.
            </p>

            {/* Stats */}
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
          {/* Back to Home Link (Mobile) */}
          <Link
            to="/"
            className="lg:hidden inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          {/* Logo (Mobile) */}
          <div className="lg:hidden mb-8">
            <Logo size="default" />
          </div>

          {/* Login Card */}
          <div className="relative">
            {/* Glass Card */}
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
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="font-playfair text-3xl font-bold text-white mb-2">
                  Sign In
                </h2>
                <p className="text-white/60">
                  Access your CitizenVoice account
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
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
                    />
                  </div>
                </div>

                {/* Password Input */}
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

                {/* Remember Me */}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 hover:from-rose-600 hover:via-pink-600 hover:to-violet-600 transition-all duration-300 shadow-lg shadow-rose-500/25"
                >
                  Sign In
                </button>
              </form>

              {/* Divider */}
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

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 rounded-lg font-medium text-white border border-white/10 hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>

              {/* Sign Up Link */}
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

            {/* Decorative Glow */}
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
