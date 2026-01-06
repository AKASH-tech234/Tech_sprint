// src/components/Dashboard/Community/AreaIssues.jsx
import React, { useState, useEffect } from "react";
import { cn } from "../../../lib/utils";
import { issueService } from "../../../services/issueService";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  ThumbsUp,
  MessageCircle,
  ChevronRight,
  Grid3X3,
  List,
  Map as MapIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";

// Status configuration
const statusConfig = {
  reported: { label: "Reported", color: "bg-gray-500/20 text-gray-400" },
  acknowledged: {
    label: "Acknowledged",
    color: "bg-blue-500/20 text-blue-400",
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-amber-500/20 text-amber-400",
  },
  resolved: { label: "Resolved", color: "bg-emerald-500/20 text-emerald-400" },
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

const neighborhoods = [
  { value: "all", label: "All Neighborhoods" },
  { value: "downtown", label: "Downtown" },
  { value: "northside", label: "Northside" },
  { value: "westend", label: "Westend" },
  { value: "eastside", label: "Eastside" },
  { value: "suburbs", label: "Suburbs" },
];

export function AreaIssues({ onViewIssue }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    neighborhood: "all",
    category: "all",
    status: "all",
  });

  // Fetch issues on mount
  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await issueService.getIssues({ limit: 100 });
      const fetchedIssues = response?.data?.issues || [];
      
      // Transform issues to match expected format
      const transformedIssues = fetchedIssues.map(issue => ({
        ...issue,
        id: issue._id,
        upvotes: issue.upvotes?.length || 0,
        comments: issue.comments?.length || 0,
        verifications: issue.verifiedCount || 0,
        image: issue.images?.[0] || null,
        reporter: issue.reportedBy?.username || "Anonymous",
      }));
      
      setIssues(transformedIssues);
    } catch (err) {
      console.error("Error fetching issues:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNeighborhood =
      filters.neighborhood === "all" ||
      issue.location?.neighborhood?.toLowerCase() === filters.neighborhood;
    const matchesCategory =
      filters.category === "all" || issue.category === filters.category;
    const matchesStatus =
      filters.status === "all" || issue.status === filters.status;

    return (
      matchesSearch && matchesNeighborhood && matchesCategory && matchesStatus
    );
  });

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="ml-2 text-white/60">Loading area issues...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Area Issues</h2>
          <p className="text-sm text-white/60">
            {filteredIssues.length} issues in your area
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchIssues}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
              showFilters
                ? "border-rose-500 bg-rose-500/20 text-rose-400"
                : "border-white/10 bg-white/5 text-white/60"
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            {[
              { mode: "grid", icon: Grid3X3 },
              { mode: "list", icon: List },
              { mode: "map", icon: MapIcon },
            ].map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === mode
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
          <div>
            <label className="mb-1 block text-xs text-white/60">
              Neighborhood
            </label>
            <select
              value={filters.neighborhood}
              onChange={(e) =>
                setFilters({ ...filters, neighborhood: e.target.value })
              }
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {neighborhoods.map((n) => (
                <option key={n.value} value={n.value} className="bg-black">
                  {n.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Category</label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="all" className="bg-black">
                All Categories
              </option>
              {Object.entries(categoryIcons).map(([key, icon]) => (
                <option key={key} value={key} className="bg-black">
                  {icon} {key.charAt(0).toUpperCase() + key.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="all" className="bg-black">
                All Status
              </option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key} className="bg-black">
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Map View Placeholder */}
      {viewMode === "map" && (
        <div className="flex h-[400px] items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <div className="text-center">
            <MapIcon className="mx-auto mb-2 h-16 w-16 text-white/20" />
            <p className="text-lg text-white/40">Interactive Area Map</p>
            <p className="text-sm text-white/20">
              Showing {filteredIssues.length} issues in your area
            </p>
          </div>
        </div>
      )}

      {/* Grid/List View */}
      {viewMode !== "map" && (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          )}
        >
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onViewIssue?.(issue)}
              className={cn(
                "group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-rose-500/30",
                viewMode === "list" && "flex items-center gap-4 p-4"
              )}
            >
              {viewMode === "grid" && issue.image && (
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={issue.image}
                    alt={issue.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span
                    className={cn(
                      "absolute bottom-2 left-2 rounded-full px-2 py-1 text-xs",
                      statusConfig[issue.status]?.color
                    )}
                  >
                    {statusConfig[issue.status]?.label}
                  </span>
                </div>
              )}

              <div className={cn(viewMode === "grid" ? "p-4" : "flex-1")}>
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {categoryIcons[issue.category]}
                    </span>
                    <div>
                      <h4 className="font-medium text-white line-clamp-1">
                        {issue.title}
                      </h4>
                      <p className="text-xs text-white/40">{issue.id}</p>
                    </div>
                  </div>
                  {viewMode === "list" && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs",
                        statusConfig[issue.status]?.color
                      )}
                    >
                      {statusConfig[issue.status]?.label}
                    </span>
                  )}
                </div>

                {viewMode === "grid" && (
                  <p className="mb-3 text-sm text-white/60 line-clamp-2">
                    {issue.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {issue.location.neighborhood}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(issue.updatedAt)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1 text-sm text-white/60">
                      <ThumbsUp className="h-4 w-4" />
                      {issue.upvotes}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-white/60">
                      <MessageCircle className="h-4 w-4" />
                      {issue.comments}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-rose-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredIssues.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-12">
          <div className="mb-4 text-4xl">🔍</div>
          <h3 className="mb-2 text-lg font-medium text-white">
            No issues found
          </h3>
          <p className="text-sm text-white/60">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}

export default AreaIssues;
