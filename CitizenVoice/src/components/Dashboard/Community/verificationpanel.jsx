// src/components/Dashboard/Community/VerificationPanel.jsx
import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Image as ImageIcon,
  Award,
  Star,
} from "lucide-react";

// Mock verification queue
const mockVerificationQueue = [
  {
    id: "VER-001",
    issueId: "ISS-104",
    title: "Drainage overflow after rain",
    category: "water",
    location: "Lincoln Elementary School",
    resolvedAt: "2024-12-20T16:00:00Z",
    officialNote:
      "Drain has been cleared and additional capacity added. Please verify the fix during next rainfall.",
    beforeImage:
      "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400",
    afterImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    reporter: "School Admin",
    verifications: {
      verified: 8,
      notResolved: 2,
      partial: 2,
    },
  },
  {
    id: "VER-002",
    issueId: "ISS-078",
    title: "Graffiti on community center wall",
    category: "other",
    location: "Community Center, West Wing",
    resolvedAt: "2024-12-22T10:00:00Z",
    officialNote: "Wall has been repainted. New anti-graffiti coating applied.",
    beforeImage: null,
    afterImage: null,
    reporter: "John D.",
    verifications: {
      verified: 3,
      notResolved: 0,
      partial: 1,
    },
  },
  {
    id: "VER-003",
    issueId: "ISS-089",
    title: "Broken bench in park",
    category: "other",
    location: "Central Park, North Area",
    resolvedAt: "2024-12-23T14:30:00Z",
    officialNote: "Bench replaced with new vandal-resistant model.",
    beforeImage:
      "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400",
    afterImage:
      "https://images.unsplash.com/photo-1590422749897-47036da0b0ff?w=400",
    reporter: "Park Visitor",
    verifications: {
      verified: 5,
      notResolved: 0,
      partial: 0,
    },
  },
];

const verificationOptions = [
  {
    value: "verified",
    label: "Verified Fixed",
    icon: CheckCircle2,
    color: "emerald",
    description: "The issue has been properly resolved",
  },
  {
    value: "partial",
    label: "Partially Resolved",
    icon: AlertCircle,
    color: "amber",
    description: "Some work done but issue persists",
  },
  {
    value: "not-resolved",
    label: "Not Resolved",
    icon: XCircle,
    color: "rose",
    description: "Issue still exists as reported",
  },
];

export function VerificationPanel() {
  const [queue, setQueue] = useState(mockVerificationQueue);
  const [selectedItem, setSelectedItem] = useState(null);
  const [verificationNote, setVerificationNote] = useState("");
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmitVerification = () => {
    if (!selectedVerification || !selectedItem) return;

    // Mock submission
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedItem(null);
      setSelectedVerification(null);
      setVerificationNote("");
      // Remove from queue
      setQueue((prev) => prev.filter((item) => item.id !== selectedItem.id));
    }, 2000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Verification Queue</h2>
          <p className="text-sm text-white/60">
            {queue.length} issues pending verification
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-violet-500/20 px-4 py-2">
          <Award className="h-5 w-5 text-violet-400" />
          <div>
            <p className="text-sm font-medium text-violet-400">Your Score</p>
            <p className="text-xs text-violet-300">42 verifications</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-start gap-3">
          <Star className="h-5 w-5 text-amber-400" />
          <div>
            <p className="font-medium text-white">
              Help verify resolved issues
            </p>
            <p className="text-sm text-white/60">
              Your verifications help ensure issues are truly fixed and build
              community trust. Earn reputation points for accurate
              verifications!
            </p>
          </div>
        </div>
      </div>

      {/* Queue list */}
      {!selectedItem && (
        <div className="space-y-4">
          {queue.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-rose-500/30 hover:bg-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                      Marked Resolved
                    </span>
                    <span className="text-xs text-white/40">
                      {item.issueId}
                    </span>
                  </div>
                  <h3 className="mb-1 font-medium text-white">{item.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Resolved {formatDate(item.resolvedAt)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-2 flex items-center justify-end gap-1">
                    <span className="text-xs text-emerald-400">
                      ✓ {item.verifications.verified}
                    </span>
                    <span className="text-xs text-amber-400">
                      ◐ {item.verifications.partial}
                    </span>
                    <span className="text-xs text-rose-400">
                      ✗ {item.verifications.notResolved}
                    </span>
                  </div>
                  <ChevronRight className="ml-auto h-5 w-5 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-rose-400" />
                </div>
              </div>
            </div>
          ))}

          {queue.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-12">
              <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-400" />
              <h3 className="mb-2 text-lg font-medium text-white">
                All caught up!
              </h3>
              <p className="text-sm text-white/60">
                No issues pending verification right now.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Verification detail view */}
      {selectedItem && !showSuccess && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedItem(null)}
            className="flex items-center gap-1 text-sm text-white/60 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to queue
          </button>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">
                Marked Resolved
              </span>
              <span className="text-sm text-white/40">
                {selectedItem.issueId}
              </span>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              {selectedItem.title}
            </h3>
            <div className="mb-4 flex items-center gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {selectedItem.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Resolved {formatDate(selectedItem.resolvedAt)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Reported by {selectedItem.reporter}
              </span>
            </div>

            {/* Official note */}
            <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-xs font-medium text-white/40">
                Official Resolution Note
              </p>
              <p className="text-sm text-white">{selectedItem.officialNote}</p>
            </div>

            {/* Before/After images */}
            {(selectedItem.beforeImage || selectedItem.afterImage) && (
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-white/60">
                    Before
                  </p>
                  {selectedItem.beforeImage ? (
                    <img
                      src={selectedItem.beforeImage}
                      alt="Before"
                      className="h-48 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5">
                      <ImageIcon className="h-8 w-8 text-white/20" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-white/60">
                    After
                  </p>
                  {selectedItem.afterImage ? (
                    <img
                      src={selectedItem.afterImage}
                      alt="After"
                      className="h-48 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5">
                      <ImageIcon className="h-8 w-8 text-white/20" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Community verification status */}
            <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-3 text-sm font-medium text-white">
                Community Verifications
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm text-white">
                    {selectedItem.verifications.verified} verified
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  <span className="text-sm text-white">
                    {selectedItem.verifications.partial} partial
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-rose-400" />
                  <span className="text-sm text-white">
                    {selectedItem.verifications.notResolved} not resolved
                  </span>
                </div>
              </div>
            </div>

            {/* Verification options */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">
                Your Verification
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {verificationOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedVerification(option.value)}
                      className={cn(
                        "flex flex-col items-center rounded-lg border p-4 transition-all",
                        selectedVerification === option.value
                          ? option.color === "emerald"
                            ? "border-emerald-500 bg-emerald-500/20"
                            : option.color === "amber"
                            ? "border-amber-500 bg-amber-500/20"
                            : "border-rose-500 bg-rose-500/20"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <Icon
                        className={cn(
                          "mb-2 h-8 w-8",
                          option.color === "emerald"
                            ? "text-emerald-400"
                            : option.color === "amber"
                            ? "text-amber-400"
                            : "text-rose-400"
                        )}
                      />
                      <span className="text-sm font-medium text-white">
                        {option.label}
                      </span>
                      <span className="mt-1 text-center text-xs text-white/40">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note input */}
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-white">
                Additional Notes (optional)
              </label>
              <textarea
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
                placeholder="Add any observations or comments..."
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-rose-500/50"
                rows={3}
              />
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmitVerification}
              disabled={!selectedVerification}
              className={cn(
                "mt-6 w-full rounded-lg py-3 font-medium text-white transition-all",
                selectedVerification
                  ? "bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600"
                  : "cursor-not-allowed bg-white/10 text-white/40"
              )}
            >
              Submit Verification
            </button>
          </div>
        </div>
      )}

      {/* Success message */}
      {showSuccess && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-12">
          <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-400" />
          <h3 className="mb-2 text-xl font-semibold text-white">
            Verification Submitted!
          </h3>
          <p className="text-center text-white/60">
            Thank you for helping verify community issues.
            <br />
            You earned +5 reputation points! ⭐
          </p>
        </div>
      )}
    </div>
  );
}

export default VerificationPanel;
