// src/components/Dashboard/Community/CommunityHeatmap.jsx
import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import HeatmapLayerComponent from "../../../lib/heatmapLayer";
import {
  districtService,
  parseDistrictId,
} from "../../../services/districtService";
import {
  RefreshCw,
  MapPin,
  Filter,
  Layers,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Navigation,
  Loader2,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icon based on status
const createStatusIcon = (status, priority) => {
  const colors = {
    reported: "#ef4444",
    acknowledged: "#f59e0b",
    "in-progress": "#3b82f6",
    resolved: "#10b981",
  };
  const prioritySize =
    priority === "high" ? 32 : priority === "medium" ? 28 : 24;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${colors[status] || "#6b7280"};
        width: ${prioritySize}px;
        height: ${prioritySize}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      ">
        <div style="
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        ">
          <div style="
            width: ${prioritySize / 3}px;
            height: ${prioritySize / 3}px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      </div>
    `,
    iconSize: [prioritySize, prioritySize],
    iconAnchor: [prioritySize / 2, prioritySize],
    popupAnchor: [0, -prioritySize],
  });
};

// User location marker icon
const createUserLocationIcon = () => {
  return L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
      ">
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          background: #3b82f6;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.4);
        "></div>
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          left: -8px;
          top: -8px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Map controller for centering
const MapController = ({ center, zoom, refreshKey }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map, refreshKey]);

  return null;
};

export function CommunityHeatmap({ districtId }) {
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
  });
  const [stats, setStats] = useState({
    total: 0,
    reported: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [heatmapData, setHeatmapData] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("heatmap");
  const [showMarkers, setShowMarkers] = useState(true);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]);
  const [mapZoom, setMapZoom] = useState(11);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

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

  const fetchHeatmapData = useCallback(async () => {
    if (!districtId) return;

    try {
      setLoading(true);
      const response = await districtService.getHeatmapData(
        districtId,
        filters
      );
      const points = response?.points || [];

      setHeatmapData(points);

      const issuesList = points.map((p) => p.issue).filter(Boolean);
      setStats({
        total: issuesList.length,
        reported: issuesList.filter((i) => i.status === "reported").length,
        inProgress: issuesList.filter(
          (i) => i.status === "in-progress" || i.status === "acknowledged"
        ).length,
        resolved: issuesList.filter((i) => i.status === "resolved").length,
      });

      if (points.length > 0) {
        const lats = points.map((p) => p.lat);
        const lngs = points.map((p) => p.lng);
        const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
        const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
        setMapCenter([centerLat, centerLng]);
      }
    } catch (error) {
      console.error("Failed to fetch heatmap data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [districtId, filters]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    fetchHeatmapData();
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setMapZoom(14);
        setRefreshKey((prev) => prev + 1);
        setLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(
          "Unable to retrieve your location. Please enable location access."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!districtId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Community Heatmap</h2>
          <p className="text-sm text-white/60">
            Visualize issue distribution in your district
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-96 rounded-xl border border-white/10 bg-[#0a0a0a] p-8">
          <MapPin className="h-16 w-16 text-rose-500/50 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Select a District
          </h3>
          <p className="text-white/60 text-center max-w-md">
            Choose a district from the dropdown above to view the issue heatmap.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Community Heatmap</h2>
          <p className="text-sm text-white/60">
            {districtInfo.district}, {districtInfo.state} • {stats.total} issues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={() => setViewMode("heatmap")}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "heatmap"
                  ? "bg-rose-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("markers")}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "markers"
                  ? "bg-rose-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              <MapPin className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors border",
              showMarkers
                ? "border-rose-500/50 bg-rose-500/20 text-rose-400"
                : "border-white/10 bg-white/5 text-white/60"
            )}
          >
            {showMarkers ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-4 w-4", refreshing && "animate-spin")}
            />
            Refresh
          </button>

          <button
            onClick={handleLocateMe}
            disabled={locating}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50",
              userLocation
                ? "border border-blue-500/50 bg-blue-500/20 text-blue-400"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            )}
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            Locate Me
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-white/40" />
            <p className="text-xs text-white/60">Total Issues</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-xs text-red-400/80">Reported</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.reported}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-amber-400/80">In Progress</p>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {stats.inProgress}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-emerald-400/80">Resolved</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {stats.resolved}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Filter className="h-4 w-4 text-rose-500" />
            Filters
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "text-xs font-medium px-3 py-1 rounded-full transition-colors",
              showFilters
                ? "bg-rose-500/20 text-rose-400"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            {showFilters ? "Hide" : "Show"}
          </button>
        </div>

        {showFilters && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/60">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option
                    key={c.value}
                    value={c.value}
                    className="bg-[#0a0a0a]"
                  >
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
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                {statuses.map((s) => (
                  <option
                    key={s.value}
                    value={s.value}
                    className="bg-[#0a0a0a]"
                  >
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl border-2 border-rose-500/30 bg-[#0a0a0a] overflow-hidden shadow-lg shadow-rose-500/5">
        <div className="relative h-[500px]">
          {loading && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent"></div>
                <p className="text-sm text-white/60">Loading map data...</p>
              </div>
            </div>
          )}

          <MapContainer
            key={refreshKey}
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <MapController
              center={mapCenter}
              zoom={mapZoom}
              refreshKey={refreshKey}
            />

            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {viewMode === "heatmap" && heatmapData.length > 0 && (
              <HeatmapLayerComponent
                points={heatmapData.map((p) => ({
                  lat: p.lat,
                  lng: p.lng,
                  intensity:
                    p.issue?.priority === "high"
                      ? 1.0
                      : p.issue?.priority === "medium"
                      ? 0.6
                      : 0.3,
                }))}
                options={{
                  radius: 25,
                  blur: 15,
                  maxZoom: 17,
                  gradient: {
                    0.0: "#10b981",
                    0.3: "#22c55e",
                    0.5: "#f59e0b",
                    0.7: "#f97316",
                    1.0: "#ef4444",
                  },
                }}
              />
            )}

            {showMarkers &&
              heatmapData.map((point, index) => {
                const issue = point.issue;
                if (!issue || !point.lat || !point.lng) return null;

                return (
                  <Marker
                    key={issue._id || index}
                    position={[point.lat, point.lng]}
                    icon={createStatusIcon(issue.status, issue.priority)}
                  >
                    <Popup>
                      <div className="min-w-[200px] p-2">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {issue.title || "Issue"}
                        </h4>
                        <div className="space-y-1 text-xs text-gray-600">
                          <p>
                            <span className="font-medium">Category:</span>{" "}
                            {issue.category}
                          </p>
                          <p>
                            <span className="font-medium">Status:</span>{" "}
                            {issue.status}
                          </p>
                          <p>
                            <span className="font-medium">Priority:</span>{" "}
                            {issue.priority}
                          </p>
                          <p>
                            <span className="font-medium">Reported:</span>{" "}
                            {formatDate(issue.createdAt)}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* User Location Marker */}
            {userLocation && (
              <Marker position={userLocation} icon={createUserLocationIcon()}>
                <Popup>
                  <div className="p-2 text-center">
                    <p className="font-semibold text-blue-600">Your Location</p>
                    <p className="text-xs text-gray-500">
                      {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-white/5 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                <span className="text-white/60">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                <span className="text-white/60">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                <span className="text-white/60">High</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1">
              <MapPin className="h-3 w-3 text-rose-400" />
              <span className="text-xs font-medium text-rose-400">
                {districtInfo.district}, {districtInfo.state}
              </span>
            </div>
          </div>
        </div>
      </div>

      {heatmapData.length === 0 && !loading && (
        <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-8 text-center">
          <AlertCircle className="h-12 w-12 text-white/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">
            No Issues Found
          </h3>
          <p className="text-white/60 text-sm">
            No issues match your current filters in {districtInfo.district}.
          </p>
        </div>
      )}
    </div>
  );
}

export default CommunityHeatmap;
