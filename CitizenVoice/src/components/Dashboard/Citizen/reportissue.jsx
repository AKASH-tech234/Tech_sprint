// src/components/Dashboard/Citizen/ReportIssue.jsx
import React, { useState, useRef } from "react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import {
  X,
  Camera,
  MapPin,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { issueService } from "../../../services/issueService";

const categories = [
  { value: "pothole", label: "Pothole", icon: "🕳️" },
  { value: "streetlight", label: "Street Light", icon: "💡" },
  { value: "garbage", label: "Garbage/Waste", icon: "🗑️" },
  { value: "water", label: "Water/Drainage", icon: "💧" },
  { value: "traffic", label: "Traffic Issue", icon: "🚦" },
  { value: "noise", label: "Noise Complaint", icon: "🔊" },
  { value: "safety", label: "Public Safety", icon: "⚠️" },
  { value: "other", label: "Other", icon: "📋" },
];

const priorities = [
  { value: "low", label: "Low", color: "text-emerald-400" },
  { value: "medium", label: "Medium", color: "text-amber-400" },
  { value: "high", label: "High", color: "text-rose-400" },
];

export function ReportIssue({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    location: {
      address: "",
      lat: null,
      lng: null,
    },
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            lat: latitude,
            lng: longitude,
          },
        }));

        // Reverse geocoding - mock for now
        // TODO: Integrate with actual geocoding API
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          },
        }));
        setGettingLocation(false);
      },
      () => {
        setError("Unable to get your location. Please enter manually.");
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }
    if (!formData.category) {
      setError("Please select a category");
      return;
    }
    if (!formData.description.trim()) {
      setError("Please describe the issue");
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        images: images.map((img) => img.file),
      };

      await issueService.createIssue(submitData);
      setSuccess(true);

      // Reset form after short delay
      setTimeout(() => {
        setFormData({
          title: "",
          description: "",
          category: "",
          priority: "medium",
          location: { address: "", lat: null, lng: null },
        });
        setImages([]);
        setSuccess(false);
        onSuccess?.();
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to submit issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-xl font-semibold text-white">Report an Issue</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Issue Reported Successfully!
            </h3>
            <p className="text-center text-white/60">
              Thank you for your report. We'll notify you when there's an
              update.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto p-4">
            {/* Error message */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-500/20 p-3 text-sm text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Image upload */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-white">
                Photos (Optional, max 5)
              </label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="group relative h-24 w-24 overflow-hidden rounded-lg border border-white/10"
                  >
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed border-white/20 text-white/40 transition-colors hover:border-rose-500/50 hover:text-rose-400"
                  >
                    <Camera className="mb-1 h-6 w-6" />
                    <span className="text-xs">Add Photo</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white">
                Issue Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Large pothole on Main Street"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-rose-500/50"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white">
                Category *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, category: cat.value }))
                    }
                    className={cn(
                      "flex flex-col items-center rounded-lg border p-3 transition-all",
                      formData.category === cat.value
                        ? "border-rose-500 bg-rose-500/20 text-rose-400"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    <span className="mb-1 text-xl">{cat.icon}</span>
                    <span className="text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white">
                Priority Level
              </label>
              <div className="flex gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, priority: p.value }))
                    }
                    className={cn(
                      "flex-1 rounded-lg border py-2 text-sm transition-all",
                      formData.priority === p.value
                        ? "border-rose-500 bg-rose-500/20 text-rose-400"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white">
                Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  placeholder="Enter address or use GPS"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-rose-500/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="px-4"
                >
                  {gettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-white">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Please describe the issue in detail..."
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-rose-500/50"
              />
            </div>

            {/* Submit button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-rose-500 to-violet-500 text-white hover:from-rose-600 hover:to-violet-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportIssue;
