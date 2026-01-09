// Schedule Inspection Modal Component
import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  AlertTriangle,
  Loader2,
  Check,
  Search,
  Plus,
  Trash2,
} from "lucide-react";
import { issueService } from "../../../services/issueService";
import { cn } from "../../../lib/utils";

const INSPECTION_TYPES = [
  { value: "site-visit", label: "Site Visit", icon: "📍" },
  { value: "quality-check", label: "Quality Check", icon: "✅" },
  { value: "progress-review", label: "Progress Review", icon: "📊" },
  { value: "safety-audit", label: "Safety Audit", icon: "🦺" },
  { value: "follow-up", label: "Follow Up", icon: "🔄" },
  { value: "pre-work", label: "Pre-Work", icon: "📋" },
  { value: "post-work", label: "Post-Work", icon: "🏁" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-emerald-400 bg-emerald-500/20" },
  { value: "medium", label: "Medium", color: "text-amber-400 bg-amber-500/20" },
  { value: "high", label: "High", color: "text-orange-400 bg-orange-500/20" },
  { value: "urgent", label: "Urgent", color: "text-red-400 bg-red-500/20" },
];

const DEFAULT_CHECKLIST = [
  "Verify site conditions",
  "Document current status",
  "Take photographs",
  "Note safety concerns",
  "Check resource availability",
];

export function ScheduleInspectionModal({
  isOpen,
  onClose,
  onSuccess,
  relatedIssue = null,
  teamMembers = [],
}) {
  const [formData, setFormData] = useState({
    title: "",
    inspectionType: "site-visit",
    priority: "medium",
    location: {
      address: "",
      landmark: "",
    },
    scheduledDate: "",
    scheduledTime: "09:00",
    estimatedDuration: 60,
    assignedToId: "",
    instructions: "",
    checklist: [],
    siteContact: {
      name: "",
      phone: "",
    },
  });

  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill from related issue if provided
  useEffect(() => {
    if (relatedIssue) {
      setFormData((prev) => ({
        ...prev,
        title: `Inspection: ${relatedIssue.title}`,
        location: {
          address: relatedIssue.location?.address || "",
          landmark: relatedIssue.location?.landmark || "",
        },
        priority: relatedIssue.priority || "medium",
      }));
    }
  }, [relatedIssue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [field]: value },
      }));
    } else if (name.startsWith("siteContact.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        siteContact: { ...prev.siteContact, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData((prev) => ({
        ...prev,
        checklist: [
          ...prev.checklist,
          { item: newChecklistItem.trim(), completed: false },
        ],
      }));
      setNewChecklistItem("");
    }
  };

  const removeChecklistItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index),
    }));
  };

  const addDefaultChecklist = () => {
    setFormData((prev) => ({
      ...prev,
      checklist: DEFAULT_CHECKLIST.map((item) => ({ item, completed: false })),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Combine date and time
      const scheduledDateTime = new Date(
        `${formData.scheduledDate}T${formData.scheduledTime}`
      );

      const payload = {
        ...formData,
        scheduledDate: scheduledDateTime.toISOString(),
        relatedIssueId: relatedIssue?._id,
      };

      await issueService.scheduleInspection(payload);
      setSuccess(true);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to schedule inspection");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-violet-500">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Schedule Inspection
              </h2>
              <p className="text-sm text-white/40">
                Plan site visits and quality checks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Inspection Scheduled!
            </h3>
            <p className="text-sm text-white/40">
              The inspection has been added to the calendar.
            </p>
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

            {/* Related Issue Banner */}
            {relatedIssue && (
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-3">
                <p className="text-xs text-violet-300">Related Issue:</p>
                <p className="text-sm text-white">
                  {relatedIssue.issueId} - {relatedIssue.title}
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter inspection title"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Inspection Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Inspection Type
              </label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {INSPECTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        inspectionType: type.value,
                      }))
                    }
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 transition-all",
                      formData.inspectionType === type.value
                        ? "border-violet-500 bg-violet-500/20 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-[10px] text-center leading-tight">
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, priority: p.value }))
                    }
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                      formData.priority === p.value
                        ? `border-transparent ${p.color}`
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                <MapPin className="h-4 w-4" />
                Location <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="location.address"
                value={formData.location.address}
                onChange={handleChange}
                placeholder="Enter address"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none"
              />
              <input
                type="text"
                name="location.landmark"
                value={formData.location.landmark}
                onChange={handleChange}
                placeholder="Nearby landmark (optional)"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Date, Time & Duration Row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                  <Calendar className="h-4 w-4" />
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                  <Clock className="h-4 w-4" />
                  Time
                </label>
                <input
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/60">
                  Duration (min)
                </label>
                <input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  min={15}
                  step={15}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Assign Inspector */}
            {teamMembers.length > 0 && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                  <User className="h-4 w-4" />
                  Assign Inspector
                </label>
                <select
                  name="assignedToId"
                  value={formData.assignedToId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="">Select inspector (optional)</option>
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name || member.username} -{" "}
                      {member.officialDetails?.designation || "Team Member"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Site Contact */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Site Contact (optional)
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  name="siteContact.name"
                  value={formData.siteContact.name}
                  onChange={handleChange}
                  placeholder="Contact person name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none"
                />
                <input
                  type="tel"
                  name="siteContact.phone"
                  value={formData.siteContact.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Checklist */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-white/60">
                  Inspection Checklist
                </label>
                {formData.checklist.length === 0 && (
                  <button
                    type="button"
                    onClick={addDefaultChecklist}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    + Add Default Checklist
                  </button>
                )}
              </div>

              {/* Checklist Items */}
              {formData.checklist.length > 0 && (
                <div className="mb-3 space-y-2">
                  {formData.checklist.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <span className="text-sm text-white">{item.item}</span>
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Checklist Item */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Add checklist item..."
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), addChecklistItem())
                  }
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                <FileText className="h-4 w-4" />
                Special Instructions
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                placeholder="Any special instructions for the inspector..."
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
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
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Schedule Inspection
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

export default ScheduleInspectionModal;
