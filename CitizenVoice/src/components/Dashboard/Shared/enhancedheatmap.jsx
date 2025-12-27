// CitizenVoice/src/components/Dashboard/Shared/EnhancedHeatmap.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import {
  MapPin,
  Layers,
  Filter,
  Search,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  RefreshCw,
  Moon,
  Sun,
  Info,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons based on status
const createCustomIcon = (status, category) => {
  const colors = {
    reported: "#eab308",
    acknowledged: "#3b82f6",
    "in-progress": "#8b5cf6",
    resolved: "#10b981",
    rejected: "#ef4444",
  };

  const color = colors[status] || colors.reported;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Heatmap Layer Component
function HeatmapLayer({ points, intensity = 0.5, radius = 25 }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map || points.length === 0) return;

    // Remove existing heatmap layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Create heatmap data: [lat, lng, intensity]
    const heatData = points.map((point) => [
      point.lat,
      point.lng,
      point.intensity || 1,
    ]);

    // Create heatmap layer with configurable options
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: radius,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: "#0000ff",
        0.2: "#00ffff",
        0.4: "#00ff00",
        0.6: "#ffff00",
        0.8: "#ff9900",
        1.0: "#ff0000",
      },
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points, intensity, radius]);

  return null;
}

// User Location Marker
function UserLocationMarker({ position, radius = 500 }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);

  if (!position) return null;

  const userIcon = L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #f43f5e;
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(244, 63, 94, 0.5), 0 0 20px rgba(244, 63, 94, 0.3);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      </style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <>
      <Marker position={position} icon={userIcon}>
        <Popup>
          <div className="text-center">
            <p className="font-semibold text-sm">Your Location</p>
            <p className="text-xs text-gray-600">
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </p>
          </div>
        </Popup>
      </Marker>
      <Circle
        center={position}
        radius={radius}
        pathOptions={{
          color: "#f43f5e",
          fillColor: "#f43f5e",
          fillOpacity: 0.1,
          weight: 2,
          dashArray: "5, 5",
        }}
      />
    </>
  );
}

// Map Controls Component
function MapControls({
  onZoomIn,
  onZoomOut,
  onRecenter,
  onFullscreen,
  onRefresh,
}) {
  return (
    <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="rounded-lg bg-white p-2 shadow-lg transition-all hover:bg-gray-100"
        title="Zoom In"
      >
        <ZoomIn className="h-5 w-5 text-gray-700" />
      </button>
      <button
        onClick={onZoomOut}
        className="rounded-lg bg-white p-2 shadow-lg transition-all hover:bg-gray-100"
        title="Zoom Out"
      >
        <ZoomOut className="h-5 w-5 text-gray-700" />
      </button>
      <button
        onClick={onRecenter}
        className="rounded-lg bg-white p-2 shadow-lg transition-all hover:bg-gray-100"
        title="Recenter to Your Location"
      >
        <Navigation className="h-5 w-5 text-gray-700" />
      </button>
      <button
        onClick={onRefresh}
        className="rounded-lg bg-white p-2 shadow-lg transition-all hover:bg-gray-100"
        title="Refresh Data"
      >
        <RefreshCw className="h-5 w-5 text-gray-700" />
      </button>
      <button
        onClick={onFullscreen}
        className="rounded-lg bg-white p-2 shadow-lg transition-all hover:bg-gray-100"
        title="Fullscreen"
      >
        <Maximize2 className="h-5 w-5 text-gray-700" />
      </button>
    </div>
  );
}

export function EnhancedHeatmap({
  role = "citizen",
  height = "600px",
  apiEndpoint = "/issues/map",
  showUserLocation = true,
  defaultRadius = 5000,
  customFilters = null,
  onIssueClick = null,
}) {
  const [userLocation, setUserLocation] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showClustering, setShowClustering] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [heatmapRadius, setHeatmapRadius] = useState(25);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Get user's current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          loadIssues(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback location (e.g., India center)
          setUserLocation([20.5937, 78.9629]);
          loadIssues(20.5937, 78.9629);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setUserLocation([20.5937, 78.9629]);
      loadIssues(20.5937, 78.9629);
    }
  }, []);

  // Load issues from API
  const loadIssues = async (lat, lng) => {
    try {
      setLoading(true);
      setError(null);

      /**
       * BACKEND API CALL: Get Map Issues
       * Endpoint: GET /api/issues/map?lat={lat}&lng={lng}&radius={radius}&role={role}
       * Returns: { success: true, issues: [...] }
       */

      const params = new URLSearchParams({
        lat: lat,
        lng: lng,
        radius: defaultRadius,
        role: role,
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (customFilters) {
        Object.keys(customFilters).forEach((key) => {
          params.append(key, customFilters[key]);
        });
      }

      const response = await axios.get(
        `${API_BASE_URL}${apiEndpoint}?${params.toString()}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setIssues(response.data.issues || response.data.data?.issues || []);
      } else {
        setError("Failed to load issues");
      }
    } catch (err) {
      console.error("Error loading issues:", err);
      setError(err.message || "Failed to load map data");

      // Load mock data for development
      loadMockData(lat, lng);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development
  const loadMockData = (lat, lng) => {
    const mockIssues = Array.from({ length: 50 }, (_, i) => ({
      id: `MOCK-${i + 1}`,
      title: `Issue ${i + 1}`,
      category: ["pothole", "streetlight", "garbage", "water"][i % 4],
      status: ["reported", "acknowledged", "in-progress", "resolved"][i % 4],
      location: {
        lat: lat + (Math.random() - 0.5) * 0.1,
        lng: lng + (Math.random() - 0.5) * 0.1,
        address: `Location ${i + 1}`,
      },
      priority: ["low", "medium", "high"][i % 3],
      createdAt: new Date().toISOString(),
    }));
    setIssues(mockIssues);
  };

  // Refresh data
  const handleRefresh = () => {
    if (userLocation) {
      loadIssues(userLocation[0], userLocation[1]);
    }
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;
    if (categoryFilter !== "all" && issue.category !== categoryFilter)
      return false;
    if (
      searchQuery &&
      !issue.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // Prepare heatmap data
  const heatmapPoints = filteredIssues.map((issue) => ({
    lat: issue.location.lat,
    lng: issue.location.lng,
    intensity:
      issue.priority === "high" ? 1 : issue.priority === "medium" ? 0.7 : 0.4,
  }));

  // Map control handlers
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() - 1);
    }
  };

  const handleRecenter = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView(userLocation, 13);
    }
  };

  const handleFullscreen = () => {
    const mapElement = document.getElementById("heatmap-container");
    if (mapElement.requestFullscreen) {
      mapElement.requestFullscreen();
    }
  };

  if (loading && !issues.length) {
    return (
      <div
        className="flex h-full items-center justify-center rounded-xl bg-white/5"
        style={{ height }}
      >
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-rose-500 border-t-transparent mx-auto"></div>
          <p className="text-white/60">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error && !issues.length) {
    return (
      <div
        className="flex h-full items-center justify-center rounded-xl bg-white/5 border border-rose-500/20"
        style={{ height }}
      >
        <div className="text-center p-6">
          <Info className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <p className="text-rose-400 mb-2">Failed to load map</p>
          <p className="text-white/60 text-sm mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {role === "citizen"
              ? "Community Issues Map"
              : role === "official"
              ? "Assigned Issues Map"
              : "Area Issues Map"}
          </h2>
          <p className="text-sm text-white/60">
            {filteredIssues.length} issue
            {filteredIssues.length !== 1 ? "s" : ""} in your area
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              showHeatmap
                ? "bg-gradient-to-r from-rose-500 to-violet-500 text-white"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            <Layers className="h-4 w-4" />
            Heatmap
          </button>
          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              showMarkers
                ? "bg-gradient-to-r from-rose-500 to-violet-500 text-white"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Markers
          </button>
          <button
            onClick={() => setShowClustering(!showClustering)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              showClustering
                ? "bg-gradient-to-r from-rose-500 to-violet-500 text-white"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            <Layers className="h-4 w-4" />
            Cluster
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              darkMode
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {darkMode ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white/60 transition-all hover:bg-white/20"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm text-white/60">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  if (userLocation)
                    loadIssues(userLocation[0], userLocation[1]);
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
              >
                <option value="all">All</option>
                <option value="reported">Reported</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/60">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  if (userLocation)
                    loadIssues(userLocation[0], userLocation[1]);
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
              >
                <option value="all">All</option>
                <option value="pothole">Potholes</option>
                <option value="streetlight">Street Lights</option>
                <option value="garbage">Garbage</option>
                <option value="water">Water</option>
                <option value="traffic">Traffic</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/60">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search issues..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-white outline-none placeholder-white/40"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/60">
                Heatmap Radius
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={heatmapRadius}
                onChange={(e) => setHeatmapRadius(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/40 text-center">
                {heatmapRadius}px
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        id="heatmap-container"
        className="relative overflow-hidden rounded-xl border border-white/10 shadow-2xl"
        style={{ height }}
      >
        {userLocation && (
          <MapContainer
            center={userLocation}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            {/* Tile Layer */}
            {darkMode ? (
              <TileLayer
                attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                maxZoom={20}
              />
            ) : (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}

            {/* User Location */}
            {showUserLocation && (
              <UserLocationMarker
                position={userLocation}
                radius={defaultRadius}
              />
            )}

            {/* Heatmap Layer */}
            {showHeatmap && (
              <HeatmapLayer points={heatmapPoints} radius={heatmapRadius} />
            )}

            {/* Issue Markers */}
            {showMarkers &&
              (showClustering ? (
                <MarkerClusterGroup
                  chunkedLoading
                  maxClusterRadius={50}
                  spiderfyOnMaxZoom={true}
                  showCoverageOnHover={false}
                  zoomToBoundsOnClick={true}
                  iconCreateFunction={(cluster) => {
                    const count = cluster.getChildCount();
                    let size =
                      count > 10 ? "large" : count > 5 ? "medium" : "small";
                    let color =
                      count > 10
                        ? "bg-red-600"
                        : count > 5
                        ? "bg-rose-500"
                        : "bg-rose-400";
                    let sizeClass =
                      size === "large"
                        ? "w-14 h-14 text-lg"
                        : size === "medium"
                        ? "w-12 h-12 text-base"
                        : "w-10 h-10 text-sm";

                    return L.divIcon({
                      html: `<div class="flex items-center justify-center ${sizeClass} ${color} text-white rounded-full border-4 border-white shadow-lg font-bold">${count}</div>`,
                      className: "custom-cluster-icon",
                      iconSize: L.point(40, 40, true),
                    });
                  }}
                >
                  {filteredIssues.map((issue) => (
                    <Marker
                      key={issue.id}
                      position={[issue.location.lat, issue.location.lng]}
                      icon={createCustomIcon(issue.status, issue.category)}
                      eventHandlers={{
                        click: () => {
                          if (onIssueClick) onIssueClick(issue);
                        },
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <h3 className="font-semibold text-sm mb-1">
                            {issue.title}
                          </h3>
                          <p className="text-xs text-gray-600 capitalize mb-2">
                            {issue.category}
                          </p>
                          <div className="flex items-center justify-between">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                issue.status === "reported"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : issue.status === "in-progress"
                                  ? "bg-violet-100 text-violet-700"
                                  : issue.status === "resolved"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {issue.status}
                            </span>
                            {onIssueClick && (
                              <button
                                onClick={() => onIssueClick(issue)}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Details
                              </button>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              ) : (
                filteredIssues.map((issue) => (
                  <Marker
                    key={issue.id}
                    position={[issue.location.lat, issue.location.lng]}
                    icon={createCustomIcon(issue.status, issue.category)}
                    eventHandlers={{
                      click: () => {
                        if (onIssueClick) onIssueClick(issue);
                      },
                    }}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <h3 className="font-semibold text-sm mb-1">
                          {issue.title}
                        </h3>
                        <p className="text-xs text-gray-600 capitalize mb-2">
                          {issue.category}
                        </p>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            issue.status === "reported"
                              ? "bg-yellow-100 text-yellow-700"
                              : issue.status === "in-progress"
                              ? "bg-violet-100 text-violet-700"
                              : issue.status === "resolved"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {issue.status}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))
              ))}

            {/* Map Controls */}
            <MapControls
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onRecenter={handleRecenter}
              onFullscreen={handleFullscreen}
              onRefresh={handleRefresh}
            />
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white p-4 shadow-lg">
          <h4 className="mb-2 text-sm font-semibold text-gray-800">Legend</h4>
          <div className="space-y-2">
            {[
              { status: "reported", label: "Reported", color: "#eab308" },
              {
                status: "acknowledged",
                label: "Acknowledged",
                color: "#3b82f6",
              },
              { status: "in-progress", label: "In Progress", color: "#8b5cf6" },
              { status: "resolved", label: "Resolved", color: "#10b981" },
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedHeatmap;
