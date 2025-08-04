const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'account', 'feature', 'bug', 'feedback'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  adminResponse: {
    type: String,
    trim: true
  },
  respondedAt: {
    type: Date
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
contactMessageSchema.index({ userId: 1, createdAt: -1 });
contactMessageSchema.index({ status: 1, priority: -1, createdAt: -1 });
contactMessageSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);