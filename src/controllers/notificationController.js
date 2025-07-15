const notificationService = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/helpers');
const { ERROR_MESSAGES } = require('../utils/constants');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page, limit, unreadOnly } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      unreadOnly: unreadOnly === 'true'
    });

    return successResponse(res, result, 'Notifications retrieved successfully');

  } catch (error) {
    console.error('Get user notifications error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await notificationService.markNotificationAsRead(userId, id);

    return successResponse(res, { notification }, 'Notification marked as read');

  } catch (error) {
    console.error('Mark notification as read error:', error);
    if (error.message === 'Notification not found') {
      return errorResponse(res, 'Notification not found', 404);
    }
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await notificationService.markAllNotificationsAsRead(userId);

    return successResponse(res, {
      updatedCount: result.modifiedCount
    }, 'All notifications marked as read');

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await notificationService.getUnreadCount(userId);

    return successResponse(res, { count }, 'Unread count retrieved successfully');

  } catch (error) {
    console.error('Get unread count error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await require('../models/Notification').findOneAndDelete({
      _id: id,
      userId
    });

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    return successResponse(res, {}, 'Notification deleted successfully');

  } catch (error) {
    console.error('Delete notification error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await require('../models/Notification').deleteMany({ userId });

    return successResponse(res, {
      deletedCount: result.deletedCount
    }, 'All notifications deleted successfully');

  } catch (error) {
    console.error('Delete all notifications error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get notification settings (placeholder for future implementation)
// @route   GET /api/notifications/settings
// @access  Private
const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;

    // For now, return default settings
    // In the future, this could be stored in user preferences
    const settings = {
      tipUnlocks: true,
      quizReminders: true,
      dailyReminders: true,
      achievements: true,
      systemUpdates: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    return successResponse(res, { settings }, 'Notification settings retrieved successfully');

  } catch (error) {
    console.error('Get notification settings error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Update notification settings (placeholder for future implementation)
// @route   PUT /api/notifications/settings
// @access  Private
const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const settings = req.body;

    // For now, just return success
    // In the future, this would save to user preferences
    console.log('Notification settings update for user:', userId, settings);

    return successResponse(res, { settings }, 'Notification settings updated successfully');

  } catch (error) {
    console.error('Update notification settings error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications,
  getNotificationSettings,
  updateNotificationSettings
}; 