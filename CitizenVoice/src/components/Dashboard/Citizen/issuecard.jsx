// src/components/Dashboard/Citizen/IssueCard.jsx
import React from "react";
import { cn } from "../../../lib/utils";
import {
  MapPin,
  Calendar,
  ThumbsUp,
  MessageCircle,
  Clock,
  ChevronRight,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  MoreVertical,
  Edit,
} from "lucide-react";

// Status configuration
const statusConfig = {
  reported: {
    label: "Reported",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: Eye,
  },
  acknowledged: {
    label: "Acknowledged",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: CheckCircle2,
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Wrench,
  },
  resolved: {
    label: "Resolved",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    icon: XCircle,
  },
};

// Priority configuration
const priorityConfig = {
  high: {
    label: "High",
    color: "text-rose-400",
    icon: AlertTriangle,
  },
  medium: {
    label: "Medium",
    color: "text-amber-400",
    icon: AlertTriangle,
  },
  low: {
    label: "Low",
    color: "text-emerald-400",
    icon: AlertTriangle,
  },
};

// Category icons
const categoryIcons = {
  pothole: "🕳️",
  streetlight: "💡",
  garbage: "🗑️",
  water: "💧",
  traffic: "🚦",
  noise: "🔊",
  safety: "⚠️",
  other: "📋",
};

export function IssueCard({
  issue,
  variant = "default",
  onView,
  onUpvote,
  onDelete,
  onUpdate,
  showActions = false,
  className,
}) {
  const [showMenu, setShowMenu] = React.useState(false);
  const status = statusConfig[issue.status] || statusConfig.reported;
  const priority = priorityConfig[issue.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;
  const PriorityIcon = priority.icon;
  const categoryIcon = categoryIcons[issue.category] || categoryIcons.other;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  if (variant === "compact") {
    return (
      <div
        onClick={() => onView?.(issue)}
        className={cn(
          "group cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4 transition-all hover:border-rose-500/30 hover:bg-white/10",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoryIcon}</span>
              <h4 className="font-medium text-white line-clamp-1">
                {issue.title}
              </h4>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(issue.updatedAt)}
              </span>
              <span
                className={cn("rounded-full border px-2 py-0.5", status.color)}
              >
                {status.label}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-rose-400" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-xl border border-white/10 bg-black/50 transition-all hover:border-rose-500/30",
        className
      )}
    >
      {/* Image section */}
      {issue.images?.[0] && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={issue.images[0]}
            alt={issue.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-3 left-3">
            <span
              className={cn(
                "rounded-full border px-2 py-1 text-xs",
                status.color
              )}
            >
              {status.label}
            </span>
          </div>
        </div>
      )}

      {/* Content section */}
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{categoryIcon}</span>
            <div>
              <h3 className="font-semibold text-white line-clamp-1">
                {issue.title}
              </h3>
              <p className="text-xs text-white/40">#{issue._id || issue.id}</p>
            </div>
          </div>
          <div
            className={cn("flex items-center gap-1 text-sm", priority.color)}
          >
            <PriorityIcon className="h-4 w-4" />
            <span className="text-xs">{priority.label}</span>
          </div>
        </div>

        <p className="mb-3 text-sm text-white/60 line-clamp-2">
          {issue.description}
        </p>

        {/* Meta info */}
        <div className="mb-4 flex flex-wrap gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {issue.location?.address || "Location"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(issue.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(issue.updatedAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpvote?.(issue._id || issue.id);
              }}
              className="flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-rose-400"
              title="Upvote this issue"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{issue.upvoteCount || issue.upvotes?.length || 0}</span>
            </button>
            <span className="flex items-center gap-1 text-sm text-white/60">
              <MessageCircle className="h-4 w-4" />
              <span>{issue.comments?.length || 0}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView?.(issue)}
              className="flex items-center gap-1 text-sm text-rose-400 transition-colors hover:text-rose-300"
            >
              View Details
              <ChevronRight className="h-4 w-4" />
            </button>
            
            {showActions && (onDelete || onUpdate) && (
              <div className="flex items-center gap-1">
                {onUpdate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate(issue);
                    }}
                    className="group relative rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-400 transition-all hover:border-amber-500/50 hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/20"
                    title="Edit issue"
                  >
                    <div className="flex items-center gap-1.5">
                      <Edit className="h-3.5 w-3.5" />
                      <span className="font-medium">Edit</span>
                    </div>
                  </button>
                )}
                
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(issue._id || issue.id);
                    }}
                    className="group relative rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-400 transition-all hover:border-rose-500/50 hover:bg-rose-500/20 hover:shadow-lg hover:shadow-rose-500/20"
                    title="Delete issue"
                  >
                    <div className="flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="font-medium">Delete</span>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IssueCard;
