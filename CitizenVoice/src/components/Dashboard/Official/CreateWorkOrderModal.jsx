// Create Work Order Modal Component
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
  Wrench,
} from "lucide-react";
import { issueService } from "../../../services/issueService";
import { cn } from "../../../lib/utils";

const WORK_TYPES = [
  { value: "repair", label: "Repair", icon: "🔧" },
  { value: "maintenance", label: "Maintenance", icon: "🛠️" },
  { value: "installation", label: "Installation", icon: "⚙️" },
  { value: "inspection", label: "Inspection", icon: "🔍" },
  { value: "cleanup", label: "Cleanup", icon: "🧹" },
  { value: "other", label: "Other", icon: "📋" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-emerald-400 bg-emerald-500/20" },
  { value: "medium", label: "Medium", color: "text-amber-400 bg-amber-500/20" },
  { value: "high", label: "High", color: "text-orange-400 bg-orange-500/20" },
  { value: "urgent", label: "Urgent", color: "text-red-400 bg-red-500/20" },
];

export function CreateWorkOrderModal({
  isOpen,
  onClose,
  onSuccess,
  relatedIssue = null,
  teamMembers = [],
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    workType: "repair",
    priority: "medium",
    location: {
      address: "",
      landmark: "",
    },
    dueDate: "",
    estimatedDuration: 1,
    assignedToId: "",
    notes: "",
    resourcesRequired: [],
  });

  const [newResource, setNewResource] = useState({
    name: "",
    quantity: 1,
    unit: "units",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill from related issue if provided
  useEffect(() => {
    if (relatedIssue) {
      setFormData((prev) => ({
        ...prev,
        title: `Work Order: ${relatedIssue.title}`,
        description: relatedIssue.description || "",
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
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addResource = () => {
    if (newResource.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        resourcesRequired: [...prev.resourcesRequired, { ...newResource }],
      }));
      setNewResource({ name: "", quantity: 1, unit: "units" });
    }
  };

  const removeResource = (index) => {
    setFormData((prev) => ({
      ...prev,
      resourcesRequired: prev.resourcesRequired.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        relatedIssueId: relatedIssue?._id,
      };

      await issueService.createWorkOrder(payload);
      setSuccess(true);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to create work order");
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
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Create Work Order
              </h2>
              <p className="text-sm text-white/40">
                Assign tasks to field teams
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
              Work Order Created!
            </h3>
            <p className="text-sm text-white/40">
              The work order has been successfully created.
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
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                <p className="text-xs text-rose-300">Related Issue:</p>
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
                placeholder="Enter work order title"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Work Type & Priority Row */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Work Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/60">
                  Work Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {WORK_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          workType: type.value,
                        }))
                      }
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-2 transition-all",
                        formData.workType === type.value
                          ? "border-rose-500 bg-rose-500/20 text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                      )}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-xs">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/60">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
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
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the work to be done..."
                required
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none resize-none"
              />
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
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none"
              />
              <input
                type="text"
                name="location.landmark"
                value={formData.location.landmark}
                onChange={handleChange}
                placeholder="Nearby landmark (optional)"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Due Date & Duration Row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                  <Calendar className="h-4 w-4" />
                  Due Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                  <Clock className="h-4 w-4" />
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  min={0.5}
                  step={0.5}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Assign To */}
            {teamMembers.length > 0 && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                  <User className="h-4 w-4" />
                  Assign To
                </label>
                <select
                  name="assignedToId"
                  value={formData.assignedToId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                >
                  <option value="">Select team member (optional)</option>
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name || member.username} -{" "}
                      {member.officialDetails?.designation || "Team Member"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Resources Required */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Resources Required
              </label>

              {/* Resource List */}
              {formData.resourcesRequired.length > 0 && (
                <div className="mb-3 space-y-2">
                  {formData.resourcesRequired.map((resource, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <span className="text-sm text-white">
                        {resource.quantity} {resource.unit} of {resource.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeResource(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Resource Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newResource.name}
                  onChange={(e) =>
                    setNewResource((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Resource name"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30"
                />
                <input
                  type="number"
                  value={newResource.quantity}
                  onChange={(e) =>
                    setNewResource((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                  min={1}
                  className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                />
                <input
                  type="text"
                  value={newResource.unit}
                  onChange={(e) =>
                    setNewResource((prev) => ({
                      ...prev,
                      unit: e.target.value,
                    }))
                  }
                  placeholder="Unit"
                  className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30"
                />
                <button
                  type="button"
                  onClick={addResource}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                <FileText className="h-4 w-4" />
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional instructions or notes..."
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none resize-none"
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Work Order
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

export default CreateWorkOrderModal;
