// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Logo } from "../components/ui/Logo";
import { authService } from "../services/authservices";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Password validation states
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    hasLetter: false,
    hasNumber: false,
    match: false,
  });

  // Validate password on change
  useEffect(() => {
    const { newPassword, confirmPassword } = formData;
    setPasswordChecks({
      length: newPassword.length >= 8,
      hasLetter: /[a-zA-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      match: newPassword === confirmPassword && newPassword.length > 0,
    });
  }, [formData]);

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔑 [ResetPassword] Form submitted");

    const { newPassword, confirmPassword } = formData;

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!passwordChecks.hasLetter || !passwordChecks.hasNumber) {
      setError("Password must contain at least one letter and one number");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.resetPassword(token, newPassword);
      console.log("✅ [ResetPassword] Password reset successful");
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login?reset=success");
      }, 3000);
    } catch (err) {
      console.error("❌ [ResetPassword] Error:", err.message);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordCheck = ({ passed, text }) => (
    <div className={`flex items-center gap-2 text-sm ${passed ? "text-green-400" : "text-white/40"}`}>
      {passed ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      {text}
    </div>
  );

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
              Create Your{" "}
              <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                New Password
              </span>
            </h1>
            <p className="text-lg text-white/70 mb-12 max-w-md">
              Choose a strong password to keep your account secure.
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
                    Set New Password
                  </h2>
                  <p className="text-white/60 mb-8">
                    Your new password must be different from previously used passwords.
                  </p>

                  {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  )}

                  {!token ? (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <XCircle className="h-8 w-8 text-red-400" />
                      </div>
                      <p className="text-white/60 mb-6">
                        Invalid or missing reset token.
                      </p>
                      <Link
                        to="/forgot-password"
                        className="block w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 hover:from-rose-600 hover:via-pink-600 hover:to-violet-600 transition-all text-center"
                      >
                        Request New Reset Link
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-sm font-medium text-white/80 mb-2"
                        >
                          New Password
                        </label>
                        <div className="relative">
                          <Lock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                            size={20}
                          />
                          <input
                            type={showPassword ? "text" : "password"}
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                            placeholder="Enter new password"
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

                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-white/80 mb-2"
                        >
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                            size={20}
                          />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                            placeholder="Confirm new password"
                            required
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      {/* Password Requirements */}
                      <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm font-medium text-white/80 mb-3">Password Requirements:</p>
                        <PasswordCheck passed={passwordChecks.length} text="At least 8 characters" />
                        <PasswordCheck passed={passwordChecks.hasLetter} text="Contains a letter" />
                        <PasswordCheck passed={passwordChecks.hasNumber} text="Contains a number" />
                        <PasswordCheck passed={passwordChecks.match} text="Passwords match" />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !Object.values(passwordChecks).every(Boolean)}
                        className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 hover:from-rose-600 hover:via-pink-600 hover:to-violet-600 transition-all duration-300 shadow-lg shadow-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Resetting..." : "Reset Password"}
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Password Reset Successful!
                  </h2>
                  <p className="text-white/60 mb-6">
                    Your password has been changed successfully. You can now sign in with your new password.
                  </p>
                  <p className="text-white/40 text-sm mb-6">
                    Redirecting to sign in page...
                  </p>
                  <Link
                    to="/login"
                    className="block w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 hover:from-rose-600 hover:via-pink-600 hover:to-violet-600 transition-all text-center"
                  >
                    Sign In Now
                  </Link>
                </div>
              )}
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

export default ResetPassword;
