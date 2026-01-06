// src/components/Dashboard/Shared/PublicVerificationSection.jsx
import React, { useState, useEffect } from "react";
import { verificationService } from "../../../services/verificationService";
import { useAuth } from "../../../context/AuthContext";
import {
  ThumbsUp,
  ThumbsDown,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  Shield,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";

export function PublicVerificationSection({ issueId }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [verifiers, setVerifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVerifiers, setShowVerifiers] = useState(false);
  const [loadingVerifiers, setLoadingVerifiers] = useState(false);

  const canViewVerifiers = user?.role === "official" || user?.role === "community";

  useEffect(() => {
    loadStats();
  }, [issueId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await verificationService.getVerificationStats(issueId);
      setStats(response.data);
    } catch (err) {
      console.error("Error loading verification stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadVerifiers = async () => {
    if (!canViewVerifiers) return;
    
    try {
      setLoadingVerifiers(true);
      const response = await verificationService.getVerifierList(issueId);
      setVerifiers(response.data?.verifierList || []);
    } catch (err) {
      console.error("Error loading verifiers:", err);
    } finally {
      setLoadingVerifiers(false);
    }
  };

  const handleToggleVerifiers = () => {
    if (!showVerifiers && verifiers.length === 0) {
      loadVerifiers();
    }
    setShowVerifiers(!showVerifiers);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
        </div>
      </div>
    );
  }

  if (!stats || stats.totalVerifications === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
            <Users className="h-4 w-4 text-violet-400" />
          </div>
          <h3 className="font-semibold text-white">Public Verification</h3>
        </div>
        <p className="text-sm text-white/50">No community verifications yet</p>
      </div>
    );
  }

  const correctPercentage = Math.round((stats.verifiedCount / stats.totalVerifications) * 100);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
          <Users className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Public Verification</h3>
          <p className="text-xs text-white/50">Community feedback on this issue</p>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Correct votes */}
          <button
            onClick={canViewVerifiers ? handleToggleVerifiers : undefined}
            className={`rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center transition-all ${
              canViewVerifiers ? "hover:border-emerald-500/40 cursor-pointer" : ""
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <ThumbsUp className="h-4 w-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{stats.verifiedCount}</span>
            </div>
            <p className="text-xs text-emerald-300/70">Correct</p>
          </button>

          {/* Incorrect votes */}
          <button
            onClick={canViewVerifiers ? handleToggleVerifiers : undefined}
            className={`rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center transition-all ${
              canViewVerifiers ? "hover:border-rose-500/40 cursor-pointer" : ""
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <ThumbsDown className="h-4 w-4 text-rose-400" />
              <span className="text-2xl font-bold text-rose-400">{stats.incorrectCount}</span>
            </div>
            <p className="text-xs text-rose-300/70">Incorrect</p>
          </button>

          {/* Total */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="h-4 w-4 text-white/60" />
              <span className="text-2xl font-bold text-white">{stats.totalVerifications}</span>
            </div>
            <p className="text-xs text-white/50">Total</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="text-emerald-400">{correctPercentage}% verified as correct</span>
            <span className="text-rose-400">{100 - correctPercentage}% incorrect</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
              style={{ width: `${correctPercentage}%` }}
            />
          </div>
        </div>

        {/* View verifiers button */}
        {canViewVerifiers && (
          <button
            onClick={handleToggleVerifiers}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
          >
            {showVerifiers ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span className="text-sm">Hide Verifiers</span>
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span className="text-sm">View Verifiers</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Verifiers List */}
      {showVerifiers && canViewVerifiers && (
        <div className="border-t border-white/10 p-4">
          {loadingVerifiers ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
            </div>
          ) : verifiers.length === 0 ? (
            <p className="text-center text-sm text-white/50 py-2">No verified community members</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {verifiers.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      v.status === "correct" ? "bg-emerald-500/20" : "bg-rose-500/20"
                    }`}>
                      {v.status === "correct" ? (
                        <ThumbsUp className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{v.verifier.name}</p>
                      <p className="text-xs text-white/50 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {v.verifier.area}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40">
                      {v.verifier.aadhaarMasked || "N/A"}
                    </p>
                    <p className="text-xs text-white/40">
                      {v.verifier.mobileMasked || "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PublicVerificationSection;
