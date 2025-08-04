const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    required: true,
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

module.exports = mongoose.model('User', userSchema); 