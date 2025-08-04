const mongoose = require('mongoose');

const legalDocumentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['terms_of_service', 'privacy_policy', 'cookie_policy'],
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
legalDocumentSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('LegalDocument', legalDocumentSchema);