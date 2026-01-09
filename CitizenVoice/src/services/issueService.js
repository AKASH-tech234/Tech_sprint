// src/services/issueService.js
// API service for issue-related operations
// Backend endpoints to be implemented

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

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
    const response = await fetch(`${API_BASE_URL}/issues/create`, {
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
    const response = await fetch(`${API_BASE_URL}/issues/recent?${params}`, {
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
    const response = await fetch(`${API_BASE_URL}/issues/my-issues?${params}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch your issues");
    }

    return response.json();
  }

  // Get single issue by ID
  async getIssue(id) {
    const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
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

    const response = await fetch(`${API_BASE_URL}/issues/${id}`, requestOptions);

    if (!response.ok) {
      throw new Error("Failed to update issue");
    }

    return response.json();
  }

  // Delete issue
  async deleteIssue(id) {
    const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/issues/${id}/upvote`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to upvote issue");
    }

    return response.json();
  }

  // Add comment to issue
  async addComment(id, text) {
    const response = await fetch(`${API_BASE_URL}/issues/${id}/comments`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Failed to add comment");
    }

    return response.json();
  }

  // Get comments for an issue
  async getComments(id) {
    const response = await fetch(`${API_BASE_URL}/issues/${id}/comments`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch comments");
    }

    return response.json();
  }

  // Get dashboard statistics for citizen
  async getCitizenStats() {
    const response = await fetch(`${API_BASE_URL}/issues/stats/citizen`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch statistics");
    }

    return response.json();
  }

  // Get dashboard statistics for officials
  async getOfficialStats() {
    const response = await fetch(`${API_BASE_URL}/officials/stats`, {
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
      `${API_BASE_URL}/officials/assigned?${params}`,
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
      `${API_BASE_URL}/officials/assign/${issueId}`,
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
    const response = await fetch(`${API_BASE_URL}/officials/team`, {
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch team members");
    }

    return response.json();
  }

  // Add team member
  async addTeamMember(memberData) {
    const response = await fetch(`${API_BASE_URL}/officials/team`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to add team member");
    }

    return response.json();
  }

  // Remove team member
  async removeTeamMember(memberId) {
    const response = await fetch(`${API_BASE_URL}/officials/team/${memberId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to remove team member");
    }

    return response.json();
  }

  // Get analytics data
  async getAnalytics(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${API_BASE_URL}/officials/analytics?${params}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch analytics");
    }

    return response.json();
  }

  // Community: Get area issues
  async getAreaIssues(areaId, filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${API_BASE_URL}/community/area/${areaId}?${params}`,
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
      `${API_BASE_URL}/community/verification-queue`,
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
    const response = await fetch(`${API_BASE_URL}/community/verify/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/community/stats`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch community statistics");
    }

    return response.json();
  }

  // Community: Get community leaderboard (top contributors)
  async getCommunityLeaderboard(limit = 10) {
    const response = await fetch(`${API_BASE_URL}/community/leaderboard?limit=${limit}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch community leaderboard");
    }

    return response.json();
  }

  // Get all issues for heatmap (with filtering)
  async getAllIssues(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/issues/all?${params}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch all issues");
    }

    return response.json();
  }

  // === Team Management APIs ===
  
  // Send message to team member
  async sendMessageToMember(recipientId, message) {
    const response = await fetch(`${API_BASE_URL}/officials/message`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipientId, message }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    return response.json();
  }

  // Get messages with team member
  async getMessages(memberId) {
    const response = await fetch(`${API_BASE_URL}/officials/messages/${memberId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    return response.json();
  }

  // Mark messages as read
  async markMessagesRead(memberId) {
    const response = await fetch(`${API_BASE_URL}/officials/messages/${memberId}/mark-read`, {
      method: "PATCH",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to mark messages as read");
    }

    return response.json();
  }

  // Submit verification or resolution report for an issue
  async submitReport(issueId, formData) {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}/reports`, {
      method: "POST",
      credentials: "include",
      body: formData, // FormData sets its own Content-Type
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to submit report");
    }

    return response.json();
  }

  // === Admin Review Queue APIs ===

  // Get pending reports for admin review (verification or resolution)
  async getPendingReports(reportType = "verification") {
    const response = await fetch(
      `${API_BASE_URL}/officials/reports/pending?type=${reportType}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch pending reports");
    }

    return response.json();
  }

  // Review a report (approve or reject)
  async reviewReport(reportId, reviewData) {
    const response = await fetch(
      `${API_BASE_URL}/officials/reports/${reportId}/review`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to submit review");
    }

    return response.json();
  }

  // Get report details
  async getReportDetails(reportId) {
    const response = await fetch(
      `${API_BASE_URL}/officials/reports/${reportId}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch report details");
    }

    return response.json();
  }

  // Get reports for a specific issue
  async getIssueReports(issueId) {
    const response = await fetch(
      `${API_BASE_URL}/issues/${issueId}/reports`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch issue reports");
    }

    return response.json();
  }
}

export const issueService = new IssueService();
