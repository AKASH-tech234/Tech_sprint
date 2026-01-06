// src/components/Dashboard/Community/VerificationQueue.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { verificationService } from "../../../services/verificationService";
import { userService } from "../../../services/userService";
import { cn } from "../../../lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  User,
  Image as ImageIcon,
  Loader2,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Filter,
  RefreshCw,
} from "lucide-react";

export function VerificationQueue() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [filter, setFilter] = useState("all");
  const [isProfileComplete, setIsProfileComplete] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check profile completion status
  useEffect(() => {
    const checkProfile = async () => {
      try {
        // First refresh user from context
        if (refreshUser) {
          await refreshUser();
        }
        // Then check via API for most accurate result
        const response = await userService.checkProfileCompletion();
        const complete = response.data?.isProfileComplete ?? false;
        setIsProfileComplete(complete);
      } catch (err) {
        console.error("Error checking profile:", err);
        // Fall back to context value
        setIsProfileComplete(user?.isProfileComplete ?? false);
      } finally {
        setCheckingProfile(false);
      }
    };
    checkProfile();
  }, []);

  useEffect(() => {
    if (!checkingProfile && isProfileComplete) {
      loadIssues();
    }
  }, [checkingProfile, isProfileComplete]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await verificationService.getUnverifiedIssues();
      setIssues(response.data?.issues || []);
    } catch (err) {
      console.error("Error loading issues:", err);
      setError(err.message || "Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (issueId, status) => {
    // Check if profile is complete
    if (!isProfileComplete) {
      navigate("/profile");
      return;
    }

    try {
      setVerifying(issueId);
      await verificationService.verifyIssue(issueId, status, remarks);
      
      // Remove from list
      setIssues(prev => prev.filter(i => i._id !== issueId));
      setSelectedIssue(null);
      setRemarks("");
    } catch (err) {
      console.error("Error verifying issue:", err);
      alert(err.message || "Failed to verify issue");
    } finally {
      setVerifying(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "text-rose-400 bg-rose-500/20";
      case "medium": return "text-amber-400 bg-amber-500/20";
      default: return "text-emerald-400 bg-emerald-500/20";
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      pothole: "🕳️",
      streetlight: "💡",
      garbage: "🗑️",
      water: "💧",
      traffic: "🚦",
      noise: "🔊",
      safety: "⚠️",
      other: "📋",
    };
    return icons[category] || "📋";
  };

  // Show loading while checking profile
  if (checkingProfile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="ml-2 text-white/60">Checking profile...</span>
      </div>
    );
  }

  // Check profile completion using API result
  if (!isProfileComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-16 w-16 text-amber-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Profile Incomplete</h2>
        <p className="text-white/60 text-center max-w-md mb-6">
          Please complete your profile before verifying issues. This helps maintain the integrity of community verifications.
        </p>
        <button
          onClick={() => navigate("/profile")}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold"
        >
          Complete Profile
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-rose-400 mb-4" />
        <p className="text-white/60">{error}</p>
        <button
          onClick={loadIssues}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Verify Issues</h1>
          <p className="text-white/60">Help verify reported issues in your community</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadIssues}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">To Verify</p>
          <p className="text-2xl font-bold text-white">{issues.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-400">High Priority</p>
          <p className="text-2xl font-bold text-emerald-400">
            {issues.filter(i => i.priority === "high").length}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-400">Medium Priority</p>
          <p className="text-2xl font-bold text-amber-400">
            {issues.filter(i => i.priority === "medium").length}
          </p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="text-sm text-blue-400">Low Priority</p>
          <p className="text-2xl font-bold text-blue-400">
            {issues.filter(i => i.priority === "low").length}
          </p>
        </div>
      </div>

      {/* Issues List */}
      {issues.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
          <p className="text-white/60">No issues waiting for your verification</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue) => (
            <div
              key={issue._id}
              className="rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/20 transition-all"
            >
              {/* Images */}
              {issue.images && issue.images.length > 0 && (
                <div className="relative h-40 bg-white/5">
                  <img
                    src={`http://localhost:3000${issue.images[0]}`}
                    alt={issue.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {issue.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      +{issue.images.length - 1} more
                    </span>
                  )}
                </div>
              )}

              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(issue.category)}</span>
                    <span className="text-xs text-white/40">{issue.issueId}</span>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getPriorityColor(issue.priority))}>
                    {issue.priority}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="font-semibold text-white mb-2 line-clamp-2">{issue.title}</h3>
                <p className="text-sm text-white/60 line-clamp-2 mb-3">{issue.description}</p>

                {/* Location & Date */}
                <div className="flex items-center gap-4 text-xs text-white/50 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {issue.location?.address?.slice(0, 30) || "Unknown"}...
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(issue.createdAt)}
                  </span>
                </div>

                {/* Verification Stats */}
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ThumbsUp className="h-3 w-3" />
                    {issue.verifiedCount || 0} correct
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <ThumbsDown className="h-3 w-3" />
                    {issue.incorrectCount || 0} incorrect
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(issue._id, "correct")}
                    disabled={verifying === issue._id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    {verifying === issue._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">Correct</span>
                  </button>
                  <button
                    onClick={() => handleVerify(issue._id, "incorrect")}
                    disabled={verifying === issue._id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                  >
                    {verifying === issue._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">Incorrect</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VerificationQueue;
