// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Logo } from "../components/ui/Logo";
import { authService } from "../services/authservices";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔑 [ForgotPassword] Form submitted for:", email);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.forgotPassword(email);
      console.log("✅ [ForgotPassword] Request successful");
      setSuccess(true);
    } catch (err) {
      console.error("❌ [ForgotPassword] Error:", err.message);
      // Still show success to prevent account enumeration
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left Side - Branding */}
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
          <div className="mt-20">
            <h1 className="text-4xl xl:text-5xl font-display font-bold text-white mb-6">
              Forgot Your{" "}
              <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                Password?
              </span>
            </h1>
            <p className="text-lg text-white/70 mb-12 max-w-md">
              No worries! Enter your email and we'll send you a link to reset your password.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="large" />
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>

          <div className="relative">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              {!success ? (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Reset Password
                  </h2>
                  <p className="text-white/60 mb-8">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>

                  {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
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
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                          }}
                          className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                          placeholder="you@example.com"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 hover:from-rose-600 hover:via-pink-600 hover:to-violet-600 transition-all duration-300 shadow-lg shadow-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-white/60 mb-6">
                    If an account exists for <span className="text-rose-400">{email}</span>, you will receive a password reset link shortly.
                  </p>
                  <p className="text-white/40 text-sm mb-6">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setSuccess(false);
                        setEmail("");
                      }}
                      className="w-full py-3 rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
                    >
                      Try Another Email
                    </button>
                    <Link
                      to="/login"
                      className="block w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 hover:from-rose-600 hover:via-pink-600 hover:to-violet-600 transition-all text-center"
                    >
                      Back to Sign In
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div
              className="absolute -inset-1 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-violet-500/20 rounded-2xl blur-xl -z-10"
              style={{ opacity: 0.5 }}
            />
          </div>

          <p className="mt-8 text-center text-white/60">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
