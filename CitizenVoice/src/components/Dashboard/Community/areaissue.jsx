// src/components/Dashboard/Community/AreaIssues.jsx
import React, { useState } from "react";
import { cn } from "../../../lib/utils";
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

// Mock area issues
const mockAreaIssues = [
  {
    id: "ISS-101",
    title: "Multiple potholes on Highway 7",
    description:
      "There are at least 5 potholes in a 100m stretch causing traffic slowdowns.",
    category: "pothole",
    priority: "high",
    status: "in-progress",
    location: { address: "Highway 7, near exit 23", neighborhood: "Northside" },
    upvotes: 67,
    comments: 12,
    createdAt: "2024-12-15T10:30:00Z",
    updatedAt: "2024-12-24T15:45:00Z",
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400",
    reporter: "Anonymous",
    verifications: 5,
  },
  {
    id: "ISS-102",
    title: "Street lights out in residential area",
    description:
      "Entire block has been dark for a week. Safety concerns for residents.",
    category: "streetlight",
    priority: "high",
    status: "acknowledged",
    location: { address: "Maple Street Block 5-8", neighborhood: "Westend" },
    upvotes: 45,
    comments: 8,
    createdAt: "2024-12-18T20:00:00Z",
    updatedAt: "2024-12-22T09:15:00Z",
    image: null,
    reporter: "Community Watch",
    verifications: 3,
  },
  {
    id: "ISS-103",
    title: "Illegal dumping at park entrance",
    description:
      "Construction debris has been dumped near Central Park main entrance.",
    category: "garbage",
    priority: "medium",
    status: "reported",
    location: {
      address: "Central Park, Main Entrance",
      neighborhood: "Downtown",
    },
    upvotes: 34,
    comments: 5,
    createdAt: "2024-12-23T14:00:00Z",
    updatedAt: "2024-12-23T14:00:00Z",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400",
    reporter: "Jane D.",
    verifications: 0,
  },
  {
    id: "ISS-104",
    title: "Drainage overflow after rain",
    description:
      "Storm drain near school overflows causing flooding on sidewalks.",
    category: "water",
    priority: "high",
    status: "resolved",
    location: {
      address: "Lincoln Elementary School",
      neighborhood: "Eastside",
    },
    upvotes: 89,
    comments: 23,
    createdAt: "2024-12-10T08:30:00Z",
    updatedAt: "2024-12-20T16:00:00Z",
    image: null,
    reporter: "School Admin",
    verifications: 12,
  },
  {
    id: "ISS-105",
    title: "Broken traffic signal",
    description:
      "Traffic light stuck on red for northbound traffic causing major delays.",
    category: "traffic",
    priority: "high",
    status: "in-progress",
    location: { address: "Oak & Main Intersection", neighborhood: "Downtown" },
    upvotes: 156,
    comments: 31,
    createdAt: "2024-12-24T07:00:00Z",
    updatedAt: "2024-12-25T10:00:00Z",
    image: null,
    reporter: "Multiple",
    verifications: 8,
  },
];

const neighborhoods = [
  { value: "all", label: "All Neighborhoods" },
  { value: "downtown", label: "Downtown" },
  { value: "northside", label: "Northside" },
  { value: "westend", label: "Westend" },
  { value: "eastside", label: "Eastside" },
  { value: "suburbs", label: "Suburbs" },
];

export function AreaIssues({ onViewIssue }) {
  const [issues] = useState(mockAreaIssues);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    neighborhood: "all",
    category: "all",
    status: "all",
  });

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNeighborhood =
      filters.neighborhood === "all" ||
      issue.location.neighborhood.toLowerCase() === filters.neighborhood;
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
