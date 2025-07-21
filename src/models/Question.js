const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering'],
    required: true
  },
  options: [{
    type: String,
    trim: true
  }],
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  explanation: {
    type: String,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  },
  order: {
    type: Number,
    default: 0
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
questionSchema.index({ isActive: 1, order: 1 });
questionSchema.index({ categoryId: 1, isActive: 1 });
questionSchema.index({ difficulty: 1, isActive: 1 });

module.exports = mongoose.model('Question', questionSchema); 