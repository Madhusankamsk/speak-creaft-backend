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
notificationSchema.statics.createTipUnlockNotification = function(userId, tipId, unlockOrder, tipTitle, categoryName) {
  const titles = {
    1: '🌅 Morning Tip Unlocked!',
    2: '☀️ Afternoon Tip Ready!',
    3: '🌙 Evening Tip Available!'
  };

  const messages = {
    1: `Your first tip of the day is ready: "${tipTitle}"`,
    2: `Time for your second tip: "${tipTitle}"`,
    3: `Your final tip is waiting: "${tipTitle}"`
  };

  return this.create({
    userId,
    title: titles[unlockOrder] || 'New Tip Unlocked!',
    message: messages[unlockOrder] || `A new tip is available: "${tipTitle}"`,
    type: 'tip_unlocked',
    data: {
      tipId,
      unlockOrder,
      categoryName
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