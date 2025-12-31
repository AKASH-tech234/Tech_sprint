// src/components/Dashboard/Official/ReviewQueue.jsx
import React, { useState, useEffect } from "react";
import { cn } from "../../../lib/utils";
import {
  ClipboardCheck,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Clock,
  FileText,
  MapPin,
  User,
  Calendar,
  Eye,
  RefreshCw,
  Filter,
  AlertCircle,
  Shield,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { issueService } from "../../../services/issueService";
import { useAuth } from "../../../context/AuthContext";
import { VerificationReviewModal } from "./VerificationReviewModal";
import { ResolutionReviewModal } from "./ResolutionReviewModal";

// Priority configuration with sorting weight
const priorityConfig = {
  high: { 
    label: "High", 
    color: "text-rose-400", 
    bg: "bg-rose-500/20", 
    border: "border-rose-500/30",
    weight: 3,
    glow: "shadow-rose-500/20"
  },
  medium: { 
    label: "Medium", 
    color: "text-amber-400", 
    bg: "bg-amber-500/20", 
    border: "border-amber-500/30",
    weight: 2,
    glow: "shadow-amber-500/20"
  },
  low: { 
    label: "Low", 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/20", 
    border: "border-emerald-500/30",
    weight: 1,
    glow: "shadow-emerald-500/20"
  },
};

// Report type configuration
const reportTypeConfig = {
  verification: {
    label: "Verification",
    icon: ClipboardCheck,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
  },
  resolution: {
    label: "Resolution",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
  },
};

export function ReviewQueue() {
  const { user } = useAuth();
  const isOfficialAdmin = !!user?.isOfficialAdmin;

  const [activeTab, setActiveTab] = useState("verification");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [selectedReport, setSelectedReport] = useState(null);
  const [showVerificationReview, setShowVerificationReview] = useState(false);
  const [showResolutionReview, setShowResolutionReview] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalPending: 0,
    highPriority: 0,
    verificationCount: 0,
    resolutionCount: 0,
  });

  useEffect(() => {
    if (isOfficialAdmin) {
      loadPendingReports();
    }
  }, [activeTab, isOfficialAdmin]);

  const loadPendingReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await issueService.getPendingReports(activeTab);
      const data = response.data || response;
      
      // Sort by priority (high → medium → low) then by submission time (oldest first)
      const sortedReports = sortReportsByPriority(data.reports || []);
      
      setReports(sortedReports);
      setStats({
        totalPending: data.totalPending || sortedReports.length,
        highPriority: sortedReports.filter(r => r.issue?.priority === "high").length,
        verificationCount: data.verificationCount || 0,
        resolutionCount: data.resolutionCount || 0,
      });
    } catch (err) {
      console.error("Error loading pending reports:", err);
      setError(err.message || "Failed to load pending reports");
    } finally {
      setLoading(false);
    }
  };

  const sortReportsByPriority = (reports) => {
    return [...reports].sort((a, b) => {
      // First sort by priority weight (descending - high priority first)
      const priorityA = priorityConfig[a.issue?.priority]?.weight || 0;
      const priorityB = priorityConfig[b.issue?.priority]?.weight || 0;
      
      if (priorityB !== priorityA) {
        return priorityB - priorityA;
      }
      
      // Then sort by submission time (ascending - oldest first)
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingReports();
    setRefreshing(false);
  };

  const handleReviewClick = (report) => {
    setSelectedReport(report);
    if (report.reportType === "verification") {
      setShowVerificationReview(true);
    } else {
      setShowResolutionReview(true);
    }
  };

  const handleReviewComplete = async () => {
    setShowVerificationReview(false);
    setShowResolutionReview(false);
    setSelectedReport(null);
    await loadPendingReports();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  // Access control - only for admin officials
  if (!isOfficialAdmin) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-rose-500/50" />
          <h2 className="mb-2 text-xl font-semibold text-white">Access Restricted</h2>
          <p className="text-white/60">
            This page is only accessible to Official Administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Queue</h1>
          <p className="text-sm text-white/60">
            Review and approve pending verification and resolution reports
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-all hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
              <FileText className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalPending}</p>
              <p className="text-xs text-white/50">Total Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20">
              <Zap className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.highPriority}</p>
              <p className="text-xs text-white/50">High Priority</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <ClipboardCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.verificationCount}</p>
              <p className="text-xs text-white/50">Verifications</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.resolutionCount}</p>
              <p className="text-xs text-white/50">Resolutions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5">
        <button
          onClick={() => setActiveTab("verification")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            activeTab === "verification"
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          )}
        >
          <ClipboardCheck className="h-4 w-4" />
          Verification Requests
        </button>
        <button
          onClick={() => setActiveTab("resolution")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            activeTab === "resolution"
              ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          Resolution Requests
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-rose-500" />
            <p className="text-white/60">Loading pending reports...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-rose-500" />
            <p className="mb-2 text-rose-400">{error}</p>
            <button
              onClick={loadPendingReports}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600"
            >
              Retry
            </button>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500/50" />
            <h3 className="mb-2 text-lg font-semibold text-white">All Caught Up!</h3>
            <p className="text-white/60">
              No pending {activeTab} requests at the moment.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Priority Legend */}
          <div className="flex items-center gap-4 text-sm text-white/50">
            <span>Priority:</span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Low</span>
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            {reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onReview={() => handleReviewClick(report)}
                formatDate={formatDate}
                formatTime={formatTime}
                getTimeAgo={getTimeAgo}
              />
            ))}
          </div>
        </div>
      )}

      {/* Review Modals */}
      {selectedReport && (
        <>
          <VerificationReviewModal
            report={selectedReport}
            isOpen={showVerificationReview}
            onClose={() => {
              setShowVerificationReview(false);
              setSelectedReport(null);
            }}
            onComplete={handleReviewComplete}
          />
          <ResolutionReviewModal
            report={selectedReport}
            isOpen={showResolutionReview}
            onClose={() => {
              setShowResolutionReview(false);
              setSelectedReport(null);
            }}
            onComplete={handleReviewComplete}
          />
        </>
      )}
    </div>
  );
}

// Report Card Component
function ReportCard({ report, onReview, formatDate, formatTime, getTimeAgo }) {
  const issue = report.issue || {};
  const priority = priorityConfig[issue.priority] || priorityConfig.medium;
  const isHighPriority = issue.priority === "high";
  const reportType = reportTypeConfig[report.reportType] || reportTypeConfig.verification;
  const ReportIcon = reportType.icon;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-5 backdrop-blur-sm transition-all hover:border-white/20",
        isHighPriority 
          ? "border-rose-500/30 shadow-lg shadow-rose-500/10" 
          : "border-white/10"
      )}
    >
      {/* High Priority Indicator */}
      {isHighPriority && (
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-rose-500 to-orange-500"></div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Section - Issue Info */}
        <div className="flex-1 space-y-3">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Report Type Badge */}
            <span className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              reportType.bg, reportType.color, reportType.border
            )}>
              <ReportIcon className="h-3 w-3" />
              {reportType.label}
            </span>
            
            {/* Priority Badge */}
            <span className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              priority.bg, priority.color, priority.border
            )}>
              {isHighPriority && <Zap className="h-3 w-3" />}
              {priority.label} Priority
            </span>

            {/* Time Badge */}
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60">
              <Clock className="h-3 w-3" />
              {getTimeAgo(report.submittedAt)}
            </span>
          </div>

          {/* Issue Title */}
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-rose-400 transition-colors">
              {issue.title || "Untitled Issue"}
            </h3>
            <p className="mt-1 text-sm text-white/50 line-clamp-1">
              {issue.description || "No description available"}
            </p>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{issue.location?.address || "Location N/A"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>By: {report.submittedBy?.username || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(report.submittedAt)}</span>
            </div>
          </div>
        </div>

        {/* Right Section - Action */}
        <div className="flex items-center gap-3 lg:flex-col lg:items-end">
          <button
            onClick={onReview}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all",
              report.reportType === "verification"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-blue-500/25"
                : "bg-gradient-to-r from-emerald-500 to-green-500 hover:shadow-lg hover:shadow-emerald-500/25"
            )}
          >
            <Eye className="h-4 w-4" />
            Review
          </button>
          <span className="text-xs text-white/40">
            ID: {issue.issueId || issue._id?.slice(-8)}
          </span>
        </div>
      </div>

      {/* Verification Outcome Preview (if available) */}
      {report.reportType === "verification" && report.outcome && (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/5 p-3">
          <p className="text-xs text-white/40 mb-1">Field Outcome</p>
          <span className={cn(
            "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
            report.outcome === "verified" 
              ? "bg-emerald-500/20 text-emerald-400" 
              : "bg-rose-500/20 text-rose-400"
          )}>
            {report.outcome === "verified" ? "Verified" : "Not Verified"}
          </span>
        </div>
      )}
    </div>
  );
}

export default ReviewQueue;
