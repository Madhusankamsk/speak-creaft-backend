const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.isGoogleUser; // Password not required for Google users
    },
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  level: {
    type: Number,
    min: 1,
    max: 10,
    default: null
  },
  quizCompleted: {
    type: Boolean,
    default: false
  },
  quizScore: {
    type: Number,
    default: null
  },
  quizTotalQuestions: {
    type: Number,
    default: null
  },
  quizDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  pushTokens: [{
    token: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true
    },
    deviceId: {
      type: String,
      required: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }],
  notificationSettings: {
    tipUnlocks: {
      type: Boolean,
      default: true
    },
    dailyReminders: {
      type: Boolean,
      default: true
    },
    weeklyProgress: {
      type: Boolean,
      default: true
    },
    achievements: {
      type: Boolean,
      default: true
    },
    systemUpdates: {
      type: Boolean,
      default: false
    },
    marketing: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON response and transform level to name
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  
  // Transform numeric level to level name
  if (user.level && typeof user.level === 'number') {
    const USER_LEVELS = {
      1: 'Beginner',
      2: 'Elementary', 
      3: 'Pre-Intermediate',
      4: 'Intermediate',
      5: 'Upper-Intermediate',
      6: 'Advanced',
      7: 'Upper-Advanced',
      8: 'Expert',
      9: 'Master',
      10: 'Grand Master'
    };
    user.level = USER_LEVELS[user.level] || user.level;
  }
  
  // Add calculated quiz fields if quiz is completed
  if (user.quizCompleted && user.quizScore !== null) {
    // Default total questions to 6 if not stored (for backward compatibility)
    const totalQuestions = user.quizTotalQuestions || 6;
    user.quizTotalQuestions = totalQuestions;
    user.quizPercentage = Math.round((user.quizScore / totalQuestions) * 100 * 100) / 100;
  }
  
  return user;
};

// Push token management methods
userSchema.methods.addPushToken = function(token, platform, deviceId) {
  // Remove existing token if it exists
  this.pushTokens = this.pushTokens.filter(t => t.token !== token);
  
  // Add new token
  this.pushTokens.push({
    token,
    platform,
    deviceId,
    isActive: true,
    lastUsed: new Date()
  });
  
  // Keep only the last 5 tokens per user to prevent bloat
  if (this.pushTokens.length > 5) {
    this.pushTokens = this.pushTokens.slice(-5);
  }
  
  return this.save();
};

userSchema.methods.removePushToken = function(token) {
  this.pushTokens = this.pushTokens.filter(t => t.token !== token);
  return this.save();
};

userSchema.methods.getActivePushTokens = function() {
  return this.pushTokens.filter(t => t.isActive);
};

userSchema.methods.updateTokenLastUsed = function(token) {
  const tokenObj = this.pushTokens.find(t => t.token === token);
  if (tokenObj) {
    tokenObj.lastUsed = new Date();
    return this.save();
  }
};

// Generate password reset token (6-digit OTP)
userSchema.methods.generatePasswordResetToken = function() {
  // Generate a 6-digit OTP
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the token and set it to passwordResetToken field
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set expiration time (1 hour from now)
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  // Return the unhashed OTP (this is what gets sent in email)
  return resetToken;
};

// Verify password reset token
userSchema.methods.verifyPasswordResetToken = function(token) {
  // Hash the provided token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // Check if token matches and hasn't expired
  return this.passwordResetToken === hashedToken && 
         this.passwordResetExpires > Date.now();
};

// Clear password reset token
userSchema.methods.clearPasswordResetToken = function() {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
};

module.exports = mongoose.model('User', userSchema); 