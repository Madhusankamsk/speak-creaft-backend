// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Server Configuration
const SERVER_CONFIG = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

// Database Configuration
const DB_CONFIG = {
  URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/speakcraft',
  OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};

// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  API_KEY: process.env.CLOUDINARY_API_KEY,
  API_SECRET: process.env.CLOUDINARY_API_SECRET
};

// User Levels
const USER_LEVELS = {
  MIN: 1,
  MAX: 10,
  NAMES: {
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
  }
};

// Daily Unlock Times (in hours and minutes from midnight)
const UNLOCK_TIMES = {
  FIRST: { hour: 9, minute: 0 },   // 9:00 AM
  SECOND: { hour: 14, minute: 0 }, // 2:00 PM
  THIRD: { hour: 18, minute: 45 }  // 6:45 PM
};

// Quiz Configuration
const QUIZ_CONFIG = {
  TOTAL_QUESTIONS: 20,
  TIME_LIMIT: 30 * 60 * 1000, // 30 minutes in milliseconds
  PASSING_SCORE: 10 // Minimum correct answers to pass
};

// Rate Limiting
const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 5 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 500000 // requests per window (increased from 100)
};

// File Upload
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  UPLOAD_PATH: 'uploads/'
};

// Error Messages
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  
  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  EMAIL_ALREADY_TAKEN: 'Email already taken',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  
  // Quiz
  QUIZ_NOT_COMPLETED: 'Quiz not completed',
  QUIZ_ALREADY_COMPLETED: 'Quiz already completed',
  INVALID_QUIZ_DATA: 'Invalid quiz data',
  
  // Tips
  TIP_NOT_FOUND: 'Tip not found',
  TIP_ALREADY_READ: 'Tip already marked as read',
  TIP_NOT_UNLOCKED: 'Tip not unlocked yet',
  
  // Admin
  ADMIN_NOT_FOUND: 'Admin not found',
  ADMIN_ALREADY_EXISTS: 'Admin already exists',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  
  // General
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Bad request',
  FORBIDDEN: 'Forbidden'
};

// Success Messages
const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful',
  LOGOUT_SUCCESS: 'Logout successful',
  
  // User
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  
  // Quiz
  QUIZ_COMPLETED: 'Quiz completed successfully',
  QUIZ_SUBMITTED: 'Quiz submitted successfully',
  
  // Tips
  TIP_READ: 'Tip marked as read',
  TIP_FAVORITED: 'Tip added to favorites',
  TIP_UNFAVORITED: 'Tip removed from favorites',
  TIP_UNLOCKED: 'Tip unlocked successfully',
  
  // Admin
  ADMIN_CREATED: 'Admin created successfully',
  ADMIN_UPDATED: 'Admin updated successfully',
  ADMIN_DELETED: 'Admin deleted successfully',
  
  // General
  OPERATION_SUCCESS: 'Operation completed successfully',
  DATA_RETRIEVED: 'Data retrieved successfully'
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Socket Events
const SOCKET_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // User events
  USER_JOIN: 'user:join',
  USER_LEAVE: 'user:leave',
  
  // Tip events
  TIP_UNLOCKED: 'tip:unlocked',
  TIP_READ: 'tip:read',
  TIP_FAVORITED: 'tip:favorited',
  
  // Admin events
  ADMIN_JOIN: 'admin:join',
  USER_STATS_UPDATED: 'user:stats:updated',
  
  // Notification events
  NOTIFICATION_SENT: 'notification:sent',
  NOTIFICATION_READ: 'notification:read'
};

// Activity Log Types
const ACTIVITY_TYPES = {
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  QUIZ_COMPLETED: 'quiz_completed',
  TIP_READ: 'tip_read',
  TIP_FAVORITED: 'tip_favorited',
  TIP_UNLOCKED: 'tip_unlocked',
  PROFILE_UPDATED: 'profile_updated',
  ADMIN_LOGIN: 'admin_login',
  ADMIN_ACTION: 'admin_action'
};

module.exports = {
  JWT_SECRET,
  SERVER_CONFIG,
  DB_CONFIG,
  CLOUDINARY_CONFIG,
  USER_LEVELS,
  UNLOCK_TIMES,
  QUIZ_CONFIG,
  RATE_LIMIT_CONFIG,
  UPLOAD_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  HTTP_STATUS,
  SOCKET_EVENTS,
  ACTIVITY_TYPES
}; 