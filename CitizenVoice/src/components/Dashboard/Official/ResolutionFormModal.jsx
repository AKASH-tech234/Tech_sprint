// src/components/Dashboard/Official/ResolutionFormModal.jsx
import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import {
  X,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  Wrench,
  Package,
  ClipboardCheck,
  Camera,
  AlertCircle,
} from "lucide-react";

export function ResolutionFormModal({ issue, isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    workSummary: "",
    stepsTaken: "",
    resourcesUsed: "",
    completionConfirmed: false,
  });
  const [proofImages, setProofImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setProofImages((prev) => [...prev, ...files]);
      
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });

      // Clear proof error if files added
      if (errors.proofImages) {
        setErrors((prev) => ({ ...prev, proofImages: null }));
      }
    }
  };

  const removeFile = (index) => {
    setProofImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.workSummary.trim()) {
      newErrors.workSummary = "Work summary is required";
    }

    if (!formData.stepsTaken.trim()) {
      newErrors.stepsTaken = "Please describe the steps taken to resolve the issue";
    }

    if (proofImages.length === 0) {
      newErrors.proofImages = "At least one proof photo is required for resolution";
    }

    if (!formData.completionConfirmed) {
      newErrors.completionConfirmed = "Please confirm that the work has been completed";
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
      submitData.append("reportType", "resolution");
      submitData.append("workSummary", formData.workSummary);
      submitData.append("stepsTaken", formData.stepsTaken || "");
      submitData.append("resourcesUsed", formData.resourcesUsed || "");
      submitData.append("completionConfirmed", formData.completionConfirmed);
      
      // Add proof images
      proofImages.forEach((file) => {
        submitData.append("images", file);
      });

      await onSubmit(submitData);
      
      // Reset form on success
      setFormData({
        workSummary: "",
        stepsTaken: "",
        resourcesUsed: "",
        completionConfirmed: false,
      });
      setProofImages([]);
      setPreviews([]);
      onClose();
    } catch (err) {
      console.error("Resolution submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-green-500/10 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Resolution Report</h2>
            <p className="text-sm text-white/60">Document the completed resolution work</p>
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
              <p className="text-xs text-white/40">Resolving Issue</p>
              <p className="font-medium text-white">{issue?.title}</p>
              <p className="text-sm text-white/60">ID: {issue?.issueId || issue?._id}</p>
            </div>

            {/* Work Summary */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <ClipboardCheck className="h-4 w-4 text-emerald-400" />
                Work Summary <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={formData.workSummary}
                onChange={(e) => handleInputChange("workSummary", e.target.value)}
                placeholder="Provide a brief summary of the resolution work completed..."
                rows={3}
                className={cn(
                  "w-full rounded-xl border bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors",
                  errors.workSummary ? "border-rose-500" : "border-white/10 focus:border-emerald-500/50"
                )}
              />
              {errors.workSummary && (
                <p className="text-sm text-rose-400">{errors.workSummary}</p>
              )}
            </div>

            {/* Steps Taken */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <Wrench className="h-4 w-4 text-blue-400" />
                Steps Taken <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={formData.stepsTaken}
                onChange={(e) => handleInputChange("stepsTaken", e.target.value)}
                placeholder="Detail the specific steps taken to resolve the issue...&#10;1. &#10;2. &#10;3. "
                rows={4}
                className={cn(
                  "w-full rounded-xl border bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors",
                  errors.stepsTaken ? "border-rose-500" : "border-white/10 focus:border-emerald-500/50"
                )}
              />
              {errors.stepsTaken && (
                <p className="text-sm text-rose-400">{errors.stepsTaken}</p>
              )}
            </div>

            {/* Resources Used */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <Package className="h-4 w-4 text-violet-400" />
                Resources Used
              </label>
              <textarea
                value={formData.resourcesUsed}
                onChange={(e) => handleInputChange("resourcesUsed", e.target.value)}
                placeholder="List materials, equipment, or personnel utilized..."
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-emerald-500/50"
              />
            </div>

            {/* Proof Upload - Required */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <Camera className="h-4 w-4 text-amber-400" />
                Proof of Resolution <span className="text-rose-400">*</span>
              </label>
              <div
                className={cn(
                  "rounded-xl border border-dashed p-6 text-center transition-colors",
                  errors.proofImages
                    ? "border-rose-500 bg-rose-500/10"
                    : "border-white/20 bg-white/5"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="proof-upload"
                />
                <label
                  htmlFor="proof-upload"
                  className="flex cursor-pointer flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-white/40" />
                  <p className="text-sm text-white/60">
                    Upload photos showing the completed work
                  </p>
                  <p className="text-xs text-white/40">
                    At least one photo required • PNG, JPG up to 10MB
                  </p>
                </label>
              </div>
              {errors.proofImages && (
                <div className="flex items-center gap-2 text-sm text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  {errors.proofImages}
                </div>
              )}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border border-white/10">
                      <img
                        src={preview}
                        alt={`Proof ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-rose-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                        Proof {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completion Confirmation */}
            <div
              className={cn(
                "rounded-xl border p-4 transition-colors",
                formData.completionConfirmed
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : errors.completionConfirmed
                  ? "border-rose-500 bg-rose-500/10"
                  : "border-white/10 bg-white/5"
              )}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.completionConfirmed}
                  onChange={(e) => handleInputChange("completionConfirmed", e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <div>
                  <p className="font-medium text-white">
                    I confirm that the resolution work has been completed
                  </p>
                  <p className="text-sm text-white/60">
                    By checking this box, I verify that all necessary work has been performed
                    and the issue has been resolved to the best of my ability.
                  </p>
                </div>
              </label>
              {errors.completionConfirmed && (
                <p className="mt-2 text-sm text-rose-400">{errors.completionConfirmed}</p>
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
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-3 text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Submit Resolution Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResolutionFormModal;
