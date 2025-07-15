const mongoose = require('mongoose');

const unlockedTipSchema = new mongoose.Schema({
  tipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tip',
    required: true
  },
  unlockTime: {
    type: Date,
    default: null
  },
  unlockOrder: {
    type: Number,
    min: 1,
    max: 3,
    required: true
  }
});

const dailyUnlockSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  unlockedTips: [unlockedTipSchema],
  unlockSchedule: {
    firstUnlock: {
      type: Date,
      required: true
    },
    secondUnlock: {
      type: Date,
      required: true
    },
    thirdUnlock: {
      type: Date,
      required: true
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
dailyUnlockSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyUnlockSchema.index({ date: 1 });

module.exports = mongoose.model('DailyUnlock', dailyUnlockSchema); 