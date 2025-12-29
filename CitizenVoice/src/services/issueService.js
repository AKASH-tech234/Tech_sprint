// src/services/issueService.js
// API service for issue-related operations
// Backend endpoints to be implemented

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

class IssueService {
  // Create a new issue
  async createIssue(formData) {
    // formData is already a FormData object passed from the component
    const response = await fetch(`${API_BASE_URL}/api/issues/create`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create issue' }));
      throw new Error(error.message || "Failed to create issue");
    }

    const result = await response.json();
    return result.data || result; // Handle both ApiResponse format and direct response
  }

  // Get all issues with filters
  async getIssues(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/issues/recent?${params}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch issues");
    }

    return response.json();
  }

  // Get user's own issues
  async getMyIssues(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/issues/my-issues?${params}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch your issues");
    }

    return response.json();
  }

  // Get single issue by ID
  async getIssue(id) {
    const response = await fetch(`${API_BASE_URL}/api/issues/${id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch issue");
    }

    return response.json();
  }

  // Update issue
  async updateIssue(id, updateData) {
    // Check if updateData is FormData (for image updates) or regular object
    const isFormData = updateData instanceof FormData;
    
    const requestOptions = {
      method: "PUT",
      credentials: "include",
    };
    
    if (!isFormData) {
      requestOptions.headers = {
        "Content-Type": "application/json",
      };
      requestOptions.body = JSON.stringify(updateData);
    } else {
      // FormData sets its own Content-Type with boundary
      requestOptions.body = updateData;
    }

    const response = await fetch(`${API_BASE_URL}/api/issues/${id}`, requestOptions);

    if (!response.ok) {
      throw new Error("Failed to update issue");
    }

    return response.json();
  }

  // Delete issue
  async deleteIssue(id) {
    const response = await fetch(`${API_BASE_URL}/api/issues/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete issue");
    }

    return response.json();
  }

  // Upvote an issue
  async upvoteIssue(id) {
    const response = await fetch(`${API_BASE_URL}/api/issues/${id}/upvote`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to upvote issue");
    }

    return response.json();
  }

  // Add comment to issue
  async addComment(id, comment) {
    const response = await fetch(`${API_BASE_URL}/api/issues/${id}/comment`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment }),
    });

    if (!response.ok) {
      throw new Error("Failed to add comment");
    }

    return response.json();
  }

  // Get dashboard statistics for citizen
  async getCitizenStats() {
    const response = await fetch(`${API_BASE_URL}/api/issues/stats/citizen`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch statistics");
    }

    return response.json();
  }

  // Get dashboard statistics for officials
  async getOfficialStats() {
    const response = await fetch(`${API_BASE_URL}/api/officials/stats`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch statistics");
    }

    return response.json();
  }

  // Get assigned issues for officials
  async getAssignedIssues(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${API_BASE_URL}/api/officials/assigned?${params}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch assigned issues");
    }

    return response.json();
  }

  // Assign issue to team member
  async assignIssue(issueId, memberId) {
    const response = await fetch(
      `${API_BASE_URL}/api/officials/assign/${issueId}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to assign issue");
    }

    return response.json();
  }

  // Get team members
  async getTeamMembers() {
    const response = await fetch(`${API_BASE_URL}/api/officials/team`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch team members");
    }

    return response.json();
  }

  // Get analytics data
  async getAnalytics(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${API_BASE_URL}/api/officials/analytics?${params}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch analytics");
    }

    return response.json();
  }

  // Community: Get area issues
  async getAreaIssues(areaId, filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${API_BASE_URL}/api/community/area/${areaId}?${params}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch area issues");
    }

    return response.json();
  }

  // Community: Get verification queue
  async getVerificationQueue() {
    const response = await fetch(
      `${API_BASE_URL}/api/community/verification-queue`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch verification queue");
    }

    return response.json();
  }

  // Community: Verify issue resolution
  async verifyResolution(id, verificationData) {
    const response = await fetch(`${API_BASE_URL}/api/community/verify/${id}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(verificationData),
    });

    if (!response.ok) {
      throw new Error("Failed to verify resolution");
    }

    return response.json();
  }

  // Community: Get community stats
  async getCommunityStats() {
    const response = await fetch(`${API_BASE_URL}/api/community/stats`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch community statistics");
    }

    return response.json();
  }

  // Get all issues for heatmap (with filtering)
  async getAllIssues(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/issues/all?${params}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch all issues");
    }

    return response.json();
  }
}

export const issueService = new IssueService();
