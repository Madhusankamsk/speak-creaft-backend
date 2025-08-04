const { Expo } = require('expo-server-sdk');
const User = require('../models/User');
const { logInfo, logError } = require('../utils/helpers');

class PushNotificationService {
  constructor() {
    // Create a new Expo SDK client
    this.expo = new Expo();
  }

  /**
   * Send push notification to a single user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   * @param {string} notification.title - Notification title
   * @param {string} notification.body - Notification body
   * @param {Object} notification.data - Additional data
   */
  async sendToUser(userId, notification) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const activePushTokens = user.getActivePushTokens();
      if (activePushTokens.length === 0) {
        logInfo('No active push tokens for user', { userId });
        return { success: true, sent: 0, message: 'No push tokens available' };
      }

      const results = await this.sendToTokens(activePushTokens.map(t => t.token), notification);
      
      // Update token usage
      for (const tokenObj of activePushTokens) {
        await user.updateTokenLastUsed(tokenObj.token);
      }

      return results;
    } catch (error) {
      logError(error, 'sendToUser');
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notification - Notification data
   */
  async sendToUsers(userIds, notification) {
    try {
      const results = {
        totalUsers: userIds.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      for (const userId of userIds) {
        try {
          const result = await this.sendToUser(userId, notification);
          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push({ userId, error: result.message });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({ userId, error: error.message });
        }
      }

      logInfo('Bulk push notifications sent', results);
      return results;
    } catch (error) {
      logError(error, 'sendToUsers');
      throw error;
    }
  }

  /**
   * Send push notifications to specific tokens
   * @param {Array} pushTokens - Array of Expo push tokens
   * @param {Object} notification - Notification data
   */
  async sendToTokens(pushTokens, notification) {
    try {
      // Filter out invalid tokens
      const validTokens = pushTokens.filter(token => Expo.isExpoPushToken(token));
      
      if (validTokens.length === 0) {
        return { success: true, sent: 0, message: 'No valid push tokens' };
      }

      // Create messages array
      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: 1, // You might want to calculate actual badge count
        priority: 'high',
        channelId: 'default' // For Android
      }));

      // Send notifications in chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          logError(error, 'sendPushNotificationChunk');
        }
      }

      // Process tickets to check for errors
      const results = {
        success: true,
        sent: 0,
        failed: 0,
        tickets: tickets,
        errors: []
      };

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'error') {
          results.failed++;
          results.errors.push({
            token: validTokens[i],
            error: ticket.message,
            details: ticket.details
          });
        } else {
          results.sent++;
        }
      }

      logInfo('Push notifications sent', {
        totalTokens: validTokens.length,
        sent: results.sent,
        failed: results.failed
      });

      return results;
    } catch (error) {
      logError(error, 'sendToTokens');
      throw error;
    }
  }

  /**
   * Send tip unlock notification
   * @param {string} userId - User ID
   * @param {Object} tip - Tip data
   * @param {number} unlockOrder - Unlock order (1, 2, or 3)
   */
  async sendTipUnlockNotification(userId, tip, unlockOrder) {
    const timeLabels = {
      1: 'Morning',
      2: 'Afternoon', 
      3: 'Evening'
    };

    const notification = {
      title: `${timeLabels[unlockOrder]} English Tip Unlocked! 🌟`,
      body: `Your ${timeLabels[unlockOrder].toLowerCase()} tip "${tip.title}" is ready to help you improve!`,
      data: {
        type: 'tip_unlocked',
        tipId: tip._id.toString(),
        unlockOrder,
        categoryId: tip.categoryId?.toString(),
        screen: 'TipPreview',
        params: { tipId: tip._id.toString() }
      }
    };

    return this.sendToUser(userId, notification);
  }

  /**
   * Send daily reminder notification
   * @param {string} userId - User ID
   * @param {Object} user - User data
   */
  async sendDailyReminderNotification(userId, user) {
    const levelName = user.levelName || 'Beginner';
    
    const notification = {
      title: `Ready for today's English practice? 📚`,
      body: `Don't miss your daily tips designed for ${levelName} level learners!`,
      data: {
        type: 'daily_reminder',
        userLevel: user.level,
        screen: 'Home'
      }
    };

    return this.sendToUser(userId, notification);
  }

  /**
   * Send quiz reminder notification
   * @param {string} userId - User ID
   */
  async sendQuizReminderNotification(userId) {
    const notification = {
      title: `Complete Your English Level Quiz 🎯`,
      body: `Take a quick quiz to get personalized English tips for your level!`,
      data: {
        type: 'quiz_reminder',
        screen: 'Quiz'
      }
    };

    return this.sendToUser(userId, notification);
  }

  /**
   * Send achievement notification
   * @param {string} userId - User ID
   * @param {string} achievementTitle - Achievement title
   * @param {string} achievementMessage - Achievement message
   */
  async sendAchievementNotification(userId, achievementTitle, achievementMessage) {
    const notification = {
      title: `🏆 Achievement Unlocked!`,
      body: `${achievementTitle}: ${achievementMessage}`,
      data: {
        type: 'achievement',
        achievement: achievementTitle,
        screen: 'Profile'
      }
    };

    return this.sendToUser(userId, notification);
  }

  /**
   * Register a push token for a user
   * @param {string} userId - User ID
   * @param {string} token - Expo push token
   * @param {string} platform - Platform (ios, android, web)
   * @param {string} deviceId - Device ID (optional)
   */
  async registerPushToken(userId, token, platform, deviceId) {
    try {
      // Validate the token
      if (!Expo.isExpoPushToken(token)) {
        throw new Error('Invalid Expo push token');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.addPushToken(token, platform, deviceId);
      
      logInfo('Push token registered', { userId, platform, deviceId });
      return { success: true, message: 'Push token registered successfully' };
    } catch (error) {
      logError(error, 'registerPushToken');
      throw error;
    }
  }

  /**
   * Unregister a push token
   * @param {string} userId - User ID
   * @param {string} token - Expo push token
   */
  async unregisterPushToken(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.removePushToken(token);
      
      logInfo('Push token unregistered', { userId });
      return { success: true, message: 'Push token unregistered successfully' };
    } catch (error) {
      logError(error, 'unregisterPushToken');
      throw error;
    }
  }

  /**
   * Clean up invalid/expired tokens
   * This should be run periodically to remove tokens that are no longer valid
   */
  async cleanupInvalidTokens() {
    try {
      const users = await User.find({ 'pushTokens.0': { $exists: true } });
      let cleanedCount = 0;

      for (const user of users) {
        const validTokens = user.pushTokens.filter(tokenObj => {
          // Remove tokens older than 30 days that haven't been used
          const daysSinceLastUsed = (Date.now() - tokenObj.lastUsed) / (1000 * 60 * 60 * 24);
          return daysSinceLastUsed <= 30;
        });

        if (validTokens.length !== user.pushTokens.length) {
          user.pushTokens = validTokens;
          await user.save();
          cleanedCount++;
        }
      }

      logInfo('Push token cleanup completed', { usersUpdated: cleanedCount });
      return { success: true, usersUpdated: cleanedCount };
    } catch (error) {
      logError(error, 'cleanupInvalidTokens');
      throw error;
    }
  }
}

module.exports = new PushNotificationService();