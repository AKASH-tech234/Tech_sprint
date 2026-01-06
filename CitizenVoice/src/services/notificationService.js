// src/services/notificationService.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

class NotificationService {
  // Get user notifications
  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/notifications?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch notifications');
    }
    
    return response.json();
  }

  // Get unread count
  async getUnreadCount() {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch unread count');
    }
    
    return response.json();
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark notification as read');
    }
    
    return response.json();
  }

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark all as read');
    }
    
    return response.json();
  }

  // Delete notification
  async deleteNotification(notificationId) {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete notification');
    }
    
    return response.json();
  }
}

export const notificationService = new NotificationService();
export default notificationService;
