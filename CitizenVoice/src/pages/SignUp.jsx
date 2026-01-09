// src/pages/SignUp.jsx (Updated)
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Globe,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { Logo } from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";

const roles = [
  {
    id: "citizen",
    title: "Citizen",
    description: "Report issues & track resolutions in your community",
    icon: User,
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "community",
    title: "Community",
    description: "Represent your neighborhood or organization",
    icon: Globe,
    color: "from-pink-500 to-violet-500",
  },
];

export function SignUp() {
  const navigate = useNavigate();
  const { signup, googleAuth } = useAuth();

  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📝 [SignUp Page] Form submitted:", {
      username: formData.username,
      email: formData.email,
      role: selectedRole,
    });

    if (!selectedRole) {
      console.log("❌ [SignUp Page] No role selected");
      setError("Please select a role");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await signup(
      formData.username,
      formData.email,
      formData.password,
      selectedRole
    );
    console.log("📋 [SignUp Page] Signup result:", result);

    if (result.success) {
      const dashboardPath = `/dashboard/${result.user.role}`;
      console.log("✅ [SignUp Page] Redirecting to:", dashboardPath);
      navigate(dashboardPath, { replace: true });
    } else {
      console.log("❌ [SignUp Page] Signup failed:", result.error);
      setError(result.error || "Signup failed. Please try again.");
    }

    setIsLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log("🔷 [SignUp Page] Google signup success, credential received");
    if (!selectedRole) {
      console.log("❌ [SignUp Page] No role selected for Google signup");
      setError("Please select a role first");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await googleAuth(
      credentialResponse.credential,
      selectedRole
    );
    console.log("📋 [SignUp Page] Google auth result:", result);

    if (result.success) {
      const dashboardPath = `/dashboard/${result.user.role}`;
      console.log("✅ [SignUp Page] Redirecting to:", dashboardPath);
      navigate(dashboardPath, { replace: true });
    } else {
      console.log("❌ [SignUp Page] Google signup failed:", result.error);
      setError(result.error || "Google signup failed. Please try again.");
    }

    setIsLoading(false);
  };

  const handleGoogleError = () => {
    console.log("❌ [SignUp Page] Google sign-in error/cancelled");
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
          <div className="mt-20">
            <h1 className="text-4xl xl:text-5xl font-display font-bold text-white mb-6">
              Join the Movement for{" "}
              <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                Better Cities
              </span>
            </h1>
            <p className="text-lg text-white/70 mb-12 max-w-md">
              Empower your community. Report issues. Track progress. Make a real
              difference.
            </p>
            <div className="flex gap-12">
              {[
                { value: "10K+", label: "Issues Resolved" },
                { value: "50+", label: "Cities Active" },
                { value: "85%", label: "Resolution Rate" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="large" />
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-display font-bold text-white mb-2">
              Create Account
            </h2>
            <p className="text-white/60 mb-8">
              Choose your role and get started
            </p>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Role Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-white/80 mb-3">
                Select Your Role
              </label>
              <div className="grid gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    disabled={isLoading}
                    className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      selectedRole === role.id
                        ? "border-rose-500/50 bg-rose-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${role.color}`}
                    >
                      <role.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {role.title}
                      </div>
                      <div className="text-sm text-white/50">
                        {role.description}
                      </div>
                    </div>
                    {selectedRole === role.id && (
                      <CheckCircle className="h-5 w-5 text-rose-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedRole || isLoading}
                className="w-full bg-white text-black font-semibold py-3 rounded-xl shadow-lg shadow-white/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-sm text-white/40">or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex justify-center">
              {selectedRole ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  size="large"
                  width={350}
                  text="signup_with"
                  shape="rectangular"
                  logo_alignment="left"
                />
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-3 text-white font-medium opacity-50 cursor-not-allowed"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                  Select a role first to sign up with Google
                </button>
              )}
            </div>

            <p className="mt-8 text-center text-white/60">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-rose-500 hover:text-pink-500 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>

            {/* DEV MODE: Test buttons to access dashboards without auth */}
            
          </div>

          <p className="mt-6 text-center text-sm text-white/40">
            By signing up, you agree to our{" "}
            <a
              href="#terms"
              className="text-white/60 hover:text-white underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#privacy"
              className="text-white/60 hover:text-white underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
