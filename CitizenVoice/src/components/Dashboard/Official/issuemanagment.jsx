// src/components/Dashboard/Official/IssueManagement.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../../lib/utils";
import {
  Search,
  Filter,
  MoreVertical,
  User,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ArrowUpRight,
  Loader2,
  Eye,
} from "lucide-react";
import { issueService } from "../../../services/issueService";
import { useAuth } from "../../../context/AuthContext";

// Status configuration - Updated to match backend statuses
const statusConfig = {
  reported: { label: "Reported", color: "bg-gray-500/20 text-gray-400", order: 0 },
  acknowledged: {
    label: "Acknowledged",
    color: "bg-blue-500/20 text-blue-400",
    order: 1,
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-amber-500/20 text-amber-400",
    order: 2,
  },
  resolved: {
    label: "Resolved",
    color: "bg-emerald-500/20 text-emerald-400",
    order: 3,
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-500/20 text-rose-400",
    order: 4,
  },
};

const priorityConfig = {
  high: { label: "High", color: "text-rose-400", bg: "bg-rose-500/20" },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/20" },
  low: { label: "Low", color: "text-emerald-400", bg: "bg-emerald-500/20" },
};

export function IssueManagement({ viewMode = "table" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOfficialAdmin = !!user?.isOfficialAdmin;

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [view, setView] = useState(viewMode); // kanban | table
  const [teamMembers, setTeamMembers] = useState([]);
  const [updating, setUpdating] = useState(false);

  // Fetch issues on component mount
  useEffect(() => {
    loadIssues();
    if (isOfficialAdmin) {
      loadTeamMembers();
    } else {
      setTeamMembers([]);
    }
  }, [isOfficialAdmin]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Admin: global recent issues; Regular official: assigned issues only
      const response = isOfficialAdmin
        ? await issueService.getIssues()
        : await issueService.getAssignedIssues();
      const issuesData = response.data?.issues || response.issues || [];
      setIssues(issuesData);
    } catch (err) {
      console.error("Error loading issues:", err);
      setError(err.message || "Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      if (!isOfficialAdmin) return;
      // Fetch team members from backend
      const response = await issueService.getTeamMembers();
      setTeamMembers(response.data?.members || []);
    } catch (err) {
      console.error("Error loading team members:", err);
      setTeamMembers([]);
    }
  };

  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.issueId && issue.issueId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedByStatus = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = filteredIssues.filter((issue) => issue.status === status);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-rose-500 mx-auto mb-4" />
          <p className="text-white/60">Loading issues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <p className="text-rose-400 mb-2">Failed to load issues</p>
          <p className="text-white/60 text-sm mb-4">{error}</p>
          <button
            onClick={loadIssues}
            className="px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      setUpdating(true);
      
      // Update issue status via backend
      await issueService.updateIssue(issueId, { status: newStatus });
      
      // Update local state
      setIssues((prev) =>
        prev.map((issue) =>
          issue._id === issueId ? { ...issue, status: newStatus } : issue
        )
      );
      
      console.log(`Issue ${issueId} status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update issue status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async (issueId, member) => {
    try {
      setUpdating(true);
      
      // Assign issue via backend - use userId (User's ID) not _id (TeamMember's ID)
      await issueService.assignIssue(issueId, member.userId || member._id);
      
      // Update local state
      setIssues((prev) =>
        prev.map((issue) =>
          issue._id === issueId
            ? { ...issue, assignedTo: member, status: "in-progress" }
            : issue
        )
      );
      setShowAssignModal(false);
      setSelectedIssue(null);
      
      console.log(`Issue ${issueId} assigned to ${member.username}`);
    } catch (err) {
      console.error("Error assigning issue:", err);
      alert("Failed to assign issue. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    
    try {
      setUpdating(true);
      
      // Delete issue via backend
      await issueService.deleteIssue(issueId);
      
      setIssues((prev) => prev.filter((issue) => issue._id !== issueId));
      console.log(`Issue ${issueId} deleted successfully`);
    } catch (err) {
      console.error("Error deleting issue:", err);
      alert("Failed to delete issue. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Issue Management</h2>
          <p className="text-sm text-white/60">{issues.length} total issues</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-48 rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-rose-500/50"
            />
          </div>
          {isOfficialAdmin && (
            <div className="flex overflow-hidden rounded-lg border border-white/10">
              <button
                onClick={() => setView("kanban")}
                className={cn(
                  "px-3 py-2 text-sm transition-colors",
                  view === "kanban"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white"
                )}
              >
                Kanban
              </button>
              <button
                onClick={() => setView("table")}
                className={cn(
                  "px-3 py-2 text-sm transition-colors",
                  view === "table"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white"
                )}
              >
                Table
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Non-admin officials: Assigned issues cards only */}
      {!isOfficialAdmin && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIssues.map((issue) => (
              <div
                key={issue._id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-rose-500/30 hover:bg-white/10"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/10 to-violet-500/10 opacity-60" />
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-br from-rose-500/10 via-transparent to-violet-500/10" />

                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusConfig[issue.status]?.color)}>
                        {statusConfig[issue.status]?.label}
                      </span>
                    </div>
                    <h4 className="truncate text-lg font-semibold text-white">{issue.title}</h4>
                    <p className="mt-1 text-xs text-white/40">{issue._id}</p>
                  </div>

                  <span className={cn("rounded-full px-2 py-0.5 text-xs", priorityConfig[issue.priority]?.bg, priorityConfig[issue.priority]?.color)}>
                    {priorityConfig[issue.priority]?.label || issue.priority}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-white/40" />
                    <span className="truncate">{issue.location?.address || "Unknown location"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-white/40" />
                    <span>{formatDate(issue.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Issue ID</span>
                    <span className="text-sm font-semibold text-white">{issue.issueId}</span>
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => navigate(`/dashboard/official/issue/${issue._id}`)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-rose-500/20"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              </div>
            ))}
          </div>

          {filteredIssues.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-white/30" />
              <h3 className="mb-2 text-lg font-semibold text-white">No assigned issues</h3>
              <p className="text-sm text-white/60">{searchQuery ? "Try a different search." : "You don't have any assigned issues yet."}</p>
            </div>
          )}
        </>
      )}

      {/* Kanban View */}
      {isOfficialAdmin && view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div
              key={status}
              className="flex w-72 flex-shrink-0 flex-col rounded-xl border border-white/10 bg-white/5"
            >
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-medium",
                      config.color
                    )}
                  >
                    {config.label}
                  </span>
                  <span className="text-sm text-white/40">
                    {groupedByStatus[status]?.length || 0}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-3 p-3">
                {groupedByStatus[status]?.map((issue) => (
                  <div
                    key={issue._id}
                    className="group rounded-lg border border-white/10 bg-black/30 p-4 transition-all hover:border-rose-500/30"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span className="text-xs text-white/40">{issue.issueId}</span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs",
                          priorityConfig[issue.priority]?.bg,
                          priorityConfig[issue.priority]?.color
                        )}
                      >
                        {issue.priority}
                      </span>
                    </div>
                    <h4 className="mb-2 text-sm font-medium text-white line-clamp-2">
                      {issue.title}
                    </h4>
                    <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{issue.location?.address || 'Unknown location'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {issue.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-xs font-medium text-white">
                            {issue.assignedTo.username?.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs text-white/60">
                            {issue.assignedTo.username}
                          </span>
                        </div>
                      ) : (
                        isOfficialAdmin ? (
                          <button
                            onClick={() => {
                              setSelectedIssue(issue);
                              setShowAssignModal(true);
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300"
                            disabled={updating}
                          >
                            Assign
                          </button>
                        ) : (
                          <span className="text-xs text-white/30">Unassigned</span>
                        )
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleStatusChange(
                              issue._id,
                              status === "reported"
                                ? "acknowledged"
                                : status === "acknowledged"
                                ? "in-progress"
                                : status === "in-progress"
                                ? "resolved"
                                : status
                            )
                          }
                          className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
                          disabled={updating || status === "resolved"}
                          title="Move to next stage"
                        >
                          {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {groupedByStatus[status]?.length === 0 && (
                  <div className="py-8 text-center text-sm text-white/20">
                    No issues
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {isOfficialAdmin && view === "table" && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60">
                  Assignee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue) => (
                <tr
                  key={issue._id}
                  className="border-b border-white/5 transition-colors hover:bg-white/5"
                >
                  <td className="px-4 py-3 text-sm text-white/60">
                    {issue.issueId}
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    <span className="text-sm text-white line-clamp-1">
                      {issue.title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded px-2 py-1 text-xs",
                        priorityConfig[issue.priority]?.bg,
                        priorityConfig[issue.priority]?.color
                      )}
                    >
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={issue.status}
                      onChange={(e) =>
                        handleStatusChange(issue._id, e.target.value)
                      }
                      disabled={updating}
                      className={cn(
                        "rounded border-none bg-transparent px-2 py-1 text-xs outline-none cursor-pointer",
                        statusConfig[issue.status]?.color
                      )}
                    >
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <option key={key} value={key} className="bg-black">
                          {val.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {issue.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-xs text-white">
                          {issue.assignedTo.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs text-white/60">
                          {issue.assignedTo.username}
                        </span>
                      </div>
                    ) : (
                      isOfficialAdmin ? (
                        <button
                          onClick={() => {
                            setSelectedIssue(issue);
                            setShowAssignModal(true);
                          }}
                          disabled={updating}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          Assign
                        </button>
                      ) : (
                        <span className="text-xs text-white/30">Unassigned</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/40">
                    {issue.location?.address || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/40">
                    {formatDate(issue.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => handleDeleteIssue(issue._id)}
                      disabled={updating}
                      className="rounded p-1 text-white/40 hover:bg-rose-500/20 hover:text-rose-400"
                      title="Delete issue"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Assign Issue
            </h3>
            <p className="mb-4 text-sm text-white/60">
              Assign <span className="text-white">{selectedIssue.issueId}</span> to a
              team member
            </p>
            <div className="space-y-2">
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <button
                    key={member._id}
                    onClick={() => handleAssign(selectedIssue._id, member)}
                    disabled={updating}
                    className="flex w-full items-center gap-3 rounded-lg border border-white/10 p-3 text-left transition-colors hover:border-rose-500/30 hover:bg-white/5 disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 font-medium text-white">
                      {member.username?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {member.username}
                      </p>
                      <p className="text-xs text-white/60">{member.role || 'Team Member'}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-white/60 py-4">No team members available</p>
              )}
            </div>
            <button
              onClick={() => {
                setShowAssignModal(false);
                setSelectedIssue(null);
              }}
              className="mt-4 w-full rounded-lg border border-white/10 py-2 text-sm text-white/60 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default IssueManagement;
