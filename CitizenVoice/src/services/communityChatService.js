// src/services/communityChatService.js
// Service for community chat operations

import { districtService } from './districtService';

class CommunityChatService {
  /**
   * Get messages for a district
   */
  async getMessages(districtId, options = {}) {
    return districtService.getChatMessages(districtId, options);
  }

  /**
   * Send a text message
   */
  async sendTextMessage(districtId, message) {
    return districtService.sendMessage(districtId, message, { type: 'text' });
  }

  /**
   * Share an issue in chat
   */
  async shareIssue(districtId, issueId, message = '') {
    return districtService.sendMessage(districtId, message || 'Check out this issue!', {
      type: 'issue_share',
      sharedIssueId: issueId,
    });
  }

  /**
   * Send an image message
   */
  async sendImageMessage(districtId, imageUrl, caption = '') {
    return districtService.sendMessage(districtId, caption || 'Shared an image', {
      type: 'image',
      imageUrl,
    });
  }

  /**
   * React to a message
   */
  async reactToMessage(messageId, reaction) {
    return districtService.reactToMessage(messageId, reaction);
  }

  /**
   * Format message timestamp
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // Same year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

export const communityChatService = new CommunityChatService();
export default communityChatService;
