// Generate Report Modal Component
import React, { useState } from "react";
import {
  X,
  FileText,
  Calendar,
  Download,
  Loader2,
  Check,
  AlertTriangle,
  BarChart3,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { issueService } from "../../../services/issueService";
import { cn } from "../../../lib/utils";

const REPORT_TYPES = [
  {
    value: "daily-summary",
    label: "Daily Summary",
    icon: "📅",
    description: "Issues and activities from today",
  },
  {
    value: "weekly-summary",
    label: "Weekly Summary",
    icon: "📆",
    description: "Last 7 days overview",
  },
  {
    value: "monthly-summary",
    label: "Monthly Summary",
    icon: "🗓️",
    description: "Last 30 days analysis",
  },
  {
    value: "issue-report",
    label: "Issue Report",
    icon: "📋",
    description: "Detailed issue breakdown",
  },
  {
    value: "performance-report",
    label: "Performance Report",
    icon: "📈",
    description: "Team & resolution metrics",
  },
  {
    value: "department-report",
    label: "Department Report",
    icon: "🏛️",
    description: "Department-wise analysis",
  },
  {
    value: "custom",
    label: "Custom Report",
    icon: "⚙️",
    description: "Custom date range & filters",
  },
];

const FORMATS = [
  { value: "pdf", label: "PDF", icon: "📄" },
  { value: "csv", label: "CSV", icon: "📊" },
  { value: "excel", label: "Excel", icon: "📗" },
];

const CATEGORIES = [
  "roads",
  "water",
  "electricity",
  "sanitation",
  "public-safety",
  "parks",
  "transportation",
  "buildings",
  "environment",
  "other",
];

const STATUSES = [
  "reported",
  "verified",
  "in-progress",
  "resolved",
  "rejected",
];

export function GenerateReportModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    reportType: "weekly-summary",
    dateRange: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    },
    filters: {
      categories: [],
      statuses: [],
      priorities: [],
    },
    format: "pdf",
    includeCharts: true,
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedReport, setGeneratedReport] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("dateRange.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        dateRange: { ...prev.dateRange, [field]: value },
      }));
    } else if (type === "checkbox" && name === "includeCharts") {
      setFormData((prev) => ({ ...prev, includeCharts: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleFilter = (type, value) => {
    setFormData((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [type]: prev.filters[type].includes(value)
          ? prev.filters[type].filter((v) => v !== value)
          : [...prev.filters[type], value],
      },
    }));
  };

  const handleReportTypeChange = (type) => {
    let startDate = formData.dateRange.startDate;
    const endDate = new Date().toISOString().split("T")[0];

    // Auto-set date range based on report type
    switch (type) {
      case "daily-summary":
        startDate = endDate;
        break;
      case "weekly-summary":
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        break;
      case "monthly-summary":
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        break;
      default:
        break;
    }

    setFormData((prev) => ({
      ...prev,
      reportType: type,
      dateRange: { startDate, endDate },
    }));
  };

  // Auto-download report as file
  const downloadReport = (report, fileFormat) => {
    const reportData = report.reportData;
    const reportTitle = report.title || "Report";

    let content, mimeType, extension;

    if (fileFormat === "csv") {
      // Generate CSV content
      const lines = [];
      lines.push("CitizenVoice Report");
      lines.push(`Title,${reportTitle}`);
      lines.push(`Generated,${new Date().toLocaleString()}`);
      lines.push(`Report Type,${report.reportType}`);
      lines.push("");
      lines.push("Summary");
      lines.push(`Total Issues,${reportData?.summary?.totalIssues || 0}`);
      lines.push(`Resolved,${reportData?.summary?.resolved || 0}`);
      lines.push(`In Progress,${reportData?.summary?.inProgress || 0}`);
      lines.push(`Pending,${reportData?.summary?.pending || 0}`);
      lines.push("");
      lines.push("Category Breakdown");
      lines.push("Category,Count,Resolved,Percentage");
      (reportData?.categoryBreakdown || []).forEach((cat) => {
        lines.push(
          `${cat.category || cat._id},${cat.count},${cat.resolved || 0},${
            cat.percentage || 0
          }%`
        );
      });
      lines.push("");
      lines.push("Priority Breakdown");
      lines.push("Priority,Count,Resolved");
      (reportData?.priorityBreakdown || []).forEach((p) => {
        lines.push(`${p.priority || p._id},${p.count},${p.resolved || 0}`);
      });

      content = lines.join("\n");
      mimeType = "text/csv";
      extension = "csv";
    } else {
      // JSON format
      content = JSON.stringify(report, null, 2);
      mimeType = "application/json";
      extension = "json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportTitle.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await issueService.generateAnalyticsReport(formData);
      const report = response.data || response.data?.report;
      setGeneratedReport(report);

      // Auto-download the report
      if (report) {
        downloadReport(report, formData.format === "csv" ? "csv" : "json");
      }
    } catch (err) {
      setError(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGeneratedReport(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-violet-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Generate Report</h2>
              <p className="text-sm text-white/40">
                Create analytics and summary reports
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Report Preview */}
        {generatedReport ? (
          <div className="p-6 space-y-6">
            {/* Success Banner */}
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
              <Check className="h-6 w-6 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-white">
                  Report Generated Successfully!
                </h3>
                <p className="text-sm text-white/60">
                  Report ID: {generatedReport.reportId}
                </p>
              </div>
            </div>

            {/* Report Summary */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {generatedReport.title}
              </h3>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {generatedReport.reportData?.summary?.totalIssues || 0}
                  </p>
                  <p className="text-xs text-white/40">Total Issues</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {generatedReport.reportData?.summary?.resolved || 0}
                  </p>
                  <p className="text-xs text-white/40">Resolved</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-amber-400">
                    {generatedReport.reportData?.summary?.inProgress || 0}
                  </p>
                  <p className="text-xs text-white/40">In Progress</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-rose-400">
                    {generatedReport.reportData?.summary?.pending || 0}
                  </p>
                  <p className="text-xs text-white/40">Pending</p>
                </div>
              </div>

              {/* Category Breakdown */}
              {generatedReport.reportData?.categoryBreakdown &&
                generatedReport.reportData.categoryBreakdown.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Category Breakdown
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedReport.reportData.categoryBreakdown
                        .slice(0, 6)
                        .map((cat, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-white/5 px-3 py-2"
                          >
                            <span className="text-sm font-medium text-white">
                              {cat._id || cat.category}
                            </span>
                            <span className="ml-2 text-xs text-white/40">
                              ({cat.count})
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Priority Breakdown */}
              {generatedReport.reportData?.priorityBreakdown &&
                generatedReport.reportData.priorityBreakdown.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Priority Distribution
                    </h4>
                    <div className="flex gap-2">
                      {generatedReport.reportData.priorityBreakdown.map(
                        (p, i) => {
                          const colors = {
                            urgent: "bg-red-500/20 text-red-400",
                            high: "bg-orange-500/20 text-orange-400",
                            medium: "bg-amber-500/20 text-amber-400",
                            low: "bg-emerald-500/20 text-emerald-400",
                          };
                          return (
                            <div
                              key={i}
                              className={cn(
                                "rounded-lg px-3 py-2",
                                colors[p._id] || "bg-white/10 text-white/60"
                              )}
                            >
                              <span className="text-sm font-medium capitalize">
                                {p._id}
                              </span>
                              <span className="ml-2 text-xs opacity-60">
                                ({p.count})
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setGeneratedReport(null)}
                className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white/60 hover:bg-white/5"
              >
                Generate Another
              </button>
              <button
                onClick={() => {
                  onSuccess?.();
                  handleClose();
                }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 px-6 py-3 text-sm font-medium text-white hover:shadow-lg"
              >
                <Download className="h-4 w-4" />
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Report Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter report title (optional - auto-generated if empty)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Report Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Report Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {REPORT_TYPES.slice(0, 4).map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleReportTypeChange(type.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all",
                      formData.reportType === type.value
                        ? "border-rose-500 bg-rose-500/20 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span className="text-xs text-center">{type.label}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {REPORT_TYPES.slice(4).map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleReportTypeChange(type.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all",
                      formData.reportType === type.value
                        ? "border-rose-500 bg-rose-500/20 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span className="text-xs text-center">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </label>
                <input
                  type="date"
                  name="dateRange.startDate"
                  value={formData.dateRange.startDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                  <Calendar className="h-4 w-4" />
                  End Date
                </label>
                <input
                  type="date"
                  name="dateRange.endDate"
                  value={formData.dateRange.endDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Filters - Categories */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Filter by Category (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleFilter("categories", cat)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs capitalize transition-all",
                      formData.filters.categories.includes(cat)
                        ? "bg-rose-500/30 text-rose-300 border border-rose-500/50"
                        : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                    )}
                  >
                    {cat.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters - Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Filter by Status (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleFilter("statuses", status)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs capitalize transition-all",
                      formData.filters.statuses.includes(status)
                        ? "bg-rose-500/30 text-rose-300 border border-rose-500/50"
                        : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                    )}
                  >
                    {status.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Format & Charts */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/60">
                  Output Format
                </label>
                <div className="flex gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, format: f.value }))
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-4 py-2 transition-all",
                        formData.format === f.value
                          ? "border-rose-500 bg-rose-500/20 text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                      )}
                    >
                      <span>{f.icon}</span>
                      <span className="text-sm">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="includeCharts"
                    checked={formData.includeCharts}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-white/20 bg-white/5 text-rose-500 cursor-pointer"
                  />
                  <span className="flex items-center gap-2 text-sm text-white/80">
                    <TrendingUp className="h-4 w-4" />
                    Include Charts & Visualizations
                  </span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Notes (optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any notes or special instructions for this report..."
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white/60 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 px-6 py-3 text-sm font-medium text-white hover:shadow-lg hover:shadow-rose-500/25 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default GenerateReportModal;
