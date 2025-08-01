const Notification = require('../models/Notification');
const User = require('../models/User');
const Tip = require('../models/Tip');
const { logInfo, logError } = require('../utils/helpers');
const { USER_LEVELS } = require('../utils/constants');

class NotificationService {
  constructor(io = null) {
    this.io = io;
  }

  // Set Socket.io instance
  setIO(io) {
    this.io = io;
  }

  // Get level-based notification preferences
  getLevelBasedPreferences(userLevel) {
    const preferences = {
      enableMotivationalMessages: true,
      enableAchievementNotifications: true,
      enableProgressUpdates: true,
      notificationStyle: 'standard'
    };

    // Higher level users get more sophisticated notifications
    if (userLevel >= 8) {
      preferences.notificationStyle = 'expert';
      preferences.enableAdvancedTips = true;
      preferences.enablePeerComparisons = true;
    } else if (userLevel >= 6) {
      preferences.notificationStyle = 'advanced';
      preferences.enableProgressAnalytics = true;
    } else if (userLevel >= 4) {
      preferences.notificationStyle = 'intermediate';
      preferences.enableGoalTracking = true;
    } else {
      preferences.notificationStyle = 'beginner';
      preferences.enableExtraEncouragement = true;
    }

    return preferences;
  }

  // Send tip unlock notification
  async sendTipUnlockNotification(userId, tipId, unlockOrder) {
    try {
      // Get tip details
      const tip = await Tip.findById(tipId).populate('categoryId', 'name');
      if (!tip) {
        throw new Error('Tip not found');
      }

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user level and level name
      const userLevel = user.level || 1;
      const levelName = USER_LEVELS.NAMES[userLevel] || 'Beginner';

      // Create notification in database with level awareness
      const notification = await Notification.createTipUnlockNotification(
        userId,
        tipId,
        unlockOrder,
        tip.title,
        tip.categoryId?.name || 'General',
        userLevel,
        levelName
      );

      // Send real-time notification via Socket.io
      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification:new', {
          type: 'tip_unlocked',
          notification: {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            data: notification.data,
            createdAt: notification.createdAt
          }
        });
      }

      // Mark notification as sent
      await notification.markAsSent();

      logInfo('Tip unlock notification sent', {
        userId,
        tipId,
        unlockOrder,
        notificationId: notification._id
      });

      return notification;

    } catch (error) {
      logError(error, 'sendTipUnlockNotification');
      throw error;
    }
  }

  // Send quiz reminder notification
  async sendQuizReminderNotification(userId) {
    try {
      const notification = await Notification.createQuizReminder(userId);

      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification:new', {
          type: 'quiz_reminder',
          notification: {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            createdAt: notification.createdAt
          }
        });
      }

      await notification.markAsSent();

      logInfo('Quiz reminder notification sent', { userId, notificationId: notification._id });
      return notification;

    } catch (error) {
      logError(error, 'sendQuizReminderNotification');
      throw error;
    }
  }

  // Send daily reminder notification
  async sendDailyReminderNotification(userId) {
    try {
      // Get user details for level-aware reminders
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const userLevel = user.level || 1;
      const levelName = USER_LEVELS.NAMES[userLevel] || 'Beginner';
      const preferences = this.getLevelBasedPreferences(userLevel);

      // Create level-aware reminder notification
      let title, message;
      
      if (preferences.notificationStyle === 'expert') {
        title = '🎯 Expert Learning Awaits';
        message = `Ready to master more ${levelName} techniques? Advanced insights are waiting for you.`;
      } else if (preferences.notificationStyle === 'advanced') {
        title = '🚀 Advanced Progress Time';
        message = `Your ${levelName} journey continues! New strategies are ready to unlock.`;
      } else if (preferences.notificationStyle === 'intermediate') {
        title = '📈 Building Your Skills';
        message = `Keep growing your ${levelName} abilities! Fresh tips are coming your way.`;
      } else {
        title = '🌟 Learning Adventure Continues';
        message = `Great job on your ${levelName} progress! More helpful tips are on the way.`;
      }

      const notification = await Notification.create({
        userId,
        title,
        message,
        type: 'daily_reminder',
        data: {
          userLevel,
          levelName,
          notificationStyle: preferences.notificationStyle
        }
      });

      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification:new', {
          type: 'daily_reminder',
          notification: {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            data: notification.data,
            createdAt: notification.createdAt
          }
        });
      }

      await notification.markAsSent();

      logInfo('Level-aware daily reminder sent', { 
        userId, 
        userLevel, 
        levelName, 
        notificationStyle: preferences.notificationStyle,
        notificationId: notification._id 
      });
      return notification;

    } catch (error) {
      logError(error, 'sendDailyReminderNotification');
      throw error;
    }
  }

  // Send daily completion achievement notification
  async sendDailyCompletionAchievement(userId) {
    try {
      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user level and level name
      const userLevel = user.level || 1;
      const levelName = USER_LEVELS.NAMES[userLevel] || 'Beginner';

      // Create achievement notification
      const notification = await Notification.createDailyCompletionAchievement(
        userId,
        userLevel,
        levelName,
        3 // Number of daily tips completed
      );

      // Send real-time notification via Socket.io
      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification:new', {
          type: 'achievement',
          notification: {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            data: notification.data,
            createdAt: notification.createdAt
          }
        });
      }

      // Mark notification as sent
      await notification.markAsSent();

      logInfo('Daily completion achievement sent', {
        userId,
        userLevel,
        levelName,
        notificationId: notification._id
      });

      return notification;

    } catch (error) {
      logError(error, 'sendDailyCompletionAchievement');
      throw error;
    }
  }

  // Send achievement notification
  async sendAchievementNotification(userId, achievement) {
    try {
      const notification = await Notification.createAchievementNotification(userId, achievement);

      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification:new', {
          type: 'achievement',
          notification: {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            data: notification.data,
            createdAt: notification.createdAt
          }
        });
      }

      await notification.markAsSent();

      logInfo('Achievement notification sent', { 
        userId, 
        achievement: achievement.type, 
        notificationId: notification._id 
      });
      return notification;

    } catch (error) {
      logError(error, 'sendAchievementNotification');
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const skip = (page - 1) * limit;

      const filter = { userId };
      if (unreadOnly) {
        filter.isRead = false;
      }

      const [notifications, total] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('data.tipId', 'title categoryId')
          .populate('data.categoryId', 'name color'),
        Notification.countDocuments(filter)
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logError(error, 'getUserNotifications');
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(userId, notificationId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();

      // Emit read status update
      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification:read', {
          notificationId: notification._id
        });
      }

      logInfo('Notification marked as read', { userId, notificationId });
      return notification;

    } catch (error) {
      logError(error, 'markNotificationAsRead');
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      );

      // Emit bulk read status update
      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification:readAll');
      }

      logInfo('All notifications marked as read', { 
        userId, 
        updatedCount: result.modifiedCount 
      });

      return result;

    } catch (error) {
      logError(error, 'markAllNotificationsAsRead');
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        userId,
        isRead: false
      });

      return count;

    } catch (error) {
      logError(error, 'getUnreadCount');
      throw error;
    }
  }

  // Delete expired notifications
  async deleteExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      logInfo('Expired notifications deleted', { deletedCount: result.deletedCount });
      return result;

    } catch (error) {
      logError(error, 'deleteExpiredNotifications');
      throw error;
    }
  }

  // Send bulk notifications to multiple users
  async sendBulkNotifications(userIds, notificationData) {
    try {
      const notifications = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          const notification = await this.sendTipUnlockNotification(
            userId,
            notificationData.tipId,
            notificationData.unlockOrder
          );
          notifications.push(notification);
        } catch (error) {
          errors.push({ userId, error: error.message });
        }
      }

      logInfo('Bulk notifications sent', {
        totalUsers: userIds.length,
        successful: notifications.length,
        errors: errors.length
      });

      return { notifications, errors };

    } catch (error) {
      logError(error, 'sendBulkNotifications');
      throw error;
    }
  }

  // Handle user connection (for Socket.io)
  handleUserConnection(socket, userId) {
    socket.join(`user_${userId}`);
    
    // Send unread count on connection
    this.getUnreadCount(userId).then(count => {
      socket.emit('notification:unreadCount', { count });
    }).catch(error => {
      logError(error, 'handleUserConnection');
    });
  }

  // Handle user disconnection
  handleUserDisconnection(socket, userId) {
    socket.leave(`user_${userId}`);
  }
}

module.exports = new NotificationService(); 