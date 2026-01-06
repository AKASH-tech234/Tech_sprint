// Backend/src/controllers/notificationController.js
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';

// Get user notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const query = { recipient: userId };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .populate('relatedIssue', 'issueId title status')
    .populate('relatedUser', 'username')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

  res.status(200).json(
    new ApiResponse(200, {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    }, 'Notifications retrieved')
  );
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.status(200).json(
    new ApiResponse(200, { notification }, 'Notification marked as read')
  );
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json(
    new ApiResponse(200, null, 'All notifications marked as read')
  );
});

// Delete a notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  res.status(200).json(
    new ApiResponse(200, null, 'Notification deleted')
  );
});

// Get unread count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  res.status(200).json(
    new ApiResponse(200, { unreadCount: count }, 'Unread count retrieved')
  );
});

// Create notification (internal use / admin)
export const createNotification = async (recipientId, type, title, message, options = {}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedIssue: options.relatedIssue || null,
      relatedUser: options.relatedUser || null,
      metadata: options.metadata || {},
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
