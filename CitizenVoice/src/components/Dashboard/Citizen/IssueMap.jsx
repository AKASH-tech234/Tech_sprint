// src/components/Dashboard/Citizen/IssueMap.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { issueService } from "../../../services/issueService";
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
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Moon,
  Sun,
} from "lucide-react";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons based on status
const createCustomIcon = (status) => {
  const colors = {
    reported: "#eab308", // yellow
    acknowledged: "#3b82f6", // blue
    "in-progress": "#8b5cf6", // violet
    resolved: "#10b981", // green
    rejected: "#ef4444", // red
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
function HeatmapLayer({ points, intensity = 0.5 }) {
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

    // Create heatmap layer
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 25,
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
  }, [map, points, intensity]);

  return null;
}

// User Location Marker
function UserLocationMarker({ position }) {
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
        radius={500}
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
function MapControls({ onZoomIn, onZoomOut, onRecenter, onFullscreen }) {
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
        onClick={onFullscreen}
        className="rounded-lg bg-white p-2 shadow-lg transition-all hover:bg-gray-100"
        title="Fullscreen"
      >
        <Maximize2 className="h-5 w-5 text-gray-700" />
      </button>
    </div>
  );
}

export function IssueMap() {
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
  const mapRef = useRef(null);

  // Get user's current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to a default location (e.g., New York City)
          setUserLocation([40.7128, -74.006]);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      // Fallback location
      setUserLocation([40.7128, -74.006]);
      setLoading(false);
    }
  }, []);

  // Load issues from API
  useEffect(() => {
    const loadIssues = async () => {
      try {
        // Fetch issues from backend API
        const response = await issueService.getIssues();
        const apiIssues = response.data?.issues || response.issues || [];
        
        // Filter issues that have valid location data
        const issuesWithLocation = apiIssues.filter(
          (issue) => issue.location && issue.location.lat && issue.location.lng
        );
        
        setIssues(issuesWithLocation);
      } catch (err) {
        console.error('Error loading issues for map:', err);
        // Fallback to empty array on error
        setIssues([]);
      }
    };
    
    loadIssues();
    
    // Listen for new issue creation to refresh
    const handleIssueCreated = () => loadIssues();
    window.addEventListener('issueCreated', handleIssueCreated);
    
    return () => window.removeEventListener('issueCreated', handleIssueCreated);
  }, []);

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
    intensity: issue.status === "reported" ? 1 : issue.status === "in-progress" ? 0.7 : 0.3,
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
    const mapElement = document.getElementById("issue-map-container");
    if (mapElement.requestFullscreen) {
      mapElement.requestFullscreen();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "reported":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "acknowledged":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-violet-500" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-xl bg-white/5">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-rose-500 border-t-transparent mx-auto"></div>
          <p className="text-white/60">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Community Issue Map
          </h1>
          <p className="text-sm text-white/60">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? "s" : ""} in your area
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
            title="Cluster nearby markers"
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
            title="Toggle dark mode tiles"
          >
            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {darkMode ? "Dark" : "Light"}
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-white/60">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/60">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
              >
                <option value="all">All Categories</option>
                <option value="pothole">Potholes</option>
                <option value="streetlight">Street Lights</option>
                <option value="graffiti">Graffiti</option>
                <option value="garbage">Garbage</option>
                <option value="water">Water Issues</option>
                <option value="traffic">Traffic</option>
                <option value="parks">Parks</option>
                <option value="other">Other</option>
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
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        id="issue-map-container"
        className="relative overflow-hidden rounded-xl border border-white/10 shadow-2xl"
        style={{ height: "600px" }}
      >
        {userLocation && (
          <MapContainer
            center={userLocation}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            {/* Tile Layer - Light or Dark Mode */}
            {darkMode ? (
              <TileLayer
                attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                maxZoom={20}
              />
            ) : (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}

            {/* User Location */}
            <UserLocationMarker position={userLocation} />

            {/* Heatmap Layer */}
            {showHeatmap && <HeatmapLayer points={heatmapPoints} />}

            {/* Issue Markers with Clustering */}
            {showMarkers && (
              showClustering ? (
                <MarkerClusterGroup
                  chunkedLoading
                  maxClusterRadius={50}
                  spiderfyOnMaxZoom={true}
                  showCoverageOnHover={false}
                  zoomToBoundsOnClick={true}
                  iconCreateFunction={(cluster) => {
                    const count = cluster.getChildCount();
                    let size = 'small';
                    let color = 'bg-rose-500';
                    
                    if (count > 10) {
                      size = 'large';
                      color = 'bg-red-600';
                    } else if (count > 5) {
                      size = 'medium';
                      color = 'bg-rose-500';
                    }
                    
                    const sizeClass = size === 'large' ? 'w-14 h-14 text-lg' : size === 'medium' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
                    
                    return L.divIcon({
                      html: `<div class="flex items-center justify-center ${sizeClass} ${color} text-white rounded-full border-4 border-white shadow-lg font-bold">${count}</div>`,
                      className: 'custom-cluster-icon',
                      iconSize: L.point(40, 40, true),
                    });
                  }}
                >
                  {filteredIssues.map((issue) => (
                    <Marker
                      key={issue.id}
                      position={[issue.location.lat, issue.location.lng]}
                      icon={createCustomIcon(issue.status)}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <div className="flex items-start gap-2 mb-2">
                            {getStatusIcon(issue.status)}
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">{issue.title}</h3>
                              <p className="text-xs text-gray-600 capitalize">
                                {issue.category}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
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
                            <button className="text-xs text-blue-600 hover:underline">
                              View Details
                            </button>
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
                    icon={createCustomIcon(issue.status)}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="flex items-start gap-2 mb-2">
                          {getStatusIcon(issue.status)}
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{issue.title}</h3>
                            <p className="text-xs text-gray-600 capitalize">
                              {issue.category}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
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
                          <button className="text-xs text-blue-600 hover:underline">
                            View Details
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))
              )
            )}

            {/* Map Controls */}
            <MapControls
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onRecenter={handleRecenter}
              onFullscreen={handleFullscreen}
            />
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white p-4 shadow-lg">
          <h4 className="mb-2 text-sm font-semibold text-gray-800">Legend</h4>
          <div className="space-y-2">
            {[
              { status: "reported", label: "Reported", color: "#eab308" },
              { status: "acknowledged", label: "Acknowledged", color: "#3b82f6" },
              { status: "in-progress", label: "In Progress", color: "#8b5cf6" },
              { status: "resolved", label: "Resolved", color: "#10b981" },
              { status: "rejected", label: "Rejected", color: "#ef4444" },
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
