const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  userAnswer: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number,
    min: 0
  }
});

const userQuizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  correctAnswers: {
    type: Number,
    required: true,
    min: 0
  },
  timeSpent: {
    type: Number,
    min: 0
  },
  answers: [answerSchema],
  assignedLevel: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
userQuizSchema.index({ userId: 1, createdAt: -1 });
userQuizSchema.index({ assignedLevel: 1 });

module.exports = mongoose.model('UserQuiz', userQuizSchema); 