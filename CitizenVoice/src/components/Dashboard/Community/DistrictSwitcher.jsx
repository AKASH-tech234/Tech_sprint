// src/components/Dashboard/Community/DistrictSwitcher.jsx
import React, { useState, useEffect } from 'react';
import { useDistrict } from '../../../context/DistrictContext';
import { MapPin, ChevronDown, Loader2, Navigation, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function DistrictSwitcher({ className }) {
  const {
    activeDistrictId,
    districtInfo,
    statesData,
    getStates,
    getDistrictsForState,
    selectDistrict,
    clearDistrict,
    detectAndSetLocation,
  } = useDistrict();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);

  const states = getStates();

  // Initialize from current selection
  useEffect(() => {
    if (districtInfo) {
      setSelectedState(districtInfo.state || '');
      setSelectedDistrict(districtInfo.district || '');
    }
  }, [districtInfo]);

  // Handle location detection
  const handleDetectLocation = async () => {
    setDetecting(true);
    setError(null);
    try {
      const result = await detectAndSetLocation();
      setSelectedState(result.state);
      setSelectedDistrict(result.district);
      setIsOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetecting(false);
    }
  };

  // Handle state change
  const handleStateChange = (state) => {
    setSelectedState(state);
    setSelectedDistrict('');
  };

  // Handle district selection
  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    selectDistrict(selectedState, district);
    setIsOpen(false);
  };

  // Get available districts for selected state
  const availableDistricts = selectedState ? getDistrictsForState(selectedState) : [];

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
          isOpen || activeDistrictId
            ? "border-rose-500/50 bg-rose-500/10 text-white"
            : "border-white/10 bg-white/5 text-white/60 hover:text-white"
        )}
      >
        <MapPin className="h-4 w-4" />
        <span className="max-w-[200px] truncate">
          {districtInfo 
            ? `${districtInfo.district}, ${districtInfo.state}`
            : 'Select District'
          }
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 rounded-xl border border-white/10 bg-black/95 shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Select District</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-white/10"
            >
              <X className="h-4 w-4 text-white/60" />
            </button>
          </div>

          {/* Detect Location Button */}
          <div className="p-4 border-b border-white/10">
            <button
              onClick={handleDetectLocation}
              disabled={detecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
            >
              {detecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Use My Location
                </>
              )}
            </button>
            {error && (
              <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
            )}
          </div>

          {/* State Selection */}
          <div className="p-4 border-b border-white/10">
            <label className="block text-xs text-white/60 mb-2">State</label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white"
            >
              <option value="" className="bg-black">Select State</option>
              {states.map((state) => (
                <option key={state} value={state} className="bg-black">
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* District Selection */}
          {selectedState && (
            <div className="max-h-60 overflow-y-auto p-2">
              {availableDistricts.length === 0 ? (
                <p className="p-4 text-center text-white/40 text-sm">
                  No districts found
                </p>
              ) : (
                availableDistricts.map((district) => (
                  <button
                    key={district}
                    onClick={() => handleDistrictSelect(district)}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-lg text-sm transition-colors",
                      selectedDistrict === district
                        ? "bg-rose-500/20 text-rose-400"
                        : "text-white/80 hover:bg-white/10"
                    )}
                  >
                    {district}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Clear Selection */}
          {activeDistrictId && (
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  clearDistrict();
                  setSelectedState('');
                  setSelectedDistrict('');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DistrictSwitcher;
