// src/context/DistrictContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateDistrictId, parseDistrictId } from '../services/districtService';

const DistrictContext = createContext(null);

const STORAGE_KEY = 'activeDistrictId';

export function DistrictProvider({ children }) {
  const [activeDistrictId, setActiveDistrictId] = useState(null);
  const [districtLoading, setDistrictLoading] = useState(true);
  const [statesData, setStatesData] = useState({});

  // Load district from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setActiveDistrictId(stored);
    }
    setDistrictLoading(false);
  }, []);

  // Load states/districts data
  useEffect(() => {
    loadStatesData();
  }, []);

  const loadStatesData = async () => {
    try {
      // Try to load from public folder first
      const response = await fetch('/india_states_districts.json');
      if (response.ok) {
        const data = await response.json();
        setStatesData(data);
      }
    } catch (error) {
      console.error('Failed to load states data:', error);
      // Fallback to empty object
      setStatesData({});
    }
  };

  // Select a district
  const selectDistrict = useCallback((state, district) => {
    const districtId = generateDistrictId(state, district);
    setActiveDistrictId(districtId);
    localStorage.setItem(STORAGE_KEY, districtId);
    return districtId;
  }, []);

  // Set district by ID directly
  const setDistrictById = useCallback((districtId) => {
    setActiveDistrictId(districtId);
    if (districtId) {
      localStorage.setItem(STORAGE_KEY, districtId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Clear district selection
  const clearDistrict = useCallback(() => {
    setActiveDistrictId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get district info from current ID
  const getDistrictInfo = useCallback(() => {
    if (!activeDistrictId) return null;
    return parseDistrictId(activeDistrictId);
  }, [activeDistrictId]);

  // Get all states
  const getStates = useCallback(() => {
    return Object.keys(statesData).sort();
  }, [statesData]);

  // Get districts for a state
  const getDistrictsForState = useCallback((state) => {
    return statesData[state] || [];
  }, [statesData]);

  // Detect current location and set district
  const detectAndSetLocation = useCallback(async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Use reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            
            if (!response.ok) throw new Error('Geocoding failed');
            
            const data = await response.json();
            const address = data.address || {};
            
            const state = address.state;
            const district = address.state_district || address.county;
            
            if (state && district) {
              const districtId = selectDistrict(state, district);
              resolve({
                districtId,
                state,
                district,
                lat: latitude,
                lng: longitude,
                city: address.city || address.town || address.village,
                address: data.display_name
              });
            } else {
              reject(new Error('Could not determine district from location'));
            }
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [selectDistrict]);

  const value = {
    activeDistrictId,
    districtLoading,
    districtInfo: activeDistrictId ? parseDistrictId(activeDistrictId) : null,
    statesData,
    selectDistrict,
    setDistrictById,
    clearDistrict,
    getDistrictInfo,
    getStates,
    getDistrictsForState,
    detectAndSetLocation,
  };

  return (
    <DistrictContext.Provider value={value}>
      {children}
    </DistrictContext.Provider>
  );
}

export function useDistrict() {
  const context = useContext(DistrictContext);
  if (!context) {
    throw new Error('useDistrict must be used within a DistrictProvider');
  }
  return context;
}

export default DistrictContext;
