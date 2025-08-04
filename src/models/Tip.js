const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  type: {
    type: String,
    enum: ['speaking', 'listening', 'reading', 'writing', 'general'],
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  level: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
tipSchema.index({ isActive: 1, difficulty: 1 });
tipSchema.index({ categoryId: 1, isActive: 1 });
tipSchema.index({ type: 1, isActive: 1 });
tipSchema.index({ level: 1, isActive: 1 });

module.exports = mongoose.model('Tip', tipSchema); 