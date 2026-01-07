// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Save,
  Shield,
  Home,
} from "lucide-react";

// Indian states list
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
  "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [completionStatus, setCompletionStatus] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    fullAddress: {
      houseNo: "",
      area: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
    },
    aadhaarNumber: "",
    mobileNumber: "",
    communityDetails: {
      organizationName: "",
      area: "",
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [profileResponse, completionResponse] = await Promise.all([
        userService.getProfile(),
        userService.checkProfileCompletion(),
      ]);
      
      const userData = profileResponse.data?.user;
      setProfileData(userData);
      setCompletionStatus(completionResponse.data);
      
      // Pre-fill form
      setFormData({
        fullAddress: {
          houseNo: userData?.fullAddress?.houseNo || "",
          area: userData?.fullAddress?.area || "",
          city: userData?.fullAddress?.city || "",
          district: userData?.fullAddress?.district || "",
          state: userData?.fullAddress?.state || "",
          pincode: userData?.fullAddress?.pincode || "",
        },
        aadhaarNumber: userData?.aadhaarNumber || "",
        mobileNumber: userData?.mobileNumber || "",
        communityDetails: {
          organizationName: userData?.communityDetails?.organizationName || "",
          area: userData?.communityDetails?.area || "",
        },
      });
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    const errors = [];
    
    // Validate Aadhaar
    if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber)) {
      errors.push("Aadhaar number must be exactly 12 digits");
    }
    
    // Validate Mobile
    if (formData.mobileNumber && !/^[6-9]\d{9}$/.test(formData.mobileNumber)) {
      errors.push("Mobile number must be a valid 10-digit Indian number");
    }
    
    // Validate Pincode
    if (formData.fullAddress.pincode && !/^\d{6}$/.test(formData.fullAddress.pincode)) {
      errors.push("Pincode must be exactly 6 digits");
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(", "));
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await userService.updateProfile(formData);
      
      // Refresh profile and user data
      await loadProfile();
      if (refreshUser) {
        await refreshUser();
      }
      
      // Check if profile is now complete and navigate to dashboard
      const isNowComplete = response.data?.isProfileComplete || response.data?.user?.isProfileComplete;
      
      if (isNowComplete) {
        setSuccess("Profile completed successfully! Redirecting to dashboard...");
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          const role = user?.role;
          if (role === "official") {
            navigate("/dashboard/official");
          } else if (role === "community") {
            navigate("/dashboard/community");
          } else {
            navigate("/dashboard/citizen");
          }
        }, 1500);
      } else {
        setSuccess("Profile updated successfully!");
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    const role = user?.role;
    if (role === "official") {
      navigate("/dashboard/official");
    } else if (role === "community") {
      navigate("/dashboard/community");
    } else {
      navigate("/dashboard/citizen");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-rose-500" />
          <p className="mt-4 text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
              <p className="mt-1 text-white/60">
                Complete your profile to access all features
              </p>
            </div>
            
            {/* Completion Status Badge */}
            {completionStatus && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                completionStatus.isProfileComplete 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}>
                {completionStatus.isProfileComplete ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {completionStatus.completionPercentage}% Complete
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <p className="text-rose-400">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-400">{success}</p>
          </div>
        )}

        {/* Missing Fields Warning */}
        {completionStatus && !completionStatus.isProfileComplete && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-400">Profile Incomplete</p>
                <p className="mt-1 text-sm text-amber-300/70">
                  Missing fields: {completionStatus.missingFields?.join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20">
                <User className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Basic Information</h2>
                <p className="text-sm text-white/50">Your account details</p>
              </div>
            </div>
            
            <div className="p-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Username
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <User className="h-5 w-5 text-white/40" />
                  <span className="text-white">{profileData?.username || "N/A"}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <Mail className="h-5 w-5 text-white/40" />
                  <span className="text-white">{profileData?.email || "N/A"}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Role
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <Shield className="h-5 w-5 text-white/40" />
                  <span className="text-white capitalize">{profileData?.role || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Home className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Full Address</h2>
                <p className="text-sm text-white/50">Your residential address</p>
              </div>
            </div>
            
            <div className="p-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  House No / Flat No *
                </label>
                <input
                  type="text"
                  value={formData.fullAddress.houseNo}
                  onChange={(e) => handleInputChange("fullAddress.houseNo", e.target.value)}
                  placeholder="e.g., 123, Flat 4B"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Area / Locality *
                </label>
                <input
                  type="text"
                  value={formData.fullAddress.area}
                  onChange={(e) => handleInputChange("fullAddress.area", e.target.value)}
                  placeholder="e.g., Koramangala"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.fullAddress.city}
                  onChange={(e) => handleInputChange("fullAddress.city", e.target.value)}
                  placeholder="e.g., Bangalore"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  District *
                </label>
                <input
                  type="text"
                  value={formData.fullAddress.district}
                  onChange={(e) => handleInputChange("fullAddress.district", e.target.value)}
                  placeholder="e.g., Bangalore Urban"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  State *
                </label>
                <select
                  value={formData.fullAddress.state}
                  onChange={(e) => handleInputChange("fullAddress.state", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                >
                  <option value="" className="bg-slate-900">Select State</option>
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state} className="bg-slate-900">{state}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  value={formData.fullAddress.pincode}
                  onChange={(e) => handleInputChange("fullAddress.pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="e.g., 560034"
                  maxLength={6}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                />
              </div>
            </div>
          </div>

          {/* Identity & Contact Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                <CreditCard className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Identity & Contact</h2>
                <p className="text-sm text-white/50">Verification details</p>
              </div>
            </div>
            
            <div className="p-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Aadhaar Number *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="text"
                    value={formData.aadhaarNumber}
                    onChange={(e) => handleInputChange("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="12-digit Aadhaar number"
                    maxLength={12}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-white placeholder-white/30 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                  />
                </div>
                <p className="mt-1 text-xs text-white/40">
                  {formData.aadhaarNumber.length}/12 digits
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <div className="flex">
                    <span className="flex items-center rounded-l-xl border border-r-0 border-white/10 bg-white/5 px-3 text-white/60">
                      +91
                    </span>
                    <input
                      type="text"
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="w-full rounded-r-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  {formData.mobileNumber.length}/10 digits
                </p>
              </div>
            </div>
          </div>

          {/* Community Details (Only for community role) */}
          {user?.role === "community" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
                  <MapPin className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Community Details</h2>
                  <p className="text-sm text-white/50">Your community organization info</p>
                </div>
              </div>
              
              <div className="p-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={formData.communityDetails.organizationName}
                    onChange={(e) => handleInputChange("communityDetails.organizationName", e.target.value)}
                    placeholder="e.g., Koramangala Residents Association"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Area of Operation
                  </label>
                  <input
                    type="text"
                    value={formData.communityDetails.area}
                    onChange={(e) => handleInputChange("communityDetails.area", e.target.value)}
                    placeholder="e.g., Koramangala, HSR Layout"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
