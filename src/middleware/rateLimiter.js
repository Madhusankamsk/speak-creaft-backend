const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_CONFIG } = require('../utils/constants');

// General API rate limiter with user-based key generation
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID if authenticated, otherwise fall back to IP
  keyGenerator: (req) => {
    if (req.user && req.user._id) {
      return `user_${req.user._id}`;
    }
    return req.ip;
  },
  // Skip rate limiting for certain endpoints
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path === '/health' || req.path.startsWith('/static/');
  }
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window (increased from 5)
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lenient limiter for read-only operations
const readOnlyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window for read operations
  message: {
    success: false,
    message: 'Too many read requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin routes limiter
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  adminLimiter,
  readOnlyLimiter
};