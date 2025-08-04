const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Tips', 'Account', 'Notifications', 'Technical', 'General', 'Privacy'],
    default: 'General'
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
  },
  searchKeywords: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Text search index
faqSchema.index({ 
  question: 'text', 
  answer: 'text', 
  searchKeywords: 'text' 
});

// Regular indexes
faqSchema.index({ isActive: 1, order: 1 });
faqSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('FAQ', faqSchema);