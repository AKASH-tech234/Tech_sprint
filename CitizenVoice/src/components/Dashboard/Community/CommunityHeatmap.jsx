// src/components/Dashboard/Community/CommunityHeatmap.jsx
import React, { useState, useEffect } from "react";
import HeatmapViewer from "../Shared/HeatmapViewer";
import { issueService } from "../../../services/issueService";
import { Filter, MapPin, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "../../../lib/utils";

export function CommunityHeatmap() {
  const [filters, setFilters] = useState({
    state: "all",
    district: "",
    category: "all",
    status: "all",
  });
  const [stats, setStats] = useState({
    total: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const indianStates = [
    { value: "all", label: "All States" },
    { value: "Andhra Pradesh", label: "Andhra Pradesh" },
    { value: "Delhi", label: "Delhi" },
    { value: "Karnataka", label: "Karnataka" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Tamil Nadu", label: "Tamil Nadu" },
    { value: "Uttar Pradesh", label: "Uttar Pradesh" },
    { value: "West Bengal", label: "West Bengal" },
  ];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "pothole", label: "Pothole" },
    { value: "streetlight", label: "Street Light" },
    { value: "garbage", label: "Garbage" },
    { value: "water", label: "Water" },
    { value: "traffic", label: "Traffic" },
    { value: "noise", label: "Noise" },
    { value: "safety", label: "Safety" },
    { value: "other", label: "Other" },
  ];

  const statuses = [
    { value: "all", label: "All Status" },
    { value: "reported", label: "Reported" },
    { value: "acknowledged", label: "Acknowledged" },
    { value: "in-progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
  ];

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const params = {
        ...(filters.state !== "all" && { state: filters.state }),
        ...(filters.district && { district: filters.district }),
        ...(filters.category !== "all" && { category: filters.category }),
        ...(filters.status !== "all" && { status: filters.status }),
      };

      const response = await issueService.getAllIssues(params);
      const issues = response?.data?.issues || [];

      setStats({
        total: issues.length,
        highPriority: issues.filter((i) => i.priority === "high").length,
        mediumPriority: issues.filter((i) => i.priority === "medium").length,
        lowPriority: issues.filter((i) => i.priority === "low").length,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Community Heatmap</h2>
        <p className="text-sm text-white/60">
          Visualize issue distribution across districts
        </p>
      </div>

      {/* Stats Cards */}
     

      {/* Filters */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1 text-sm transition-colors",
              showFilters
                ? "bg-rose-500/20 text-rose-400"
                : "bg-white/5 text-white/60"
            )}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide" : "Show"}
          </button>
        </div>

        {showFilters && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-white/60">State</label>
              <select
                value={filters.state}
                onChange={(e) =>
                  setFilters({ ...filters, state: e.target.value, district: "" })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                {indianStates.map((s) => (
                  <option key={s.value} value={s.value} className="bg-black">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">District</label>
              <input
                type="text"
                value={filters.district}
                onChange={(e) =>
                  setFilters({ ...filters, district: e.target.value })
                }
                placeholder="Enter district name"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Category</label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value} className="bg-black">
                    {c.label}
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
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value} className="bg-black">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Issue Distribution Heatmap
        </h3>

        <div className="relative h-[600px] overflow-hidden rounded-lg border border-white/10">
          <HeatmapViewer
            userRole="community"
            defaultCenter={[28.6139, 77.209]}
            defaultZoom={11}
            height="600px"
            filters={filters}
          />
        </div>
      </div>


      {/* Legend */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h4 className="mb-3 text-sm font-semibold text-white">Heatmap Legend</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-white/60">Low Density</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-amber-500"></div>
            <span className="text-sm text-white/60">Medium Density</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-rose-500"></div>
            <span className="text-sm text-white/60">High Density</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunityHeatmap;
