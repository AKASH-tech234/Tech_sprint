// src/components/Dashboard/Community/CommunityHeatmap.jsx
import React, { useState, useEffect } from "react";
import HeatmapViewer from "../Shared/HeatmapViewer";
import { districtService, parseDistrictId } from "../../../services/districtService";
import { Filter, MapPin, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "../../../lib/utils";

export function CommunityHeatmap({ districtId }) {
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
  });
  const [stats, setStats] = useState({
    total: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
  });
  const [heatmapData, setHeatmapData] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Parse district info
  const districtInfo = parseDistrictId(districtId);

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
    fetchHeatmapData();
  }, [districtId, filters]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      const response = await districtService.getHeatmapData(districtId, filters);
      const points = response?.points || [];
      
      setHeatmapData(points);
      setStats({
        total: points.length,
        highPriority: points.filter((p) => p.issue?.priority === "high").length,
        mediumPriority: points.filter((p) => p.issue?.priority === "medium").length,
        lowPriority: points.filter((p) => p.issue?.priority === "low").length,
      });
    } catch (error) {
      console.error("Failed to fetch heatmap data:", error);
    } finally {
      setLoading(false);
    }
  };

  // No district selected state
  if (!districtId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Community Heatmap</h2>
          <p className="text-sm text-white/60">
            Visualize issue distribution in your district
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-96 rounded-xl border border-white/10 bg-white/5 p-8">
          <MapPin className="h-12 w-12 text-white/40 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Select a District</h3>
          <p className="text-white/60 text-center">
            Choose a district from the dropdown above to view the issue heatmap.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Community Heatmap</h2>
        <p className="text-sm text-white/60">
          Issue distribution in {districtInfo.district}, {districtInfo.state}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">Total Issues</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">High Priority</p>
          <p className="text-2xl font-bold text-red-400">{stats.highPriority}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">Medium Priority</p>
          <p className="text-2xl font-bold text-amber-400">{stats.mediumPriority}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">Low Priority</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.lowPriority}</p>
        </div>
      </div>

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
          <div className="grid gap-4 sm:grid-cols-2">
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
            filters={{ ...filters, districtId }}
            heatmapData={heatmapData}
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
