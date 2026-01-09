// src/services/districtService.js
// API service for district-based community operations

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/**
 * Generate districtId from state and district names
 * Format: "state-name__district-name" (lowercase, hyphenated)
 */
export const generateDistrictId = (state, district) => {
  if (!state || !district) return null;
  
  const stateSlug = state.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const districtSlug = district.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  return `${stateSlug}__${districtSlug}`;
};

/**
 * Parse districtId back into state and district names
 */
export const parseDistrictId = (districtId) => {
  if (!districtId || !districtId.includes('__')) return { state: null, district: null };
  
  const [stateSlug, districtSlug] = districtId.split('__');
  
  // Convert slugs back to title case
  const toTitleCase = (str) => str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    state: toTitleCase(stateSlug),
    district: toTitleCase(districtSlug)
  };
};

class DistrictService {
  /**
   * Get community stats for a district
   */
  async getCommunityStats(districtId = null) {
    const params = new URLSearchParams();
    if (districtId) params.append('districtId', districtId);
    
    const response = await fetch(`${API_BASE_URL}/community/stats?${params}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch community stats');
    }
    
    return response.json();
  }

  /**
   * Get leaderboard for a district
   */
  async getLeaderboard(districtId = null, limit = 10) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (districtId) params.append('districtId', districtId);
    
    const response = await fetch(`${API_BASE_URL}/community/leaderboard?${params}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    
    return response.json();
  }

  /**
   * Get issues for a district
   */
  async getDistrictIssues(districtId, filters = {}) {
    const params = new URLSearchParams();
    if (districtId) params.append('districtId', districtId);
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/community/issues?${params}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch district issues');
    }
    
    return response.json();
  }

  /**
   * Get heatmap data for a district
   */
  async getHeatmapData(districtId, filters = {}) {
    const params = new URLSearchParams();
    if (districtId) params.append('districtId', districtId);
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    
    const response = await fetch(`${API_BASE_URL}/community/heatmap?${params}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch heatmap data');
    }
    
    return response.json();
  }

  /**
   * Get community chat messages for a district
   */
  async getChatMessages(districtId, options = {}) {
    const params = new URLSearchParams();
    params.append('districtId', districtId);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.before) params.append('before', options.before);
    
    const response = await fetch(`${API_BASE_URL}/community/chat?${params}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch chat messages');
    }
    
    return response.json();
  }

  /**
   * Send a chat message to district community
   */
  async sendMessage(districtId, message, options = {}) {
    const response = await fetch(`${API_BASE_URL}/community/chat`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        districtId,
        message,
        type: options.type || 'text',
        sharedIssueId: options.sharedIssueId,
        imageUrl: options.imageUrl,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to send message');
    }
    
    return response.json();
  }

  /**
   * React to a chat message
   */
  async reactToMessage(messageId, reaction) {
    const response = await fetch(`${API_BASE_URL}/community/chat/${messageId}/react`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reaction }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to react to message');
    }
    
    return response.json();
  }

  /**
   * Get available districts from a state (for location selection)
   */
  async getDistrictsForState(state) {
    // This could be an API call, but for now we'll return from local JSON
    try {
      const response = await fetch('/india_states_districts.json');
      if (!response.ok) throw new Error('Failed to load districts');
      const data = await response.json();
      return data[state] || [];
    } catch (error) {
      console.error('Error loading districts:', error);
      return [];
    }
  }

  /**
   * Detect user's location and find nearest district
   */
  async detectLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Use reverse geocoding to get state/district
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            
            if (!response.ok) throw new Error('Geocoding failed');
            
            const data = await response.json();
            const address = data.address || {};
            
            resolve({
              lat: latitude,
              lng: longitude,
              state: address.state || null,
              district: address.state_district || address.county || null,
              city: address.city || address.town || address.village || null,
              address: data.display_name || null
            });
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
  }
}

export const districtService = new DistrictService();
export default districtService;
