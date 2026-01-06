// src/components/ProfileIncompleteModal.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, User, ArrowRight, X } from "lucide-react";

export function ProfileIncompleteModal({ isOpen, onClose, message }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToProfile = () => {
    onClose();
    navigate("/profile");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 ring-4 ring-amber-500/10">
            <AlertCircle className="h-8 w-8 text-amber-400" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">
            Profile Incomplete
          </h3>
          <p className="text-white/60">
            {message || "Please complete your profile to report an issue. This helps us verify and process your reports efficiently."}
          </p>
        </div>

        {/* Info box */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-white/70">
              <p className="font-medium text-white mb-1">Required Information:</p>
              <ul className="list-disc list-inside space-y-1 text-white/60">
                <li>Full Address (House No, Area, City, District, State, Pincode)</li>
                <li>Aadhaar Number</li>
                <li>Mobile Number</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-3 text-white/70 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGoToProfile}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 py-3 font-semibold text-white shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 transition-all"
          >
            <span>Complete Profile</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileIncompleteModal;
