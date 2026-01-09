// src/components/Dashboard/Community/IssueDetailModal.jsx
import React, { useState, useEffect } from "react";
import { issueService } from "../../../services/issueService";
import { useAuth } from "../../../context/AuthContext";
import {
  X,
  MapPin,
  Clock,
  ThumbsUp,
  MessageCircle,
  Send,
  Loader2,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../../../lib/utils";

const statusConfig = {
  reported: { label: "Reported", color: "bg-gray-500/20 text-gray-400" },
  acknowledged: { label: "Acknowledged", color: "bg-blue-500/20 text-blue-400" },
  "in-progress": { label: "In Progress", color: "bg-amber-500/20 text-amber-400" },
  resolved: { label: "Resolved", color: "bg-emerald-500/20 text-emerald-400" },
  rejected: { label: "Rejected", color: "bg-rose-500/20 text-rose-400" },
};

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

// Helper function to get user ID from user object (supports both id and _id)
const getUserId = (user) => {
  return user?.id || user?._id;
};

export function IssueDetailModal({ issue: initialIssue, onClose, onUpdate }) {
  const { user, loading: authLoading } = useAuth();
  const [issue, setIssue] = useState(initialIssue);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  useEffect(() => {
    console.log("🔍 [IssueDetailModal] Current user:", user);
  }, [user]);

  useEffect(() => {
    if (issue && issue._id) {
      fetchIssueDetails();
      fetchComments();
    }
  }, [issue?._id]);

  const fetchIssueDetails = async () => {
    try {
      const response = await issueService.getIssue(issue._id);
      const fullIssue = response.data?.issue;
      
      if (fullIssue) {
        // Update local state with full issue data (arrays instead of counts)
        setIssue(fullIssue);
        
        // Check if current user has upvoted
        const userId = getUserId(user);
        if (user && userId) {
          const upvotesArray = fullIssue.upvotes || [];
          const hasUserUpvoted = Array.isArray(upvotesArray) 
            ? upvotesArray.some(upvote => {
                if (!upvote) return false;
                return typeof upvote === 'string' 
                  ? upvote === userId 
                  : (upvote._id && upvote._id === userId);
              })
            : false;
          setHasUpvoted(hasUserUpvoted);
        }
      }
    } catch (error) {
      console.error("Failed to fetch issue details:", error);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await issueService.getComments(issue._id);
      setComments(response.data?.comments || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleUpvote = async () => {
    console.log("👍 [IssueDetailModal] Attempting to upvote, user:", user);
    
    const userId = getUserId(user);
    if (!user || !userId) {
      console.warn("⚠️ [IssueDetailModal] User not authenticated for upvote");
      alert("Please login to upvote");
      return;
    }
    
    try {
      setLoading(true);
      const response = await issueService.upvoteIssue(issue._id);
      
      // Update local state
      setHasUpvoted(response.data?.hasUpvoted || response.data?.action === 'added');
      
      // Update issue upvote count
      const upvotesArray = Array.isArray(issue.upvotes) ? issue.upvotes : [];
      const isAdding = response.data?.hasUpvoted || response.data?.action === 'added';
      
      const userId = getUserId(user);
      const updatedUpvotes = isAdding
        ? [...upvotesArray, userId]
        : upvotesArray.filter(upvote => {
            if (!upvote) return false;
            const upvoteId = typeof upvote === 'string' ? upvote : (upvote._id || upvote);
            return upvoteId !== userId;
          });
      
      const updatedIssue = {
        ...issue,
        upvotes: updatedUpvotes
      };
      setIssue(updatedIssue);
      
      // Notify parent component
      if (onUpdate) {
        onUpdate(updatedIssue);
      }
    } catch (error) {
      console.error("Failed to upvote:", error);
      alert("Failed to upvote issue: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    console.log("📝 [IssueDetailModal] Attempting to add comment, user:", user);
    
    const userId = getUserId(user);
    if (!user || !userId) {
      console.warn("⚠️ [IssueDetailModal] User not authenticated for comment");
      alert("Please login to comment");
      return;
    }

    try {
      setSubmitting(true);
      const response = await issueService.addComment(issue._id, newComment.trim());
      
      // Add new comment to list
      const addedComment = response.data?.comment;
      if (addedComment) {
        setComments([...comments, addedComment]);
      }
      
      // Update issue comment count
      const commentsArray = Array.isArray(issue.comments) ? issue.comments : [];
      const updatedIssue = {
        ...issue,
        comments: [...commentsArray, addedComment]
      };
      setIssue(updatedIssue);
      
      // Clear input
      setNewComment("");
      
      // Notify parent
      if (onUpdate) {
        onUpdate(updatedIssue);
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment: " + (error.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  if (!issue) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-900 to-black shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/10 bg-gray-900/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{categoryIcons[issue.category]}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{issue.title}</h2>
                  <p className="text-sm text-white/40">{issue.issueId || issue._id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={cn("rounded-full px-3 py-1 text-xs font-medium", statusConfig[issue.status]?.color)}>
                  {statusConfig[issue.status]?.label}
                </span>
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(issue.createdAt)}
                </span>
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {issue.reportedBy?.username || issue.reporter || "Anonymous"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-4 space-y-6">
          {/* Images */}
          {issue.images && issue.images.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {issue.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Issue ${idx + 1}`}
                  className="w-full h-48 object-cover rounded-lg border border-white/10"
                />
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-2">Description</h3>
            <p className="text-white/70 leading-relaxed">{issue.description}</p>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </h3>
            <p className="text-white/70">{issue.location?.address}</p>
            {issue.location?.city && (
              <p className="text-sm text-white/50">
                {issue.location.city}, {issue.location.state}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 py-4 border-y border-white/10">
            <button
              onClick={handleUpvote}
              disabled={loading || !user || authLoading}
              title={!user ? "Please login to upvote" : authLoading ? "Loading..." : ""}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                hasUpvoted
                  ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10",
                (!user || authLoading) && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ThumbsUp className={cn("h-4 w-4", hasUpvoted && "fill-current")} />
              )}
              <span className="font-medium">{Array.isArray(issue.upvotes) ? issue.upvotes.length : 0}</span>
              <span className="text-sm">{hasUpvoted ? "Upvoted" : "Upvote"}</span>
            </button>
            <div className="flex items-center gap-2 text-white/60">
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">{comments.length || 0}</span>
              <span className="text-sm">Comments</span>
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Comments</h3>
            
            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500">
                    <span className="text-sm font-bold text-white">
                      {user?.username?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={user ? "Add a comment..." : "Login to comment..."}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40 outline-none focus:border-rose-500/50 focus:bg-white/10"
                    disabled={submitting || !user || authLoading}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim() || !user || authLoading}
                    title={!user ? "Please login to comment" : authLoading ? "Loading..." : ""}
                    className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-white transition-colors hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8 text-white/40">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading comments...
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-3 rounded-lg bg-white/5 p-4 border border-white/5">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500">
                        <span className="text-sm font-bold text-white">
                          {comment.user?.username?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {comment.user?.username || "Anonymous"}
                        </span>
                        <span className="text-xs text-white/40">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-white/70">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/40">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IssueDetailModal;
