// src/components/Dashboard/Official/IssueManagement.jsx
import React, { useState } from "react";
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
} from "lucide-react";

// Status configuration
const statusConfig = {
  new: { label: "New", color: "bg-gray-500/20 text-gray-400", order: 0 },
  assigned: {
    label: "Assigned",
    color: "bg-blue-500/20 text-blue-400",
    order: 1,
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-amber-500/20 text-amber-400",
    order: 2,
  },
  "under-review": {
    label: "Under Review",
    color: "bg-violet-500/20 text-violet-400",
    order: 3,
  },
  resolved: {
    label: "Resolved",
    color: "bg-emerald-500/20 text-emerald-400",
    order: 4,
  },
};

const priorityConfig = {
  high: { label: "High", color: "text-rose-400", bg: "bg-rose-500/20" },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/20" },
  low: { label: "Low", color: "text-emerald-400", bg: "bg-emerald-500/20" },
};

// Mock data
const mockIssues = [
  {
    id: "ISS-001",
    title: "Large pothole on Main Street",
    category: "pothole",
    priority: "high",
    status: "in-progress",
    assignee: { id: 1, name: "John Doe", avatar: "JD" },
    location: "123 Main Street",
    createdAt: "2024-12-20T10:30:00Z",
    reporter: "Jane Smith",
  },
  {
    id: "ISS-002",
    title: "Broken street light",
    category: "streetlight",
    priority: "medium",
    status: "new",
    assignee: null,
    location: "45 Oak Avenue",
    createdAt: "2024-12-22T08:00:00Z",
    reporter: "Mike Johnson",
  },
  {
    id: "ISS-003",
    title: "Garbage overflow",
    category: "garbage",
    priority: "medium",
    status: "assigned",
    assignee: { id: 2, name: "Sarah Wilson", avatar: "SW" },
    location: "Central Park",
    createdAt: "2024-12-24T14:00:00Z",
    reporter: "Tom Brown",
  },
  {
    id: "ISS-004",
    title: "Water leak on sidewalk",
    category: "water",
    priority: "high",
    status: "under-review",
    assignee: { id: 1, name: "John Doe", avatar: "JD" },
    location: "78 Pine Street",
    createdAt: "2024-12-18T11:30:00Z",
    reporter: "Emily Davis",
  },
  {
    id: "ISS-005",
    title: "Traffic signal malfunction",
    category: "traffic",
    priority: "high",
    status: "new",
    assignee: null,
    location: "Main & 5th Intersection",
    createdAt: "2024-12-25T09:00:00Z",
    reporter: "Chris Lee",
  },
];

const mockTeamMembers = [
  { id: 1, name: "John Doe", avatar: "JD", role: "Field Officer" },
  { id: 2, name: "Sarah Wilson", avatar: "SW", role: "Team Lead" },
  { id: 3, name: "Mike Chen", avatar: "MC", role: "Field Officer" },
];

export function IssueManagement({ viewMode = "kanban" }) {
  const [issues, setIssues] = useState(mockIssues);
  // const [loading, setLoading] = useState(false); // Uncomment when API is ready
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [view, setView] = useState(viewMode); // kanban | table

  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByStatus = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = filteredIssues.filter((issue) => issue.status === status);
    return acc;
  }, {});

  const handleStatusChange = (issueId, newStatus) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      )
    );
  };

  const handleAssign = (issueId, member) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId
          ? { ...issue, assignee: member, status: "assigned" }
          : issue
      )
    );
    setShowAssignModal(false);
    setSelectedIssue(null);
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
        </div>
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
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
                    key={issue.id}
                    className="group rounded-lg border border-white/10 bg-black/30 p-4 transition-all hover:border-rose-500/30"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span className="text-xs text-white/40">{issue.id}</span>
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
                      <span className="truncate">{issue.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {issue.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-xs font-medium text-white">
                            {issue.assignee.avatar}
                          </div>
                          <span className="text-xs text-white/60">
                            {issue.assignee.name}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedIssue(issue);
                            setShowAssignModal(true);
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          Assign
                        </button>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleStatusChange(
                              issue.id,
                              status === "new"
                                ? "assigned"
                                : status === "assigned"
                                ? "in-progress"
                                : status === "in-progress"
                                ? "under-review"
                                : status === "under-review"
                                ? "resolved"
                                : status
                            )
                          }
                          className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
                        >
                          <ArrowUpRight className="h-4 w-4" />
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
      {view === "table" && (
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
                  key={issue.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/5"
                >
                  <td className="px-4 py-3 text-sm text-white/60">
                    {issue.id}
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
                        handleStatusChange(issue.id, e.target.value)
                      }
                      className={cn(
                        "rounded border-none bg-transparent px-2 py-1 text-xs outline-none",
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
                    {issue.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-xs text-white">
                          {issue.assignee.avatar}
                        </div>
                        <span className="text-xs text-white/60">
                          {issue.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedIssue(issue);
                          setShowAssignModal(true);
                        }}
                        className="text-xs text-rose-400"
                      >
                        Assign
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/40">
                    {issue.location}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/40">
                    {formatDate(issue.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white">
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
              Assign <span className="text-white">{selectedIssue.id}</span> to a
              team member
            </p>
            <div className="space-y-2">
              {mockTeamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleAssign(selectedIssue.id, member)}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/10 p-3 text-left transition-colors hover:border-rose-500/30 hover:bg-white/5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 font-medium text-white">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {member.name}
                    </p>
                    <p className="text-xs text-white/60">{member.role}</p>
                  </div>
                </button>
              ))}
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
