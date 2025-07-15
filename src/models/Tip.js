const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  level: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
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
tipSchema.index({ isActive: 1, level: 1 });
tipSchema.index({ categoryId: 1, isActive: 1 });
tipSchema.index({ level: 1, isActive: 1 });

module.exports = mongoose.model('Tip', tipSchema); 