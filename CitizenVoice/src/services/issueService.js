// src/services/issueService.js
// API service for issue-related operations
// Backend endpoints to be implemented

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

class IssueService {
  // Create a new issue
  async createIssue(issueData) {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    Object.keys(issueData).forEach((key) => {
      if (key === "images" && issueData.images) {
        issueData.images.forEach((image) => {
          formData.append("images", image);
        });
      } else {
        formData.append(key, issueData[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create issue");
    }

    return response.json();
  }

  // Get all issues with filters
  async getIssues(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/issues?${params}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch issues");
    }

    return response.json();
  }

  // Get user's own issues
  async getMyIssues(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/issues/my-issues?${params}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch your issues");
    }

    return response.json();
  }

  // Get single issue by ID
  async getIssue(id) {
    const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch issue");
    }

    return response.json();
  }

  // Update issue
  async updateIssue(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error("Failed to update issue");
    }

    return response.json();
  }

  // Delete issue
  async deleteIssue(id) {
    const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete issue");
    }

    return response.json();
  }

  // Upvote an issue
  async upvoteIssue(id) {
    const response = await fetch(`${API_BASE_URL}/issues/${id}/upvote`, {
      method: "POST",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to upvote issue");
    }

    return response.json();
  }

  // Add comment to issue
  async addComment(id, comment) {
    const response = await fetch(`${API_BASE_URL}/issues/${id}/comment`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ comment }),
    });

    if (!response.ok) {
      throw new Error("Failed to add comment");
    }

    return response.json();
  }

  // Get dashboard statistics for citizen
  async getCitizenStats() {
    const response = await fetch(`${API_BASE_URL}/issues/stats/citizen`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch statistics");
    }

    return response.json();
  }

  // Get dashboard statistics for officials
  async getOfficialStats() {
    const response = await fetch(`${API_BASE_URL}/officials/stats`, {
      headers: getAuthHeader(),
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
      `${API_BASE_URL}/officials/assigned?${params}`,
      {
        headers: getAuthHeader(),
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
      `${API_BASE_URL}/officials/assign/${issueId}`,
      {
        method: "PATCH",
        headers: getAuthHeader(),
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
    const response = await fetch(`${API_BASE_URL}/officials/team`, {
      headers: getAuthHeader(),
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
      `${API_BASE_URL}/officials/analytics?${params}`,
      {
        headers: getAuthHeader(),
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
      `${API_BASE_URL}/community/area/${areaId}?${params}`,
      {
        headers: getAuthHeader(),
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
      `${API_BASE_URL}/community/verification-queue`,
      {
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch verification queue");
    }

    return response.json();
  }

  // Community: Verify issue resolution
  async verifyResolution(id, verificationData) {
    const response = await fetch(`${API_BASE_URL}/community/verify/${id}`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(verificationData),
    });

    if (!response.ok) {
      throw new Error("Failed to verify resolution");
    }

    return response.json();
  }

  // Community: Get community stats
  async getCommunityStats() {
    const response = await fetch(`${API_BASE_URL}/community/stats`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch community statistics");
    }

    return response.json();
  }

  // Get all issues for heatmap (with filtering)
  async getAllIssues(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/issues/all?${params}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch all issues");
    }

    return response.json();
  }
}

export const issueService = new IssueService();
