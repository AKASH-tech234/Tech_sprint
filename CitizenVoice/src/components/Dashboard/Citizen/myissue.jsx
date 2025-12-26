// src/components/Dashboard/Citizen/MyIssues.jsx
import React, { useState, useEffect, useCallback } from "react";
import { cn } from "../../../lib/utils";
import { IssueCard } from "./issuecard";
// import { issueService } from "../../../services/issueService"; // Uncomment when backend is ready
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "reported", label: "Reported" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const categoryFilters = [
  { value: "all", label: "All Categories" },
  { value: "pothole", label: "Pothole" },
  { value: "streetlight", label: "Street Light" },
  { value: "garbage", label: "Garbage" },
  { value: "water", label: "Water/Drainage" },
  { value: "traffic", label: "Traffic" },
  { value: "noise", label: "Noise" },
  { value: "safety", label: "Safety" },
  { value: "other", label: "Other" },
];

// Mock data for development - will be replaced with API calls
const mockIssues = [
  {
    id: "ISS-001",
    title: "Large pothole on Main Street",
    description:
      "There's a dangerous pothole near the intersection that has been there for weeks. Multiple cars have been damaged.",
    category: "pothole",
    priority: "high",
    status: "in-progress",
    location: { address: "123 Main Street, Downtown" },
    upvotes: 24,
    comments: [{ id: 1 }, { id: 2 }],
    createdAt: "2024-12-20T10:30:00Z",
    updatedAt: "2024-12-24T15:45:00Z",
    images: [
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400",
    ],
  },
  {
    id: "ISS-002",
    title: "Broken street light",
    description:
      "The street light at the corner has been flickering for days and now it's completely out.",
    category: "streetlight",
    priority: "medium",
    status: "acknowledged",
    location: { address: "45 Oak Avenue" },
    upvotes: 12,
    comments: [{ id: 1 }],
    createdAt: "2024-12-22T08:00:00Z",
    updatedAt: "2024-12-23T09:15:00Z",
    images: [],
  },
  {
    id: "ISS-003",
    title: "Garbage overflow at park",
    description:
      "The garbage bins at Central Park have been overflowing for the past 3 days.",
    category: "garbage",
    priority: "medium",
    status: "reported",
    location: { address: "Central Park, North Entrance" },
    upvotes: 8,
    comments: [],
    createdAt: "2024-12-24T14:00:00Z",
    updatedAt: "2024-12-24T14:00:00Z",
    images: [
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400",
    ],
  },
  {
    id: "ISS-004",
    title: "Water leak on sidewalk",
    description:
      "There's water continuously leaking from somewhere under the sidewalk, creating a slippery hazard.",
    category: "water",
    priority: "high",
    status: "resolved",
    location: { address: "78 Pine Street" },
    upvotes: 15,
    comments: [{ id: 1 }, { id: 2 }, { id: 3 }],
    createdAt: "2024-12-18T11:30:00Z",
    updatedAt: "2024-12-25T10:00:00Z",
    images: [],
  },
];

export function MyIssues({ onViewIssue }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const filters = {};
      // if (statusFilter !== "all") filters.status = statusFilter;
      // if (categoryFilter !== "all") filters.category = categoryFilter;
      // const data = await issueService.getMyIssues(filters);
      // setIssues(data.issues);

      // Using mock data for now
      await new Promise((resolve) => setTimeout(resolve, 500));
      let filtered = [...mockIssues];
      if (statusFilter !== "all") {
        filtered = filtered.filter((i) => i.status === statusFilter);
      }
      if (categoryFilter !== "all") {
        filtered = filtered.filter((i) => i.category === categoryFilter);
      }
      setIssues(filtered);
    } catch (err) {
      setError(err.message || "Failed to fetch issues");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleUpvote = async (issueId) => {
    try {
      // TODO: Call API
      // await issueService.upvoteIssue(issueId);
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? { ...issue, upvotes: issue.upvotes + 1 }
            : issue
        )
      );
    } catch (err) {
      console.error("Failed to upvote:", err);
    }
  };

  const filteredIssues = issues.filter((issue) =>
    searchQuery
      ? issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Issues</h2>
          <p className="text-sm text-white/60">
            {filteredIssues.length} issue
            {filteredIssues.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
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

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
              showFilters
                ? "border-rose-500 bg-rose-500/20 text-rose-400"
                : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          {/* View mode toggles */}
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white"
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchIssues}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Status</label>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    statusFilter === filter.value
                      ? "bg-rose-500/20 text-rose-400"
                      : "bg-white/10 text-white/60 hover:text-white"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white outline-none focus:border-rose-500/50"
            >
              {categoryFilters.map((filter) => (
                <option
                  key={filter.value}
                  value={filter.value}
                  className="bg-black"
                >
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 py-12">
          <AlertTriangle className="mb-2 h-8 w-8 text-rose-400" />
          <p className="text-rose-400">{error}</p>
          <button
            onClick={fetchIssues}
            className="mt-4 rounded-lg bg-rose-500/20 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/30"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredIssues.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 py-12">
          <div className="mb-4 text-4xl">📋</div>
          <h3 className="mb-2 text-lg font-medium text-white">
            No issues found
          </h3>
          <p className="text-sm text-white/60">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your filters"
              : "You haven't reported any issues yet"}
          </p>
        </div>
      )}

      {/* Issues grid/list */}
      {!loading && !error && filteredIssues.length > 0 && (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          )}
        >
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              variant={viewMode === "list" ? "compact" : "default"}
              onView={onViewIssue}
              onUpvote={handleUpvote}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyIssues;
