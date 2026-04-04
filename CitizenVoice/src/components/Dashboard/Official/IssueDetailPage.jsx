// src/components/Dashboard/Official/IssueDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "../../../lib/utils";
import {
  ArrowLeft,
  MapPin,
  User,
  FileText,
  Image as ImageIcon,
  ArrowUpRight,
  AlertTriangle,
  Loader2,
  Tag,
  Clock,
  ClipboardCheck,
  CheckCircle2,
  Hash,
  Calendar,
  Shield,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { issueService } from "../../../services/issueService";
import { useAuth } from "../../../context/AuthContext";
import { VerificationFormModal } from "./VerificationFormModal";
import { ResolutionFormModal } from "./ResolutionFormModal";
import { PublicVerificationSection } from "../Shared/PublicVerificationSection";

// Status configuration
const statusConfig = {
  reported: { 
    label: "Reported", 
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    icon: AlertCircle,
    description: "Issue has been reported and awaiting acknowledgment"
  },
  acknowledged: { 
    label: "Acknowledged", 
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: CheckCircle2,
    description: "Issue acknowledged and pending verification"
  },
  verified: {
    label: "Verified",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Shield,
    description: "Verification approved; funding required to start work",
  },
  "in-progress": { 
    label: "In Progress", 
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Clock,
    description: "Resolution work is currently in progress"
  },
  resolved: { 
    label: "Resolved", 
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
    description: "Issue has been successfully resolved"
  },
  rejected: { 
    label: "Rejected", 
    color: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    icon: AlertTriangle,
    description: "Issue has been rejected"
  },
};

const priorityConfig = {
  high: { label: "High", color: "text-rose-400", bg: "bg-rose-500/20", border: "border-rose-500/30" },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30" },
  low: { label: "Low", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
};

export function IssueDetailPage() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOfficialAdmin = !!user?.isOfficialAdmin;
  
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Razorpay funding
  const [fundingAmount, setFundingAmount] = useState("");
  const [fundingNotes, setFundingNotes] = useState("");
  const [fundingLoading, setFundingLoading] = useState(false);
  
  // Track pending reports
  const [pendingVerification, setPendingVerification] = useState(null);
  const [pendingResolution, setPendingResolution] = useState(null);

  useEffect(() => {
    loadIssueDetails();
  }, [issueId]);

  const loadIssueDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await issueService.getIssue(issueId);
      const issueData = response.data?.issue || response.issue || response.data || response;
      setIssue(issueData);
      
      // Load reports to check for pending submissions
      try {
        const reportsResponse = await issueService.getIssueReports(issueData._id);
        const reports = reportsResponse.data?.reports || reportsResponse.reports || [];
        
        // Find pending verification report
        const pendingVerif = reports.find(r => r.reportType === 'verification' && r.status === 'pending');
        setPendingVerification(pendingVerif || null);
        
        // Find pending resolution report
        const pendingRes = reports.find(r => r.reportType === 'resolution' && r.status === 'pending');
        setPendingResolution(pendingRes || null);
      } catch (reportErr) {
        console.log("Could not fetch reports:", reportErr);
      }
    } catch (err) {
      console.error("Error loading issue:", err);
      setError(err.message || "Failed to load issue details");
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window?.Razorpay) return resolve(true);

      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });
  };

  const handleFundAndStartWork = async () => {
    try {
      if (!issue?._id) return;
      const numericAmount = Number(fundingAmount);
      if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
        alert("Enter a valid amount");
        return;
      }

      setFundingLoading(true);

      await loadRazorpayScript();

      const createResp = await issueService.createFundingOrder({
        issueId: issue._id,
        amount: numericAmount,
        notes: fundingNotes,
      });

      const data = createResp?.data || createResp;
      const order = data?.order;
      const keyId = data?.keyId;
      const transactionId = data?.transactionId;

      if (!order?.id || !keyId || !transactionId) {
        throw new Error("Invalid payment order response");
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Citizen Voice",
        description: `Funding for ${issue.issueId || "issue"}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await issueService.verifyFundingPayment({
              transactionId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await loadIssueDetails();
          } catch (err) {
            console.error("Payment verify error:", err);
            alert(err.message || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.username || "",
          email: user?.email || "",
        },
      };

      const rz = new window.Razorpay(options);
      rz.on("payment.failed", (resp) => {
        console.error("Razorpay payment failed:", resp);
        alert(resp?.error?.description || "Payment failed");
      });
      rz.open();
    } catch (err) {
      console.error("Funding error:", err);
      alert(err.message || "Failed to start payment");
    } finally {
      setFundingLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVerificationSubmit = async (formData) => {
    try {
      setSubmitting(true);
      await issueService.submitReport(issue._id, formData);
      await loadIssueDetails();
      setShowVerificationModal(false);
    } catch (err) {
      console.error("Verification submission error:", err);
      alert(err.message || "Failed to submit verification report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolutionSubmit = async (formData) => {
    try {
      setSubmitting(true);
      await issueService.submitReport(issue._id, formData);
      await loadIssueDetails();
      setShowResolutionModal(false);
    } catch (err) {
      console.error("Resolution submission error:", err);
      alert(err.message || "Failed to submit resolution report");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-rose-500" />
          <p className="text-white/60">Loading issue details...</p>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
          <p className="mb-2 text-rose-400">Failed to load issue</p>
          <p className="mb-4 text-sm text-white/60">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5"
            >
              Go Back
            </button>
            <button
              onClick={loadIssueDetails}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[issue.status]?.icon || AlertCircle;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Issues
        </button>
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Shield className="h-4 w-4" />
          <span>Official Work Portal</span>
        </div>
      </div>

      {/* Main Header Section */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/80 backdrop-blur-xl">
        {/* Status Banner */}
        <div className={cn(
          "flex items-center justify-between border-b px-6 py-3",
          statusConfig[issue.status]?.color.replace("bg-", "border-").split(" ")[0] + "/20",
          statusConfig[issue.status]?.color.split(" ")[0]
        )}>
          <div className="flex items-center gap-3">
            <StatusIcon className="h-5 w-5" />
            <div>
              <span className="font-semibold">{statusConfig[issue.status]?.label}</span>
              <span className="ml-3 text-sm opacity-80">{statusConfig[issue.status]?.description}</span>
            </div>
          </div>
          <span className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            priorityConfig[issue.priority]?.bg,
            priorityConfig[issue.priority]?.color,
            priorityConfig[issue.priority]?.border
          )}>
            {priorityConfig[issue.priority]?.label || issue.priority} Priority
          </span>
        </div>

        {/* Header Content */}
        <div className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/40">Issue Title</p>
                <h1 className="text-2xl font-bold text-white lg:text-3xl">{issue.title}</h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
                  <Hash className="h-4 w-4 text-rose-400" />
                  <span className="font-mono text-white/70">{issue.issueId || issue._id?.slice(-12)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
                  <Tag className="h-4 w-4 text-violet-400" />
                  <span className="capitalize text-white/70">{issue.category || "General"}</span>
                </div>
              </div>
            </div>

            {/* Date Card */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center lg:min-w-[200px]">
              <Calendar className="mx-auto mb-2 h-5 w-5 text-rose-400" />
              <p className="text-xs text-white/40">Date Reported</p>
              <p className="font-medium text-white">{formatDate(issue.createdAt)}</p>
              <p className="text-sm text-white/60">{formatTime(issue.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Primary Information */}
        <div className="space-y-6 lg:col-span-2">
          {/* Issue Description */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20">
                <FileText className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Issue Description</h2>
                <p className="text-xs text-white/50">Detailed information about the reported issue</p>
              </div>
            </div>
            <div className="p-6">
              <p className="whitespace-pre-wrap leading-relaxed text-white/80">
                {issue.description || "No description provided for this issue."}
              </p>
            </div>
          </div>

          {/* Location Information */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                <MapPin className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Location Details</h2>
                <p className="text-xs text-white/50">Where this issue was reported</p>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/40">Address</p>
                  <p className="text-lg text-white">{issue.location?.address || "Location not specified"}</p>
                </div>
                {issue.location?.coordinates && (
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/40">Latitude</p>
                      <p className="font-mono text-white/70">{issue.location.coordinates[1]?.toFixed(6)}°N</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/40">Longitude</p>
                      <p className="font-mono text-white/70">{issue.location.coordinates[0]?.toFixed(6)}°E</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Evidence / Images */}
          {issue.images && issue.images.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
                    <ImageIcon className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Evidence & Attachments</h2>
                    <p className="text-xs text-white/50">{issue.images.length} file(s) attached</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {issue.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/20 transition-all hover:border-violet-500/50"
                    >
                      <img
                        src={img}
                        alt={`Evidence ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-all group-hover:opacity-100">
                        <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                          <ExternalLink className="h-4 w-4 text-white" />
                          <span className="text-sm font-medium text-white">View Full Image</span>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                        Evidence #{idx + 1}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Reporter Information */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="font-semibold text-white">Reporter Information</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-xl font-bold text-white shadow-lg shadow-rose-500/20">
                  {(issue.reportedBy?.username || "U").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{issue.reportedBy?.username || "Unknown User"}</p>
                  {issue.reportedBy?.email && (
                    <p className="text-sm text-white/50">{issue.reportedBy.email}</p>
                  )}
                  <p className="mt-1 text-xs text-white/40">Citizen Reporter</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <h2 className="font-semibold text-white">Issue Timeline</h2>
            </div>
            <div className="divide-y divide-white/5 p-4">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-white/60">Created</span>
                <span className="text-sm font-medium text-white">{formatDate(issue.createdAt).split(",")[1]?.trim()}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-white/60">Last Updated</span>
                <span className="text-sm font-medium text-white">{formatDate(issue.updatedAt || issue.createdAt).split(",")[1]?.trim()}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-white/60">Current Status</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusConfig[issue.status]?.color)}>
                  {statusConfig[issue.status]?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Community Verification Stats */}
          <PublicVerificationSection issueId={issue._id} userRole="official" />

          {/* Action Panel for Non-Admin Officials */}
          {!isOfficialAdmin && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm">
              <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20">
                  <ClipboardCheck className="h-4 w-4 text-rose-400" />
                </div>
                <h2 className="font-semibold text-white">Required Actions</h2>
              </div>
              <div className="p-6">
                {issue.status === "acknowledged" && (
                  <div className="space-y-4">
                    {pendingVerification ? (
                      // Show Pending Review status after submission
                      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-500/30">
                            <Clock className="h-5 w-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-400">Verification Submitted</p>
                            <p className="text-xs text-amber-300/70">Pending Review</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 p-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <p className="text-xs text-white/80">
                            Your verification report has been submitted successfully. Waiting for team leader review.
                          </p>
                        </div>
                        <p className="mt-3 text-xs text-white/50">
                          Submitted on: {pendingVerification.createdAt ? new Date(pendingVerification.createdAt).toLocaleString() : 'Recently'}
                        </p>
                      </div>
                    ) : (
                      // Show submit button if no pending report
                      <>
                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                          <p className="mb-2 text-sm font-medium text-blue-400">Verification Required</p>
                          <p className="text-xs text-white/60">Please visit the location and verify the reported issue.</p>
                        </div>
                        <button
                          onClick={() => setShowVerificationModal(true)}
                          disabled={submitting}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50"
                        >
                          <ClipboardCheck className="h-5 w-5" />
                          Submit Verification Report
                        </button>
                      </>
                    )}
                  </div>
                )}

                {issue.status === "in-progress" && (
                  <div className="space-y-4">
                    {pendingResolution ? (
                      // Show Pending Review status after submission
                      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-500/30">
                            <Clock className="h-5 w-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-400">Resolution Submitted</p>
                            <p className="text-xs text-amber-300/70">Pending Review</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 p-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <p className="text-xs text-white/80">
                            Your resolution report has been submitted successfully. Waiting for team leader review.
                          </p>
                        </div>
                        <p className="mt-3 text-xs text-white/50">
                          Submitted on: {pendingResolution.createdAt ? new Date(pendingResolution.createdAt).toLocaleString() : 'Recently'}
                        </p>
                      </div>
                    ) : (
                      // Show submit button if no pending report
                      <>
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                          <p className="mb-2 text-sm font-medium text-emerald-400">Resolution Required</p>
                          <p className="text-xs text-white/60">Complete the resolution work and submit your report with evidence.</p>
                        </div>
                        <button
                          onClick={() => setShowResolutionModal(true)}
                          disabled={submitting}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          Submit Resolution Report
                        </button>
                      </>
                    )}
                  </div>
                )}

                {issue.status === "verified" && (
                  <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 to-cyan-500/5 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 ring-2 ring-blue-500/30">
                        <Shield className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-400">Verified by Team Leader</p>
                        <p className="text-xs text-blue-300/70">Waiting for funding approval</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 p-3">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <p className="text-xs text-white/80">
                        Funds are required before work can start. Please wait for the team leader to complete payment.
                      </p>
                    </div>
                  </div>
                )}

                {issue.status !== "acknowledged" &&
                  issue.status !== "in-progress" &&
                  issue.status !== "verified" && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                    <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-white/30" />
                    <p className="text-sm text-white/50">
                      {issue.status === "resolved"
                        ? "This issue has been successfully resolved."
                        : issue.status === "rejected"
                        ? "This issue has been rejected."
                        : "No actions available for current status."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Funding Panel for Admin */}
          {isOfficialAdmin && issue.status === "verified" && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm">
              <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20">
                  <Shield className="h-4 w-4 text-rose-400" />
                </div>
                <h2 className="font-semibold text-white">Funding Required</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="mb-1 text-sm font-medium text-blue-400">Verification approved</p>
                  <p className="text-xs text-white/60">Collect funds and start work only after successful payment.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Amount (INR)</label>
                    <input
                      type="number"
                      min={1}
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/30 outline-none focus:border-rose-500/50"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Notes (optional)</label>
                    <input
                      type="text"
                      value={fundingNotes}
                      onChange={(e) => setFundingNotes(e.target.value)}
                      className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/30 outline-none focus:border-rose-500/50"
                      placeholder="e.g., materials advance"
                    />
                  </div>
                </div>

                <button
                  onClick={handleFundAndStartWork}
                  disabled={fundingLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 py-3.5 text-sm font-semibold text-white transition-all hover:bg-rose-600 disabled:opacity-60"
                >
                  {fundingLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Starting payment...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-5 w-5" />
                      Fund & Start Work
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      <VerificationFormModal
        issue={issue}
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSubmit={handleVerificationSubmit}
      />

      {/* Resolution Modal */}
      <ResolutionFormModal
        issue={issue}
        isOpen={showResolutionModal}
        onClose={() => setShowResolutionModal(false)}
        onSubmit={handleResolutionSubmit}
      />
    </div>
  );
}

export default IssueDetailPage;
