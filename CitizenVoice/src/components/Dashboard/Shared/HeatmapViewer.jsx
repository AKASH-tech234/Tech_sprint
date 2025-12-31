// CitizenVoice/src/components/Dashboard/Shared/HeatmapViewer.jsx
import { useState, useEffect, useMemo, Component } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import {
  MapPin,
  Filter,
  Navigation,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { issueService } from "../../../services/issueService";

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Error Boundary Component
class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[MapErrorBoundary] HeatmapViewer Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-96 bg-white/5 rounded-lg border border-red-500/30">
          <div className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Map Failed to Load
            </h3>
            <p className="text-white/60 mb-4">
              There was an error loading the map component.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom icons for different issue statuses AND roles
const createCustomIcon = (status, role = "citizen") => {
  const colors = {
    reported: "#ef4444",
    acknowledged: "#f59e0b",
    "in-progress": "#3b82f6",
    resolved: "#10b981",
    rejected: "#6b7280",
  };

  // Different shapes/styles for different roles
  const roleStyles = {
    citizen: { borderRadius: "50% 50% 50% 0", borderWidth: "3px", size: 24 },
    official: { borderRadius: "4px 4px 4px 0", borderWidth: "4px", size: 28 },
    community: { borderRadius: "50%", borderWidth: "3px", size: 26 },
  };

  const style = roleStyles[role] || roleStyles.citizen;
  const color = colors[status] || "#6b7280";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: ${style.size}px;
        height: ${style.size}px;
        border-radius: ${style.borderRadius};
        transform: rotate(-45deg);
        border: ${style.borderWidth} solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          margin: auto;
        "></div>
      </div>
    `,
    iconSize: [style.size, style.size],
    iconAnchor: [style.size / 2, style.size],
    popupAnchor: [0, -style.size],
  });
};

// Inline Heatmap Layer Component with error handling
const HeatmapLayer = ({ points, options = {} }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0 || !map) {
      console.log("[HeatmapLayer] No points or map not ready");
      return;
    }

    let heatLayer = null;

    try {
      console.log(
        "[HeatmapLayer] Creating heatmap with",
        points.length,
        "points"
      );

      // Convert points to the format expected by leaflet.heat [lat, lng, intensity]
      const heatPoints = points.map((point) => [
        point.lat,
        point.lng,
        point.intensity || 0.5,
      ]);

      // Default options
      const defaultOptions = {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: {
          0.0: "blue",
          0.5: "lime",
          0.7: "yellow",
          0.85: "orange",
          1.0: "red",
        },
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Check if L.heatLayer is available
      if (typeof L.heatLayer !== "function") {
        console.error(
          "[HeatmapLayer] L.heatLayer is not available. Make sure leaflet.heat is properly imported."
        );
        return;
      }

      // Create and add heatmap layer
      heatLayer = L.heatLayer(heatPoints, mergedOptions);
      heatLayer.addTo(map);
      console.log("[HeatmapLayer] Heatmap layer added successfully");
    } catch (error) {
      console.error("[HeatmapLayer] Error creating heatmap layer:", error);
    }

    // Cleanup function
    return () => {
      if (heatLayer && map) {
        try {
          map.removeLayer(heatLayer);
          console.log("[HeatmapLayer] Heatmap layer removed");
        } catch (e) {
          console.error("[HeatmapLayer] Error removing heatmap layer:", e);
        }
      }
    };
  }, [map, points, options]);

  return null;
};

// Map controller to handle centering and zoom
const MapController = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center && map) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
};

// Generate mock issues for demo/fallback
const generateMockIssues = (role, center) => {
  console.log("[HeatmapViewer] Generating mock issues for role:", role);

  const categories = [
    "pothole",
    "streetlight",
    "garbage",
    "water",
    "traffic",
    "parks",
  ];
  const statuses = ["reported", "acknowledged", "in-progress", "resolved"];
  const priorities = ["low", "medium", "high"];

  const count = role === "citizen" ? 8 : role === "official" ? 20 : 15;

  return Array.from({ length: count }, (_, i) => ({
    _id: `MOCK-${role.toUpperCase()}-${i + 1}`,
    title: `${role === "citizen" ? "My Issue" : "Area Issue"} #${i + 1}: ${
      categories[i % categories.length]
    }`,
    description: `This is a demo ${
      categories[i % categories.length]
    } issue for ${role} view. This helps visualize how the map works.`,
    category: categories[i % categories.length],
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    location: {
      lat: center[0] + (Math.random() - 0.5) * 0.08,
      lng: center[1] + (Math.random() - 0.5) * 0.08,
      address: `Mock Location ${i + 1}, Demo City`,
    },
    createdAt: new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    createdBy: role === "citizen" ? "currentUser" : `user${i}`,
    isOwnIssue: role === "citizen",
  }));
};

const HeatmapViewerContent = ({
  userRole = "citizen",
  defaultCenter = [28.6139, 77.209], // Delhi, India
  defaultZoom = 12,
  height = "600px",
}) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    priority: "all",
  });

  // View options
  const [viewMode, setViewMode] = useState("markers"); // Start with markers to avoid heatmap issues
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);

  // Fetch issues on mount and when filters change
  useEffect(() => {
    fetchIssues();
  }, [userRole]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("[HeatmapViewer] Fetching issues for role:", userRole);

      let fetchedIssues = [];

      try {
        // Try to get issues from API
        let response;
        if (userRole === "citizen") {
          // Citizens see only their own issues
          response = await issueService.getMyIssues(filters);
        } else {
          // Officials and community see all issues
          response = await issueService.getIssues(filters);
        }

        fetchedIssues = response.data?.issues || response.issues || [];
        console.log(
          "[HeatmapViewer] API returned",
          fetchedIssues.length,
          "issues"
        );
      } catch (apiError) {
        console.warn(
          "[HeatmapViewer] API call failed, using mock data:",
          apiError.message
        );
      }

      // If no issues from API, use mock data
      if (fetchedIssues.length === 0) {
        console.log("[HeatmapViewer] No issues from API, generating mock data");
        fetchedIssues = generateMockIssues(userRole, defaultCenter);
        setError("Using demo data - API not available");
      }

      // Add role-specific markers
      fetchedIssues = fetchedIssues.map((issue) => ({
        ...issue,
        displayRole: userRole,
      }));

      setIssues(fetchedIssues);
      console.log("[HeatmapViewer] Set", fetchedIssues.length, "issues");
    } catch (err) {
      console.error("[HeatmapViewer] Error fetching issues:", err);
      setError("Failed to load issues. Using demo data.");
      const mockIssues = generateMockIssues(userRole, defaultCenter);
      setIssues(mockIssues);
    } finally {
      setLoading(false);
    }
  };

  // Get intensity based on priority and status - MUST be defined before useMemo that uses it
  const getPriorityWeight = (priority, status) => {
    let weight = 0.5;

    if (priority === "high") weight = 1.0;
    else if (priority === "medium") weight = 0.6;
    else weight = 0.3;

    if (status === "reported") weight *= 1.2;
    else if (status === "resolved") weight *= 0.5;

    return Math.min(weight, 1.0);
  };

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    const data = issues
      .filter((issue) => issue.location?.lat && issue.location?.lng)
      .map((issue) => ({
        lat: issue.location.lat,
        lng: issue.location.lng,
        intensity: getPriorityWeight(issue.priority, issue.status),
      }));
    console.log("[HeatmapViewer] Heatmap data points:", data.length);
    return data;
  }, [issues]);

  // Filter controls
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  // Locate user
  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(14);
          console.log("[HeatmapViewer] Located user at:", latitude, longitude);
        },
        (error) => {
          console.error("[HeatmapViewer] Error getting location:", error);
          alert("Unable to retrieve your location");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  // Stats by status
  const stats = useMemo(() => {
    const statuses = ["reported", "acknowledged", "in-progress", "resolved"];
    return statuses.map((status) => ({
      status,
      count: issues.filter((i) => i.status === status).length,
    }));
  }, [issues]);

  // Apply filters to displayed issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filters.status !== "all" && issue.status !== filters.status)
        return false;
      if (filters.category !== "all" && issue.category !== filters.category)
        return false;
      if (filters.priority !== "all" && issue.priority !== filters.priority)
        return false;
      return true;
    });
  }, [issues, filters]);

  // Role-specific title
  const getRoleTitle = () => {
    switch (userRole) {
      case "citizen":
        return "My Issues Map";
      case "official":
        return "Jurisdiction Issues Map";
      case "community":
        return "Community Issues Map";
      default:
        return "Issues Map";
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-white/5 rounded-lg shadow border border-white/10"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
          <p className="mt-4 text-white/60">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg shadow-lg overflow-hidden border border-white/10">
      {/* Header with title and controls */}
      <div className="bg-gradient-to-r from-rose-600 to-violet-600 text-white p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              {getRoleTitle()}
            </h2>
            <p className="text-rose-100 text-sm mt-1">
              {filteredIssues.length} issues displayed •
              {userRole === "citizen"
                ? " Your reported issues"
                : userRole === "official"
                ? " All jurisdiction issues"
                : " Community area issues"}
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("heatmap")}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === "heatmap"
                  ? "bg-white text-rose-600 shadow-md"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setViewMode("markers")}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === "markers"
                  ? "bg-white text-rose-600 shadow-md"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              Markers
            </button>
            <button
              onClick={() => setViewMode("clusters")}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === "clusters"
                  ? "bg-white text-rose-600 shadow-md"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              Clusters
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="p-4 bg-black/20 border-b border-white/10">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4">
            {stats.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    status === "reported"
                      ? "bg-red-500"
                      : status === "acknowledged"
                      ? "bg-yellow-500"
                      : status === "in-progress"
                      ? "bg-blue-500"
                      : "bg-green-500"
                  }`}
                ></div>
                <span className="text-sm text-white/80 capitalize">
                  {status}: {count}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                showFilters
                  ? "bg-rose-500 text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={locateUser}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all"
            >
              <Navigation className="w-4 h-4" />
              Locate Me
            </button>
            <button
              onClick={fetchIssues}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
              >
                <option value="all" className="bg-gray-800">
                  All Statuses
                </option>
                <option value="reported" className="bg-gray-800">
                  Reported
                </option>
                <option value="acknowledged" className="bg-gray-800">
                  Acknowledged
                </option>
                <option value="in-progress" className="bg-gray-800">
                  In Progress
                </option>
                <option value="resolved" className="bg-gray-800">
                  Resolved
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
              >
                <option value="all" className="bg-gray-800">
                  All Categories
                </option>
                <option value="pothole" className="bg-gray-800">
                  Pothole
                </option>
                <option value="streetlight" className="bg-gray-800">
                  Street Light
                </option>
                <option value="garbage" className="bg-gray-800">
                  Garbage
                </option>
                <option value="water" className="bg-gray-800">
                  Water
                </option>
                <option value="traffic" className="bg-gray-800">
                  Traffic
                </option>
                <option value="parks" className="bg-gray-800">
                  Parks
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
              >
                <option value="all" className="bg-gray-800">
                  All Priorities
                </option>
                <option value="high" className="bg-gray-800">
                  High
                </option>
                <option value="medium" className="bg-gray-800">
                  Medium
                </option>
                <option value="low" className="bg-gray-800">
                  Low
                </option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error/Warning Banner */}
      {error && (
        <div className="p-3 bg-yellow-500/20 border-b border-yellow-500/30 text-yellow-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Map Container */}
      <div style={{ height, position: "relative" }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <MapController center={mapCenter} zoom={mapZoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Heatmap Layer */}
          {viewMode === "heatmap" && heatmapData.length > 0 && (
            <HeatmapLayer
              points={heatmapData}
              options={{
                radius: 25,
                blur: 15,
                max: 1.0,
                gradient: {
                  0.0: "blue",
                  0.5: "lime",
                  0.7: "yellow",
                  0.85: "orange",
                  1.0: "red",
                },
              }}
            />
          )}

          {/* Regular Markers */}
          {viewMode === "markers" &&
            filteredIssues
              .filter((issue) => issue.location?.lat && issue.location?.lng)
              .map((issue) => (
                <Marker
                  key={issue._id}
                  position={[issue.location.lat, issue.location.lng]}
                  icon={createCustomIcon(issue.status, userRole)}
                  eventHandlers={{
                    click: () => setSelectedIssue(issue),
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[220px]">
                      <h3 className="font-bold text-lg mb-2">{issue.title}</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          {issue.description?.substring(0, 100)}...
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              issue.status === "reported"
                                ? "bg-red-100 text-red-700"
                                : issue.status === "acknowledged"
                                ? "bg-yellow-100 text-yellow-700"
                                : issue.status === "in-progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {issue.status}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                            {issue.category}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              issue.priority === "high"
                                ? "bg-red-100 text-red-700"
                                : issue.priority === "medium"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {issue.priority} priority
                          </span>
                        </div>
                        {issue.location?.address && (
                          <p className="text-xs text-gray-500 mt-2">
                            📍 {issue.location.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

          {/* Clustered Markers */}
          {viewMode === "clusters" && (
            <MarkerClusterGroup chunkedLoading>
              {filteredIssues
                .filter((issue) => issue.location?.lat && issue.location?.lng)
                .map((issue) => (
                  <Marker
                    key={issue._id}
                    position={[issue.location.lat, issue.location.lng]}
                    icon={createCustomIcon(issue.status, userRole)}
                    eventHandlers={{
                      click: () => setSelectedIssue(issue),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-lg mb-2">
                          {issue.title}
                        </h3>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600">
                            {issue.description?.substring(0, 100)}...
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                issue.status === "reported"
                                  ? "bg-red-100 text-red-700"
                                  : issue.status === "acknowledged"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : issue.status === "in-progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {issue.status}
                            </span>
                            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                              {issue.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MarkerClusterGroup>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="bg-black/20 p-4 border-t border-white/10">
        <h3 className="text-sm font-semibold text-white/80 mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-white/60">Reported</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-white/60">Acknowledged</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-white/60">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-white/60">Resolved</span>
          </div>
          <div className="border-l border-white/20 pl-4 ml-2">
            <span className="text-white/40">
              {userRole === "citizen"
                ? "⬤ Circle markers = Your Issues"
                : userRole === "official"
                ? "▪ Square markers = All Jurisdiction Issues"
                : "◆ Round markers = Community Issues"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main export with Error Boundary
const HeatmapViewer = (props) => {
  return (
    <MapErrorBoundary>
      <HeatmapViewerContent {...props} />
    </MapErrorBoundary>
  );
};

export default HeatmapViewer;
