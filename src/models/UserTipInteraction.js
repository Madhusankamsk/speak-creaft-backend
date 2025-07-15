const mongoose = require('mongoose');

const userTipInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tip',
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  unlockedAt: {
    type: Date,
    default: null
  },
  unlockOrder: {
    type: Number,
    min: 1,
    max: 3,
    default: null
  },
  readAt: {
    type: Date,
    default: null
  },
  favoritedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
userTipInteractionSchema.index({ userId: 1, tipId: 1 }, { unique: true });
userTipInteractionSchema.index({ userId: 1, isRead: 1 });
userTipInteractionSchema.index({ userId: 1, isFavorite: 1 });
userTipInteractionSchema.index({ userId: 1, isUnlocked: 1 });

module.exports = mongoose.model('UserTipInteraction', userTipInteractionSchema); 