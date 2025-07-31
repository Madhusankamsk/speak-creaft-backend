const DailyUnlock = require('../models/DailyUnlock');
const UserTipInteraction = require('../models/UserTipInteraction');
const Tip = require('../models/Tip');
const User = require('../models/User');
const notificationService = require('./notificationService');
const { getStartOfDay, shuffleArray } = require('../utils/helpers');
const { UNLOCK_TIMES } = require('../utils/constants');

class DailyUnlockService {
  // Get or create daily unlock for today
  async getDailyUnlock(userId) {
    const today = getStartOfDay();
    
    let dailyUnlock = await DailyUnlock.findOne({
      userId,
      date: today
    });
    
    if (!dailyUnlock) {
      // Create new daily unlock with 3 random tips
      dailyUnlock = await this.createDailyUnlock(userId);
    }
    
    return dailyUnlock;
  }

  // Create daily unlock with staggered schedule
  async createDailyUnlock(userId) {
    const user = await User.findById(userId);
    if (!user.quizCompleted) {
      throw new Error('User must complete quiz first');
    }
    
    const today = getStartOfDay();
    
    // Create unlock schedule for today
    const unlockSchedule = {
      firstUnlock: new Date(today.getTime() + (UNLOCK_TIMES.FIRST * 60 * 60 * 1000)),
      secondUnlock: new Date(today.getTime() + (UNLOCK_TIMES.SECOND * 60 * 60 * 1000)),
      thirdUnlock: new Date(today.getTime() + (UNLOCK_TIMES.THIRD * 60 * 60 * 1000))
    };
    
    // Get available tips
    const availableTips = await this.getAvailableTips(userId);
    
    // Select 3 random tips
    const selectedTips = shuffleArray(availableTips).slice(0, 3);
    
    // Create daily unlock record
    const dailyUnlock = await DailyUnlock.create({
      userId,
      date: today,
      unlockedTips: selectedTips.map((tip, index) => ({
        tipId: tip._id,
        unlockTime: null,
        unlockOrder: index + 1
      })),
      unlockSchedule
    });
    
    return dailyUnlock;
  }

  // Check and unlock tips based on current time
  async checkAndUnlockTips(userId) {
    const dailyUnlock = await this.getDailyUnlock(userId);
    const now = new Date();
    
    // Get available tips if not already selected
    if (dailyUnlock.unlockedTips.length === 0) {
      const user = await User.findById(userId);
      const availableTips = await this.getAvailableTips(userId);
      const selectedTips = shuffleArray(availableTips).slice(0, 3);
      
      // Update daily unlock with selected tips
      dailyUnlock.unlockedTips = selectedTips.map((tip, index) => ({
        tipId: tip._id,
        unlockTime: null,
        unlockOrder: index + 1
      }));
      
      await dailyUnlock.save();
    }
    
    const newlyUnlocked = [];
    
    // Check first unlock (9:00 AM)
    if (now >= dailyUnlock.unlockSchedule.firstUnlock && 
        !dailyUnlock.unlockedTips[0].unlockTime) {
      await this.unlockTip(userId, dailyUnlock.unlockedTips[0].tipId, 1, now);
      dailyUnlock.unlockedTips[0].unlockTime = now;
      newlyUnlocked.push({
        tipId: dailyUnlock.unlockedTips[0].tipId,
        unlockOrder: 1,
        unlockTime: now
      });
      
      // Send push notification for first unlock
      try {
        await notificationService.sendTipUnlockNotification(
          userId,
          dailyUnlock.unlockedTips[0].tipId,
          1
        );
      } catch (error) {
        console.error('Failed to send first unlock notification:', error);
      }
    }
    
    // Check second unlock (2:00 PM)
    if (now >= dailyUnlock.unlockSchedule.secondUnlock && 
        !dailyUnlock.unlockedTips[1].unlockTime) {
      await this.unlockTip(userId, dailyUnlock.unlockedTips[1].tipId, 2, now);
      dailyUnlock.unlockedTips[1].unlockTime = now;
      newlyUnlocked.push({
        tipId: dailyUnlock.unlockedTips[1].tipId,
        unlockOrder: 2,
        unlockTime: now
      });
      
      // Send push notification for second unlock
      try {
        await notificationService.sendTipUnlockNotification(
          userId,
          dailyUnlock.unlockedTips[1].tipId,
          2
        );
      } catch (error) {
        console.error('Failed to send second unlock notification:', error);
      }
    }
    
    // Check third unlock (7:00 PM)
    if (now >= dailyUnlock.unlockSchedule.thirdUnlock && 
        !dailyUnlock.unlockedTips[2].unlockTime) {
      await this.unlockTip(userId, dailyUnlock.unlockedTips[2].tipId, 3, now);
      dailyUnlock.unlockedTips[2].unlockTime = now;
      newlyUnlocked.push({
        tipId: dailyUnlock.unlockedTips[2].tipId,
        unlockOrder: 3,
        unlockTime: now
      });
      
      // Send push notification for third unlock
      try {
        await notificationService.sendTipUnlockNotification(
          userId,
          dailyUnlock.unlockedTips[2].tipId,
          3
        );
      } catch (error) {
        console.error('Failed to send third unlock notification:', error);
      }
    }
    
    await dailyUnlock.save();
    
    const totalUnlocked = dailyUnlock.unlockedTips.filter(tip => tip.unlockTime).length;
    
    // Check if all tips are unlocked and send achievement notification
    if (totalUnlocked === 3 && newlyUnlocked.length > 0) {
      // Only send achievement if the last tip was just unlocked
      const lastUnlocked = newlyUnlocked[newlyUnlocked.length - 1];
      if (lastUnlocked.unlockOrder === 3) {
        try {
          await notificationService.sendDailyCompletionAchievement(userId);
        } catch (error) {
          console.error('Failed to send daily completion achievement:', error);
        }
      }
    }
    
    return {
      newlyUnlocked,
      totalUnlocked,
      nextUnlock: this.getNextUnlockTime(dailyUnlock.unlockSchedule, now)
    };
  }

  // Unlock individual tip
  async unlockTip(userId, tipId, unlockOrder, unlockTime) {
    let interaction = await UserTipInteraction.findOne({
      userId,
      tipId
    });
    
    if (!interaction) {
      interaction = new UserTipInteraction({
        userId,
        tipId,
        isUnlocked: true,
        unlockedAt: unlockTime,
        unlockOrder
      });
    } else {
      interaction.isUnlocked = true;
      interaction.unlockedAt = unlockTime;
      interaction.unlockOrder = unlockOrder;
    }
    
    await interaction.save();
  }

  // Get available tips for user
  async getAvailableTips(userId) {
    const user = await User.findById(userId);
    
    const allTips = await Tip.find({
      level: user.level,
      isActive: true
    });
    
    // Get tips user hasn't unlocked yet
    const unlockedTipIds = await UserTipInteraction.find({
      userId,
      isUnlocked: true
    }).distinct('tipId');
    
    let availableTips = allTips.filter(tip => 
      !unlockedTipIds.includes(tip._id)
    );
    
    // If not enough tips available, reset unlocked status
    if (availableTips.length < 3) {
      await UserTipInteraction.updateMany(
        { userId },
        { isUnlocked: false, unlockOrder: null }
      );
      availableTips = allTips;
    }
    
    return availableTips;
  }

  // Get next unlock time
  getNextUnlockTime(unlockSchedule, now) {
    if (now < unlockSchedule.firstUnlock) {
      return unlockSchedule.firstUnlock;
    } else if (now < unlockSchedule.secondUnlock) {
      return unlockSchedule.secondUnlock;
    } else if (now < unlockSchedule.thirdUnlock) {
      return unlockSchedule.thirdUnlock;
    } else {
      // All unlocked for today, next unlock is tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(UNLOCK_TIMES.FIRST, 0, 0, 0);
      return tomorrow;
    }
  }

  // Get today's unlock status
  async getTodayStatus(userId) {
    const dailyUnlock = await this.getDailyUnlock(userId);
    const now = new Date();
    
    const unlockedCount = dailyUnlock.unlockedTips.filter(tip => tip.unlockTime).length;
    const nextUnlock = this.getNextUnlockTime(dailyUnlock.unlockSchedule, now);
    
    return {
      unlockedCount,
      totalTips: 3,
      nextUnlock,
      unlockSchedule: dailyUnlock.unlockSchedule,
      isAllUnlocked: unlockedCount === 3
    };
  }

  // Get unlock history
  async getUnlockHistory(userId, limit = 7) {
    return await DailyUnlock.find({ userId })
      .sort({ date: -1 })
      .limit(limit)
      .populate('unlockedTips.tipId');
  }

  // Process all users' daily unlocks (for cron job)
  async processAllDailyUnlocks() {
    try {
      const users = await User.find({ 
        isActive: true, 
        quizCompleted: true 
      });
      
      const results = [];
      
      for (const user of users) {
        try {
          const result = await this.checkAndUnlockTips(user._id);
          if (result.newlyUnlocked.length > 0) {
            results.push({
              userId: user._id,
              userEmail: user.email,
              newlyUnlocked: result.newlyUnlocked
            });
          }
        } catch (error) {
          console.error(`Error processing unlocks for user ${user._id}:`, error);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error processing all daily unlocks:', error);
      throw error;
    }
  }

  // Send reminder notifications for users who haven't completed quiz
  async sendQuizReminders() {
    try {
      const users = await User.find({
        isActive: true,
        quizCompleted: false,
        lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Active in last 24 hours
      });

      const results = [];
      
      for (const user of users) {
        try {
          await notificationService.sendQuizReminderNotification(user._id);
          results.push({
            userId: user._id,
            userEmail: user.email,
            notificationSent: true
          });
        } catch (error) {
          console.error(`Error sending quiz reminder to user ${user._id}:`, error);
          results.push({
            userId: user._id,
            userEmail: user.email,
            notificationSent: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error sending quiz reminders:', error);
      throw error;
    }
  }

  // Send daily reminder notifications
  async sendDailyReminders() {
    try {
      const users = await User.find({
        isActive: true,
        quizCompleted: true
      });

      const results = [];
      
      for (const user of users) {
        try {
          await notificationService.sendDailyReminderNotification(user._id);
          results.push({
            userId: user._id,
            userEmail: user.email,
            notificationSent: true
          });
        } catch (error) {
          console.error(`Error sending daily reminder to user ${user._id}:`, error);
          results.push({
            userId: user._id,
            userEmail: user.email,
            notificationSent: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error sending daily reminders:', error);
      throw error;
    }
  }
}

module.exports = new DailyUnlockService(); 