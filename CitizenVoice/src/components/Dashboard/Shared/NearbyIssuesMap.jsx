// Nearby Issues Map Widget
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { issueService } from "../../../services/issueService";

// Custom marker icon
const createMarkerIcon = (status) => {
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
        width: 20px;
        height: 20px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

export function NearbyIssuesMap({ role = "citizen", compact = false }) {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyIssues, setNearbyIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          loadNearbyIssues(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserLocation([40.7128, -74.006]); // Fallback
          loadNearbyIssues(40.7128, -74.006);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setUserLocation([40.7128, -74.006]);
      loadNearbyIssues(40.7128, -74.006);
    }
  }, []);

  const loadNearbyIssues = async (lat, lng) => {
    try {
      // Fetch issues from backend API
      const response = await issueService.getIssues();
      const apiIssues = response.data?.issues || response.issues || [];
      
      // Filter issues with valid location and calculate approximate distance
      const issuesWithLocation = apiIssues
        .filter((issue) => issue.location && issue.location.lat && issue.location.lng)
        .map((issue) => {
          // Calculate approximate distance in km
          const dLat = issue.location.lat - lat;
          const dLng = issue.location.lng - lng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // Approximate km
          return { ...issue, distance: `${dist.toFixed(1)} km` };
        })
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      
      setNearbyIssues(issuesWithLocation.slice(0, 10)); // Show max 10
    } catch (err) {
      console.error('Error loading nearby issues:', err);
      setNearbyIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullMap = () => {
    navigate(`/dashboard/${role}/map`);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent mx-auto"></div>
          <p className="text-sm text-white/60">Loading nearby issues...</p>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="flex h-full items-center justify-center text-white/60">
        <p className="text-sm">Unable to load map</p>
      </div>
    );
  }

  const mapHeight = compact ? "300px" : "400px";

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-white/10">
      <MapContainer
        center={userLocation}
        zoom={14}
        style={{ height: mapHeight, width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location */}
        <Marker
          position={userLocation}
          icon={L.divIcon({
            className: "user-location-pulse",
            html: `
              <div style="
                width: 16px;
                height: 16px;
                background: #f43f5e;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(244, 63, 94, 0.6);
              "></div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })}
        >
          <Popup>
            <div className="text-center">
              <p className="text-xs font-semibold">Your Location</p>
            </div>
          </Popup>
        </Marker>

        {/* 2km Radius Circle */}
        <Circle
          center={userLocation}
          radius={2000}
          pathOptions={{
            color: "#f43f5e",
            fillColor: "#f43f5e",
            fillOpacity: 0.05,
            weight: 1,
            dashArray: "5, 5",
          }}
        />

        {/* Nearby Issues */}
        {nearbyIssues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.location.lat, issue.location.lng]}
            icon={createMarkerIcon(issue.status)}
          >
            <Popup>
              <div className="min-w-[150px]">
                <h4 className="text-xs font-semibold">{issue.title}</h4>
                <p className="text-xs text-gray-600 capitalize">{issue.category}</p>
                {issue.distance && (
                  <p className="mt-1 text-xs text-gray-500">{issue.distance} away</p>
                )}
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${
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
        ))}
      </MapContainer>

      {/* Controls Overlay */}
      <div className="absolute right-2 top-2 z-[1000] flex flex-col gap-1">
        <button
          onClick={handleViewFullMap}
          className="rounded-lg bg-white p-2 shadow-lg transition-all hover:bg-gray-100"
          title="View Full Map"
        >
          <Maximize2 className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {/* Issue Count Badge */}
      <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-black/80 px-3 py-1.5 backdrop-blur-sm">
        <p className="text-xs text-white">
          <span className="font-bold text-rose-400">{nearbyIssues.length}</span> issues within 2km
        </p>
      </div>
    </div>
  );
}
