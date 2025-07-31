const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['tip_unlocked', 'quiz_reminder', 'daily_reminder', 'achievement', 'system'],
    default: 'tip_unlocked'
  },
  data: {
    tipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tip'
    },
    unlockOrder: {
      type: Number,
      min: 1,
      max: 3
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    userLevel: {
      type: Number,
      min: 1,
      max: 10
    },
    levelName: {
      type: String
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isSent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Notifications expire after 7 days
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as sent
notificationSchema.methods.markAsSent = function() {
  this.isSent = true;
  this.sentAt = new Date();
  return this.save();
};

// Static method to create tip unlock notification
notificationSchema.statics.createTipUnlockNotification = function(userId, tipId, unlockOrder, tipTitle, categoryName, userLevel, levelName) {
  // Level-aware titles with motivational messages
  const getLevelAwareTitles = (level, unlockOrder) => {
    const baseTitle = {
      1: '🌅 Morning Tip Unlocked!',
      2: '☀️ Afternoon Tip Ready!',
      3: '🌙 Evening Tip Available!'
    };

    // Add level-specific motivational prefixes for higher levels
    if (level >= 8) {
      return {
        1: '🏆 Expert Morning Insight!',
        2: '⭐ Master Afternoon Tip!',
        3: '💎 Elite Evening Wisdom!'
      }[unlockOrder] || baseTitle[unlockOrder];
    } else if (level >= 6) {
      return {
        1: '🎯 Advanced Morning Tip!',
        2: '🚀 Advanced Afternoon Boost!',
        3: '🌟 Advanced Evening Guide!'
      }[unlockOrder] || baseTitle[unlockOrder];
    } else if (level >= 4) {
      return {
        1: '📈 Intermediate Morning Tip!',
        2: '💪 Intermediate Progress!',
        3: '🎉 Intermediate Evening Tip!'
      }[unlockOrder] || baseTitle[unlockOrder];
    }
    
    return baseTitle[unlockOrder] || 'New Tip Unlocked!';
  };

  // Level-aware messages with personalized content
  const getLevelAwareMessages = (level, unlockOrder, tipTitle, levelName) => {
    const baseMessages = {
      1: `Your first ${levelName} tip is ready: "${tipTitle}"`,
      2: `Perfect for your ${levelName} level: "${tipTitle}"`,
      3: `Complete your day with this ${levelName} tip: "${tipTitle}"`
    };

    if (level >= 8) {
      return {
        1: `Elite ${levelName} insight awaits: "${tipTitle}" - Master your skills!`,
        2: `Advanced ${levelName} technique: "${tipTitle}" - Push your boundaries!`,
        3: `Expert ${levelName} wisdom: "${tipTitle}" - Excellence continues!`
      }[unlockOrder] || baseMessages[unlockOrder];
    } else if (level >= 6) {
      return {
        1: `Advanced ${levelName} strategy: "${tipTitle}" - Level up your skills!`,
        2: `Your ${levelName} advancement: "${tipTitle}" - Keep growing!`,
        3: `Advanced ${levelName} mastery: "${tipTitle}" - You're doing great!`
      }[unlockOrder] || baseMessages[unlockOrder];
    } else if (level >= 4) {
      return {
        1: `Intermediate ${levelName} boost: "${tipTitle}" - Building strong foundations!`,
        2: `Your ${levelName} progress: "${tipTitle}" - Keep it up!`,
        3: `Intermediate ${levelName} success: "${tipTitle}" - You're improving!`
      }[unlockOrder] || baseMessages[unlockOrder];
    } else if (level >= 2) {
      return {
        1: `${levelName} learning: "${tipTitle}" - Every step counts!`,
        2: `Your ${levelName} journey: "${tipTitle}" - Progress is progress!`,
        3: `${levelName} achievement: "${tipTitle}" - Keep learning!`
      }[unlockOrder] || baseMessages[unlockOrder];
    }
    
    return {
      1: `Start your ${levelName} journey: "${tipTitle}" - You've got this!`,
      2: `${levelName} foundation: "${tipTitle}" - Building confidence!`,
      3: `${levelName} success: "${tipTitle}" - Great start today!`
    }[unlockOrder] || baseMessages[unlockOrder];
  };

  return this.create({
    userId,
    title: getLevelAwareTitles(userLevel, unlockOrder),
    message: getLevelAwareMessages(userLevel, unlockOrder, tipTitle, levelName),
    type: 'tip_unlocked',
    data: {
      tipId,
      unlockOrder,
      categoryName,
      userLevel,
      levelName
    }
  });
};

// Static method to create quiz reminder
notificationSchema.statics.createQuizReminder = function(userId) {
  return this.create({
    userId,
    title: '📝 Ready for Your Assessment?',
    message: 'Complete your English level quiz to unlock personalized tips!',
    type: 'quiz_reminder'
  });
};

// Static method to create daily reminder
notificationSchema.statics.createDailyReminder = function(userId) {
  return this.create({
    userId,
    title: '🌟 New Tips Coming Soon!',
    message: 'Check back throughout the day for new language learning tips.',
    type: 'daily_reminder'
  });
};

// Static method to create level-aware daily completion achievement notification
notificationSchema.statics.createDailyCompletionAchievement = function(userId, userLevel, levelName, completedTips) {
  const getLevelAchievementContent = (level, levelName, tipCount) => {
    const achievements = {
      title: '',
      message: ''
    };

    if (level >= 8) {
      achievements.title = '🏆 Expert Daily Mastery!';
      achievements.message = `Outstanding! You've completed all ${tipCount} ${levelName} tips today. Your expertise continues to shine! 🌟`;
    } else if (level >= 6) {
      achievements.title = '🎯 Advanced Achievement!';
      achievements.message = `Excellent work! ${tipCount} ${levelName} tips completed today. You're advancing brilliantly! 🚀`;
    } else if (level >= 4) {
      achievements.title = '📈 Intermediate Success!';
      achievements.message = `Great progress! You've finished all ${tipCount} ${levelName} tips today. Keep building those skills! 💪`;
    } else if (level >= 2) {
      achievements.title = '🌱 Learning Achievement!';
      achievements.message = `Well done! ${tipCount} ${levelName} tips completed today. Every step forward counts! 🎉`;
    } else {
      achievements.title = '⭐ Beginner Victory!';
      achievements.message = `Amazing start! You've completed all ${tipCount} ${levelName} tips today. You're building a great foundation! 🎊`;
    }

    return achievements;
  };

  const achievement = getLevelAchievementContent(userLevel, levelName, completedTips);
  
  return this.create({
    userId,
    title: achievement.title,
    message: achievement.message,
    type: 'achievement',
    data: {
      userLevel,
      levelName,
      completedTips,
      achievementType: 'daily_completion'
    }
  });
};

// Static method to create achievement notification
notificationSchema.statics.createAchievementNotification = function(userId, achievement) {
  return this.create({
    userId,
    title: '🏆 Achievement Unlocked!',
    message: achievement.message,
    type: 'achievement',
    data: {
      achievement: achievement.type
    }
  });
};

module.exports = mongoose.model('Notification', notificationSchema); 