// src/components/Dashboard/Shared/DistrictSetup.jsx
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import indiaStatesDistricts from "../../../data/indianDistricts.json";

export function DistrictSetup({ onDistrictSet, userRole }) {
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get states list
  const states = Object.keys(indiaStatesDistricts).sort();

  // Get districts for selected state
  const districts = selectedState ? indiaStatesDistricts[selectedState] : [];

  // Reset district when state changes
  useEffect(() => {
    setSelectedDistrict("");
  }, [selectedState]);

  // Handle geolocation
  const handleGeolocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setGeoLoading(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      // Use reverse geocoding to get state and district
      // Using Nominatim OpenStreetMap API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch location data");
      }

      const data = await response.json();
      console.log("📍 [DistrictSetup] Geocoding result:", data);

      const address = data.address;
      const detectedState = address.state;
      const detectedDistrict =
        address.state_district || address.county || address.city;

      if (detectedState) {
        // Find matching state in our data
        const matchedState = states.find(
          (s) =>
            s.toLowerCase() === detectedState.toLowerCase() ||
            detectedState.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(detectedState.toLowerCase())
        );

        if (matchedState) {
          setSelectedState(matchedState);

          // Find matching district
          if (detectedDistrict) {
            const stateDistricts = indiaStatesDistricts[matchedState];
            const matchedDistrict = stateDistricts.find(
              (d) =>
                d.toLowerCase() === detectedDistrict.toLowerCase() ||
                detectedDistrict.toLowerCase().includes(d.toLowerCase()) ||
                d.toLowerCase().includes(detectedDistrict.toLowerCase())
            );

            if (matchedDistrict) {
              setSelectedDistrict(matchedDistrict);
            }
          }
        } else {
          setError(
            `State "${detectedState}" not found in database. Please select manually.`
          );
        }
      } else {
        setError("Could not detect your state. Please select manually.");
      }
    } catch (err) {
      console.error("❌ [DistrictSetup] Geolocation error:", err);
      if (err.code === 1) {
        setError(
          "Location permission denied. Please enable location access or select manually."
        );
      } else if (err.code === 2) {
        setError(
          "Unable to determine location. Please try again or select manually."
        );
      } else if (err.code === 3) {
        setError(
          "Location request timed out. Please try again or select manually."
        );
      } else {
        setError("Failed to get location. Please select manually.");
      }
    } finally {
      setGeoLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedState || !selectedDistrict) {
      setError("Please select both state and district");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onDistrictSet({
        state: selectedState,
        district: selectedDistrict,
      });
      setSuccess(true);
    } catch (err) {
      console.error("❌ [DistrictSetup] Submit error:", err);
      setError(err.message || "Failed to set district. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = userRole === "official" ? "Official" : "Community Leader";
  const roleDescription =
    userRole === "official"
      ? "Your jurisdiction will be limited to issues in your assigned district."
      : "You will manage and moderate the community for your district.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <MapPin className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Set Your District</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Welcome, {roleLabel}! {roleDescription}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="p-4 rounded-full bg-green-500/20">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-1">
                  District Set Successfully!
                </h3>
                <p className="text-sm text-zinc-400">
                  You are now assigned to{" "}
                  <span className="text-blue-400">{selectedDistrict}</span>,{" "}
                  <span className="text-blue-400">{selectedState}</span>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Geolocation Button */}
              <button
                type="button"
                onClick={handleGeolocation}
                disabled={geoLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400 hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {geoLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Detecting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    Use My Current Location
                  </>
                )}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-xs text-zinc-500 uppercase">
                  or select manually
                </span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>

              {/* State Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">
                  State / Union Territory
                </label>
                <div className="relative">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* District Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">
                  District
                </label>
                <div className="relative">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={!selectedState}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedState
                        ? "Select District"
                        : "Select a state first"}
                    </option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !selectedState || !selectedDistrict}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Setting District...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm District
                  </>
                )}
              </button>

              {/* Info Note */}
              <p className="text-xs text-center text-zinc-500">
                ⚠️ This setting is permanent and cannot be changed later. Please
                ensure you select the correct district.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default DistrictSetup;
