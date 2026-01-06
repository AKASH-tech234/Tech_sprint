// src/services/verificationService.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

class VerificationService {
  // Verify an issue (community only)
  async verifyIssue(issueId, status, remarks = null) {
    const response = await fetch(`${API_BASE_URL}/verification/issues/${issueId}/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, remarks }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify issue');
    }
    
    return response.json();
  }

  // Get verification stats for an issue
  async getVerificationStats(issueId) {
    const response = await fetch(`${API_BASE_URL}/verification/issues/${issueId}/verification/stats`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch verification stats');
    }
    
    return response.json();
  }

  // Get verifier list for an issue (officials/community only)
  async getVerifierList(issueId) {
    const response = await fetch(`${API_BASE_URL}/verification/issues/${issueId}/verification/verifiers`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch verifier list');
    }
    
    return response.json();
  }

  // Check if current user has verified an issue
  async checkUserVerification(issueId) {
    const response = await fetch(`${API_BASE_URL}/verification/issues/${issueId}/verification/check`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check verification status');
    }
    
    return response.json();
  }

  // Get unverified issues for community
  async getUnverifiedIssues() {
    const response = await fetch(`${API_BASE_URL}/verification/community/unverified-issues`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch unverified issues');
    }
    
    return response.json();
  }
}

export const verificationService = new VerificationService();
export default verificationService;
