// src/components/Dashboard/Official/VerificationFormModal.jsx
import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import {
  X,
  CheckCircle2,
  XCircle,
  Upload,
  FileText,
  AlertTriangle,
  Loader2,
  ClipboardList,
  Wrench,
  Package,
  MessageSquare,
} from "lucide-react";

export function VerificationFormModal({ issue, isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    verificationOutcome: "", // "verified" | "not-verified"
    rootCause: "",
    requiredSteps: "",
    resourceRequirements: "",
    remarks: "",
  });
  const [evidence, setEvidence] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setEvidence((prev) => [...prev, ...files]);
      
      // Generate previews
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.verificationOutcome) {
      newErrors.verificationOutcome = "Please select a verification outcome";
    }

    if (formData.verificationOutcome === "verified") {
      if (!formData.rootCause.trim()) {
        newErrors.rootCause = "Root cause analysis is required for verified issues";
      }
      if (!formData.requiredSteps.trim()) {
        newErrors.requiredSteps = "Required steps must be specified";
      }
    }

    if (formData.verificationOutcome === "not-verified") {
      if (!formData.remarks.trim()) {
        newErrors.remarks = "Please provide remarks explaining why the issue could not be verified";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitData = new FormData();
      
      // Backend expects these exact field names
      submitData.append("reportType", "verification");
      submitData.append("outcome", formData.verificationOutcome);
      submitData.append("rootCause", formData.rootCause || "");
      submitData.append("remarks", formData.remarks || "");
      
      // Add evidence images
      evidence.forEach((file) => {
        submitData.append("images", file);
      });

      await onSubmit(submitData);
      
      // Reset form on success
      setFormData({
        verificationOutcome: "",
        rootCause: "",
        requiredSteps: "",
        resourceRequirements: "",
        remarks: "",
      });
      setEvidence([]);
      setPreviews([]);
      onClose();
    } catch (err) {
      console.error("Verification submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Issue Verification Report</h2>
            <p className="text-sm text-white/60">Document your on-site verification findings</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Issue Reference */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/40">Verifying Issue</p>
              <p className="font-medium text-white">{issue?.title}</p>
              <p className="text-sm text-white/60">ID: {issue?.issueId || issue?._id}</p>
            </div>

            {/* Verification Outcome */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <ClipboardList className="h-4 w-4 text-blue-400" />
                Verification Outcome <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange("verificationOutcome", "verified")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border p-4 transition-all",
                    formData.verificationOutcome === "verified"
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Verified</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange("verificationOutcome", "not-verified")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border p-4 transition-all",
                    formData.verificationOutcome === "not-verified"
                      ? "border-rose-500 bg-rose-500/20 text-rose-400"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Not Verified</span>
                </button>
              </div>
              {errors.verificationOutcome && (
                <p className="text-sm text-rose-400">{errors.verificationOutcome}</p>
              )}
            </div>

            {/* Conditional Fields for Verified */}
            {formData.verificationOutcome === "verified" && (
              <>
                {/* Root Cause */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Root Cause Analysis <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={formData.rootCause}
                    onChange={(e) => handleInputChange("rootCause", e.target.value)}
                    placeholder="Describe the identified root cause of the issue..."
                    rows={3}
                    className={cn(
                      "w-full rounded-xl border bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors",
                      errors.rootCause ? "border-rose-500" : "border-white/10 focus:border-blue-500/50"
                    )}
                  />
                  {errors.rootCause && (
                    <p className="text-sm text-rose-400">{errors.rootCause}</p>
                  )}
                </div>

                {/* Required Steps */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <Wrench className="h-4 w-4 text-blue-400" />
                    Required Remediation Steps <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={formData.requiredSteps}
                    onChange={(e) => handleInputChange("requiredSteps", e.target.value)}
                    placeholder="List the steps required to resolve this issue..."
                    rows={3}
                    className={cn(
                      "w-full rounded-xl border bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors",
                      errors.requiredSteps ? "border-rose-500" : "border-white/10 focus:border-blue-500/50"
                    )}
                  />
                  {errors.requiredSteps && (
                    <p className="text-sm text-rose-400">{errors.requiredSteps}</p>
                  )}
                </div>

                {/* Resource Requirements */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <Package className="h-4 w-4 text-violet-400" />
                    Resource Requirements
                  </label>
                  <textarea
                    value={formData.resourceRequirements}
                    onChange={(e) => handleInputChange("resourceRequirements", e.target.value)}
                    placeholder="Specify any equipment, materials, or personnel required..."
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-blue-500/50"
                  />
                </div>
              </>
            )}

            {/* Evidence Upload */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <Upload className="h-4 w-4 text-cyan-400" />
                Supporting Evidence
              </label>
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="flex cursor-pointer flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-white/40" />
                  <p className="text-sm text-white/60">
                    Click to upload photos or evidence
                  </p>
                  <p className="text-xs text-white/40">PNG, JPG up to 10MB each</p>
                </label>
              </div>
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border border-white/10">
                      <img
                        src={preview}
                        alt={`Evidence ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-rose-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <MessageSquare className="h-4 w-4 text-white/60" />
                Additional Remarks
                {formData.verificationOutcome === "not-verified" && (
                  <span className="text-rose-400">*</span>
                )}
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder={
                  formData.verificationOutcome === "not-verified"
                    ? "Please explain why the issue could not be verified..."
                    : "Any additional observations or notes..."
                }
                rows={3}
                className={cn(
                  "w-full rounded-xl border bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors",
                  errors.remarks ? "border-rose-500" : "border-white/10 focus:border-blue-500/50"
                )}
              />
              {errors.remarks && (
                <p className="text-sm text-rose-400">{errors.remarks}</p>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 border-t border-white/10 bg-[#0a0a0a]/95 px-6 py-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-white/60 transition-all hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !formData.verificationOutcome}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3 text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Submit Verification Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerificationFormModal;
