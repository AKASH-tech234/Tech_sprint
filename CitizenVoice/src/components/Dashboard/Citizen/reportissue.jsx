// src/components/Dashboard/Citizen/ReportIssue.jsx
import React, { useState, useRef, useEffect } from "react";
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
  Trash2,
  Sparkles,
} from "lucide-react";
import { issueService } from "../../../services/issueService";
import classificationService from "../../../services/classificationService";
import ClassificationResults from "../../ClassificationResults";

/**
 * BACKEND API ENDPOINTS REQUIRED:
 *
 * 1. POST /api/issues/create
 *    - Accepts: FormData with fields: title, description, category, priority, location (JSON), images (files)
 *    - Returns: { success: true, issue: {...}, message: "Issue created successfully" }
 *
 * 2. POST /api/geocoding/reverse
 *    - Accepts: { lat: number, lng: number }
 *    - Returns: { address: string, city: string, state: string }
 *    - Used to convert GPS coordinates to human-readable address
 *
 * 3. POST /api/uploads/images
 *    - Accepts: FormData with image files
 *    - Returns: { urls: string[] }
 *    - Optional: For separate image upload before issue creation
 */

const categories = [
  { value: "pothole", label: "Pothole", icon: "🕳️" },
  { value: "streetlight", label: "Street Light", icon: "💡" },
  { value: "garbage", label: "Garbage/Waste", icon: "🗑️" },
  { value: "water", label: "Water/Drainage", icon: "💧" },
  { value: "traffic", label: "Traffic Issue", icon: "🚦" },
  { value: "noise", label: "Noise Complaint", icon: "🔊" },
  { value: "safety", label: "Public Safety", icon: "⚠️" },
  { value: "other", label: "Other", icon: "📋" },
  // ML Model categories
  { value: "INFRASTRUCTURE", label: "Infrastructure", icon: "🏗️" },
  { value: "STREETLIGHT", label: "Streetlight", icon: "💡" },
  { value: "ROAD_SIGNS", label: "Road Signs", icon: "🚧" },
  { value: "POLLUTION", label: "Pollution", icon: "🏭" },
  { value: "FALLEN_TREES", label: "Fallen Trees", icon: "🌳" },
  { value: "GARBAGE", label: "Garbage", icon: "🗑️" },
  { value: "GRAFFITI", label: "Graffiti", icon: "🎨" },
  { value: "ILLEGAL_PARKING", label: "Illegal Parking", icon: "🚗" },
  { value: "ROAD_POTHOLE", label: "Road Pothole", icon: "🕳️" },
];

const priorities = [
  { value: "low", label: "Low", color: "text-emerald-400" },
  { value: "medium", label: "Medium", color: "text-amber-400" },
  { value: "high", label: "High", color: "text-rose-400" },
];

export function ReportIssue({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  initialData = null,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    location: {
      address: "",
      lat: null,
      lng: null,
      city: "",
      state: "",
      district: "",
      country: "",
      pincode: "",
    },
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // AI Classification state
  const [classification, setClassification] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [classificationError, setClassificationError] = useState(null);

  // State/District selector state
  const [statesData, setStatesData] = useState({});
  const [availableDistricts, setAvailableDistricts] = useState([]);

  // Load states and districts data
  useEffect(() => {
    fetch('/india_states_districts.json')
      .then(res => res.json())
      .then(data => setStatesData(data))
      .catch(err => console.error('Failed to load states data:', err));
  }, []);

  // Update available districts when state changes
  useEffect(() => {
    if (formData.location.state && statesData[formData.location.state]) {
      setAvailableDistricts(statesData[formData.location.state]);
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.location.state, statesData]);

  // Initialize form data when editing
  useEffect(() => {
    if (editMode && initialData && isOpen) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        category: initialData.category || "",
        priority: initialData.priority || "medium",
        location: initialData.location || {
          address: "",
          lat: null,
          lng: null,
          city: "",
          state: "",
          district: "",
          country: "",
          pincode: "",
        },
      });

      // Set existing images if any
      if (initialData.images && initialData.images.length > 0) {
        setImagePreviews(initialData.images);
        // Images are already uploaded, we'll keep the URLs
      }
    } else if (!editMode && isOpen && !formData.location.lat) {
      getCurrentLocation();
    }
  }, [isOpen, editMode, initialData]);

  // Auto-detect location on mount (only for new issues)
  useEffect(() => {
    if (isOpen && !editMode && !formData.location.lat) {
      getCurrentLocation();
    }
  }, [isOpen, editMode]);

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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    // Validation
    if (files.length + images.length > 5) {
      setError("Maximum 5 images allowed");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate file types
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type)
    );
    if (invalidFiles.length > 0) {
      setError("Only JPEG, PNG, WebP, and GIF images are allowed");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate file sizes (max 5MB each)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError("Each image must be less than 5MB");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Create previews
    const newPreviews = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === files.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages((prev) => [...prev, ...files]);

    // Trigger AI classification for the first image
    if (files.length > 0 && !classification) {
      await classifyImage(files[0]);
    }
  };

  // AI Classification function
  const classifyImage = async (imageFile) => {
    setClassifying(true);
    setClassificationError(null);

    try {
      const result = await classificationService.classifyImage(imageFile);
      setClassification(result);
      console.log("✅ AI Classification result:", result);
    } catch (err) {
      console.error("❌ Classification error:", err);
      setClassificationError(err.message || "Failed to classify image");
      // Don't block the form on classification failure
    } finally {
      setClassifying(false);
    }
  };

  // State for generating details
  const [generatingDetails, setGeneratingDetails] = useState(false);

  // Accept AI classification suggestion - calls OpenAI to generate title & description
  const handleAcceptClassification = async () => {
    if (!classification) return;

    setGeneratingDetails(true);

    try {
      // Call OpenAI to generate title and description
      const details = await classificationService.generateIssueDetails(
        classification
      );
      console.log("✅ Generated issue details:", details);

      // Auto-fill the form with generated details
      setFormData((prev) => ({
        ...prev,
        title: details.title || prev.title,
        description: details.description || prev.description,
        category: details.category || classification.category || prev.category,
        priority: details.priority || classification.priority || prev.priority,
      }));
    } catch (err) {
      console.error("❌ Failed to generate details:", err);
      // Fallback: just use classification data without OpenAI
      setFormData((prev) => ({
        ...prev,
        category: classification.category,
        priority: classification.priority || prev.priority,
      }));
    } finally {
      setGeneratingDetails(false);
    }
  };

  // Reject AI classification suggestion
  const handleRejectClassification = () => {
    setClassification(null);
    // User will manually select category
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        console.log(
          `✅ Location acquired: ${latitude}, ${longitude} (accuracy: ${accuracy.toFixed(
            0
          )}m)`
        );

        // Update coordinates immediately
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            lat: latitude,
            lng: longitude,
          },
        }));

        // Reverse geocoding to get address, state, and district
        try {
          console.log('🌍 Starting reverse geocoding...');
          
          // Use Nominatim (OpenStreetMap) for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `format=json&lat=${latitude}&lon=${longitude}&` +
            `addressdetails=1&zoom=18`,
            {
              headers: {
                'User-Agent': 'CitizenVoice App'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Reverse geocoding failed');
          }

          const data = await response.json();
          console.log('🌍 Reverse geocoding response:', data);

          // Extract address components
          const address = data.address || {};
          const displayName = data.display_name || `${latitude.toFixed(6)}°N, ${longitude.toFixed(6)}°E`;
          
          // Extract state - try different possible keys
          const state = address.state || 
                       address.state_district || 
                       address.region || 
                       'Unknown State';
          
          // Extract district - try different possible keys
          const district = address.state_district || 
                          address.county || 
                          address.district || 
                          address.city || 
                          address.town || 
                          address.village || 
                          'Unknown District';
          
          const city = address.city || 
                      address.town || 
                      address.village || 
                      address.municipality || 
                      district;
          
          const country = address.country || 'India';
          const pincode = address.postcode || '';

          console.log('📍 Extracted location:', { state, district, city, country, pincode });

          setFormData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              address: displayName,
              city: city,
              state: state,
              district: district,
              country: country,
              pincode: pincode
            },
          }));

          console.log('✅ Location data updated with reverse geocoding');
        } catch (err) {
          console.error("❌ Reverse geocoding failed:", err);
          
          // Fallback: use coordinates as address
          const coordinateAddress = `${latitude.toFixed(6)}°N, ${longitude.toFixed(6)}°E`;
          
          setFormData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              address: `${latitude.toFixed(6)}°N, ${longitude.toFixed(6)}°E`,
            },
          }));
        }

        setGettingLocation(false);
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
        let errorMessage = "Unable to get your location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location permission denied. Please enable location access in your browser settings or enter location manually.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Location information is unavailable. Please enter location manually.";
            break;
          case error.TIMEOUT:
            errorMessage =
              "Location request timed out. Please try again or enter manually.";
            break;
          default:
            errorMessage =
              "An error occurred while getting location. Please enter manually.";
        }
        console.warn("⚠️ " + errorMessage);
        // Don't show error for permission denial, just log it
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
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
    if (!formData.location.lat || !formData.location.lng) {
      setError("Please provide a location using GPS or enter manually");
      return;
    }
    if (!formData.location.state || !formData.location.district) {
      setError("Please select your state and district");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Prepare FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("priority", formData.priority);
      formDataToSend.append("location", JSON.stringify(formData.location));

      // Append new images (if any)
      images.forEach((image, index) => {
        formDataToSend.append("images", image);
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      let result;

      if (editMode && initialData) {
        // Update existing issue
        result = await issueService.updateIssue(
          initialData._id,
          formDataToSend
        );
      } else {
        // Create new issue - saved to MongoDB via API
        result = await issueService.createIssue(formDataToSend);

        // Clean up any old localStorage data to prevent quota errors
        try {
          localStorage.removeItem("userIssues");
        } catch (e) {
          console.warn("Could not clean localStorage:", e);
        }

        // Dispatch custom event to notify other components to refresh from API
        const newIssue = result.issue ||
          result.data?.issue || { id: `ISS-${Date.now()}` };
        window.dispatchEvent(
          new CustomEvent("issueCreated", {
            detail: { id: newIssue._id || newIssue.id },
          })
        );
        console.log(
          "✅ Issue created in database:",
          newIssue._id || newIssue.id
        );
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);

      // Reset form after short delay
      setTimeout(() => {
        setFormData({
          title: "",
          description: "",
          category: "",
          priority: "medium",
          location: { address: "", lat: null, lng: null, city: "", state: "", district: "", country: "", pincode: "" },
        });
        setImages([]);
        setImagePreviews([]);
        setSuccess(false);
        setUploadProgress(0);

        // Pass the FormData or result to parent for database update
        if (editMode) {
          onSuccess?.(formDataToSend); // Pass FormData for update
        } else {
          onSuccess?.(result); // Pass result for create
        }
        onClose?.();
      }, 2000);
    } catch (err) {
      console.error(
        editMode ? "Issue update error:" : "Issue creation error:",
        err
      );
      setError(
        err.message ||
          `Failed to ${editMode ? "update" : "submit"} issue. Please try again.`
      );
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-xl font-semibold text-white">
            {editMode ? "Edit Issue" : "Report an Issue"}
          </h2>
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
              {editMode
                ? "Issue Updated Successfully!"
                : "Issue Reported Successfully!"}
            </h3>
            <p className="text-center text-white/60">
              Thank you for your report. We'll notify you when there's an
              update.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6"
            style={{ maxHeight: "calc(90vh - 80px)" }}
          >
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
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="group relative h-24 w-24 overflow-hidden rounded-lg border border-white/10"
                  >
                    <img
                      src={preview}
                      alt={`Upload ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-rose-500/90 p-1.5 opacity-0 transition-opacity hover:bg-rose-600 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3 text-white" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                      <span className="text-[10px] text-white/80">
                        {(images[index]?.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed border-white/20 text-white/40 transition-colors hover:border-rose-500/50 hover:bg-rose-500/5 hover:text-rose-400"
                  >
                    <Camera className="mb-1 h-6 w-6" />
                    <span className="text-xs">Add Photo</span>
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-white/40">
                Supports: JPEG, PNG, WebP, GIF • Max 5MB each
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* AI Classification Loading State */}
              {classifying && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-500/20 p-3 text-sm text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing image with AI...</span>
                </div>
              )}

              {/* AI Classification Error */}
              {classificationError && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/20 p-3 text-sm text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    AI classification unavailable: {classificationError}
                  </span>
                </div>
              )}

              {/* AI Classification Results */}
              {classification && !classifying && (
                <div className="mt-4">
                  <ClassificationResults
                    classification={classification}
                    onAccept={handleAcceptClassification}
                    onReject={handleRejectClassification}
                    isGenerating={generatingDetails}
                  />
                </div>
              )}
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

            {/* Location with GPS Coordinates */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white">
                Location *
              </label>

              {/* Address Input with GPS Button */}
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  placeholder="Enter address or use GPS"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-rose-500/50"
                  readOnly={gettingLocation}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="shrink-0 px-4"
                  title="Get current location"
                >
                  {gettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* GPS Coordinates Display & Manual Input */}
              {formData.location.lat && formData.location.lng ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    GPS Location Captured
                  </div>

                  {/* Coordinate Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-white/60">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.location.lat}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: {
                              ...prev.location,
                              lat: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-white/60">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.location.lng}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: {
                              ...prev.location,
                              lng: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  {/* Map Preview Placeholder */}
                  <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    <div className="relative aspect-video w-full bg-gradient-to-br from-emerald-500/20 to-violet-500/20">
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <MapPin className="mb-2 h-8 w-8 text-emerald-400" />
                        <p className="text-xs text-white/60">Map Preview</p>
                        <p className="text-xs text-white/40">
                          {formData.location.lat.toFixed(6)},{" "}
                          {formData.location.lng.toFixed(6)}
                        </p>
                      </div>
                      {/* This is where Google Maps or Leaflet map would be embedded */}
                      {/* <iframe 
                        src={`https://maps.google.com/maps?q=${formData.location.lat},${formData.location.lng}&z=15&output=embed`}
                        className="h-full w-full"
                        frameBorder="0"
                      /> */}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-4 text-center">
                  <MapPin className="mx-auto mb-2 h-6 w-6 text-white/40" />
                  <p className="text-sm text-white/60">
                    Click the GPS button to capture your location
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Or enter coordinates manually below
                  </p>

                  {/* Manual Coordinate Entry */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        step="0.000001"
                        placeholder="Latitude"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setFormData((prev) => ({
                              ...prev,
                              location: { ...prev.location, lat: val },
                            }));
                          }
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-rose-500/50"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.000001"
                        placeholder="Longitude"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setFormData((prev) => ({
                              ...prev,
                              location: { ...prev.location, lng: val },
                            }));
                          }
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-rose-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* State and District Selection */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white">
                Location Details
              </label>
              
              {/* Auto-detected location info */}
              {formData.location.state && formData.location.district && (
                <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Auto-detected from GPS
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
                    <div>
                      <span className="text-white/50">State:</span> {formData.location.state}
                    </div>
                    <div>
                      <span className="text-white/50">District:</span> {formData.location.district}
                    </div>
                    {formData.location.city && (
                      <div>
                        <span className="text-white/50">City:</span> {formData.location.city}
                      </div>
                    )}
                    {formData.location.pincode && (
                      <div>
                        <span className="text-white/50">Pincode:</span> {formData.location.pincode}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    You can manually adjust state and district below if needed
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* State Selector */}
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    State {!formData.location.state && '*'}
                  </label>
                  <select
                    name="location.state"
                    value={formData.location.state}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        location: { 
                          ...prev.location, 
                          state: e.target.value,
                          district: "" // Reset district when state changes
                        },
                      }));
                    }}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-rose-500/50"
                  >
                    <option value="" className="bg-zinc-900">
                      {formData.location.state ? formData.location.state : 'Select State'}
                    </option>
                    {Object.keys(statesData).sort().map(state => (
                      <option key={state} value={state} className="bg-zinc-900">
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District Selector */}
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    District {!formData.location.district && '*'}
                  </label>
                  <select
                    name="location.district"
                    value={formData.location.district}
                    onChange={handleInputChange}
                    disabled={!formData.location.state && availableDistricts.length === 0}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-rose-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" className="bg-zinc-900">
                      {formData.location.district ? formData.location.district : 'Select District'}
                    </option>
                    {availableDistricts.sort().map(district => (
                      <option key={district} value={district} className="bg-zinc-900">
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {!formData.location.state && !formData.location.district && (
                <p className="mt-2 text-xs text-white/40">
                  💡 Tip: Click the GPS button above to auto-detect your location
                </p>
              )}
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

            {/* Upload Progress */}
            {loading && uploadProgress > 0 && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || gettingLocation}
                className="flex-1 bg-gradient-to-r from-rose-500 to-violet-500 text-white hover:from-rose-600 hover:to-violet-600 disabled:opacity-50"
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
