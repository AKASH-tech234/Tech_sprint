// src/components/Dashboard/Official/VerificationReviewModal.jsx
import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import {
  X,
  ClipboardCheck,
  MapPin,
  User,
  Calendar,
  Clock,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  MessageSquare,
  Shield,
  Zap,
  Hash,
} from "lucide-react";
import { issueService } from "../../../services/issueService";

// Priority configuration
const priorityConfig = {
  high: { label: "High", color: "text-rose-400", bg: "bg-rose-500/20", border: "border-rose-500/30" },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30" },
  low: { label: "Low", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
};

export function VerificationReviewModal({ report, isOpen, onClose, onComplete }) {
  const [decision, setDecision] = useState(null); // 'approve' or 'reject'
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  if (!isOpen || !report) return null;

  const issue = report.issue || {};
  const priority = priorityConfig[issue.priority] || priorityConfig.medium;
  const isHighPriority = issue.priority === "high";

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
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

  const handleSubmit = async () => {
    // Validation
    if (!decision) {
      setError("Please select a decision (Approve or Reject)");
      return;
    }

    if (decision === "reject" && !remarks.trim()) {
      setError("Remarks are mandatory when rejecting a verification");
      return;
    }

    if (decision === "approve" && !confirmationChecked) {
      setError("Please confirm the verification details before approving");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await issueService.reviewReport(report._id, {
        decision,
        remarks: remarks.trim(),
        // On approval, issue status changes to 'in-progress'
        newStatus: decision === "approve" ? "in-progress" : issue.status,
      });

      onComplete();
    } catch (err) {
      console.error("Review submission error:", err);
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDecision(null);
    setRemarks("");
    setError(null);
    setConfirmationChecked(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
        {/* High Priority Banner */}
        {isHighPriority && (
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-orange-500 py-2 text-sm font-semibold text-white">
            <Zap className="h-4 w-4" />
            HIGH PRIORITY ISSUE
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-blue-500/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
              <ClipboardCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Verification Review</h2>
              <p className="text-sm text-white/60">Review field verification report</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {/* Issue Summary Card */}
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/60">
                    <Hash className="h-3 w-3" />
                    {issue.issueId || issue._id?.slice(-8)}
                  </span>
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-xs font-medium",
                    priority.bg, priority.color, priority.border
                  )}>
                    {priority.label} Priority
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs text-white/40">Location</p>
                  <p className="text-sm text-white">{issue.location?.address || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-violet-400" />
                <div>
                  <p className="text-xs text-white/40">Reported On</p>
                  <p className="text-sm text-white">{formatDate(issue.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Details */}
          <div className="mb-6 space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/70">
              <FileText className="h-4 w-4" />
              Verification Report Details
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Field Officer */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-lg font-bold text-white">
                    {(report.submittedBy?.username || "U").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Field Officer</p>
                    <p className="font-medium text-white">{report.submittedBy?.username || "Unknown"}</p>
                    <p className="text-xs text-white/50">{report.submittedBy?.email}</p>
                  </div>
                </div>
              </div>

              {/* Submission Time */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/20">
                    <Clock className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Submitted At</p>
                    <p className="font-medium text-white">{formatDate(report.submittedAt)}</p>
                    <p className="text-xs text-white/50">{formatTime(report.submittedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Field Outcome */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-xs text-white/40">Field Verification Outcome</p>
              <span className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
                report.outcome === "verified"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400"
              )}>
                {report.outcome === "verified" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {report.outcome === "verified" ? "Issue Verified" : "Issue Not Verified"}
              </span>
            </div>

            {/* Root Cause (if verified) */}
            {report.rootCause && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs text-white/40">Root Cause Analysis</p>
                <p className="whitespace-pre-wrap text-sm text-white">{report.rootCause}</p>
              </div>
            )}

            {/* Remarks */}
            {report.remarks && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs text-white/40">Officer Remarks</p>
                <p className="whitespace-pre-wrap text-sm text-white">{report.remarks}</p>
              </div>
            )}
          </div>

          {/* Evidence Images */}
          {report.evidence && report.evidence.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/70">
                <ImageIcon className="h-4 w-4" />
                Field Evidence ({report.evidence.length} images)
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {report.evidence.map((img, idx) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/20 transition-all hover:border-blue-500/50"
                  >
                    <img
                      src={img}
                      alt={`Evidence ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
                        <ExternalLink className="h-4 w-4 text-white" />
                        <span className="text-sm text-white">View Full</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin Decision Section */}
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-700/30 p-5">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <Shield className="h-4 w-4 text-rose-400" />
              Admin Decision
            </h4>

            {/* Decision Buttons */}
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setDecision("approve")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all",
                  decision === "approve"
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : "border-white/10 text-white/60 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                )}
              >
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Approve</span>
              </button>
              <button
                onClick={() => setDecision("reject")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all",
                  decision === "reject"
                    ? "border-rose-500 bg-rose-500/20 text-rose-400"
                    : "border-white/10 text-white/60 hover:border-rose-500/50 hover:bg-rose-500/10"
                )}
              >
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Reject</span>
              </button>
            </div>

            {/* Status Change Notice (on approve) */}
            {decision === "approve" && (
              <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                <p className="flex items-center gap-2 text-sm text-blue-400">
                  <AlertTriangle className="h-4 w-4" />
                  Approving will change issue status to <strong>"In Progress"</strong>
                </p>
              </div>
            )}

            {/* Confirmation Checkbox (on approve) */}
            {decision === "approve" && (
              <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <input
                  type="checkbox"
                  checked={confirmationChecked}
                  onChange={(e) => setConfirmationChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500/50"
                />
                <span className="text-sm text-white/80">
                  I confirm that I have reviewed the verification details and evidence, and approve this verification report.
                </span>
              </label>
            )}

            {/* Remarks Field */}
            <div className="mb-4">
              <label className="mb-2 flex items-center gap-2 text-sm text-white/70">
                <MessageSquare className="h-4 w-4" />
                Admin Remarks
                {decision === "reject" && <span className="text-rose-400">*</span>}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  decision === "reject"
                    ? "Please provide reason for rejection (required)..."
                    : "Add any additional remarks (optional)..."
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 transition-colors focus:border-rose-500/50 focus:outline-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                <p className="flex items-center gap-2 text-sm text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !decision}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-50",
                decision === "approve"
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:shadow-lg hover:shadow-emerald-500/25"
                  : decision === "reject"
                  ? "bg-gradient-to-r from-rose-500 to-red-500 hover:shadow-lg hover:shadow-rose-500/25"
                  : "bg-white/10"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {decision === "approve" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : decision === "reject" ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    <Shield className="h-5 w-5" />
                  )}
                  {decision === "approve"
                    ? "Approve Verification"
                    : decision === "reject"
                    ? "Reject Verification"
                    : "Select Decision"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationReviewModal;
