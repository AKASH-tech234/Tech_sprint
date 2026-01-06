// src/services/userService.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

class UserService {
  // Get user profile
  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch profile');
    }
    
    return response.json();
  }

  // Update user profile
  async updateProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }
    
    return response.json();
  }

  // Check profile completion status
  async checkProfileCompletion() {
    const response = await fetch(`${API_BASE_URL}/users/profile/completion`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check profile completion');
    }
    
    return response.json();
  }

  // Upload profile photo
  async uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch(`${API_BASE_URL}/users/profile/photo`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload photo');
    }
    
    return response.json();
  }
}

export const userService = new UserService();
export default userService;
