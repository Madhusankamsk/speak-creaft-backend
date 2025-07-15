const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('./constants');

// JWT Token generation
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Password hashing
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Password comparison
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Response helpers
const successResponse = (res, data = {}, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, message = 'Error occurred', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: true
  });
};

// Pagination helper
const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

// Date helpers
const getStartOfDay = (date = new Date()) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

const getEndOfDay = (date = new Date()) => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

// Array helpers
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// File upload helpers
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
};

// Error handling helpers
const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Logging helpers
const logError = (error, context = '') => {
  console.error(`[${new Date().toISOString()}] ${context}:`, error);
};

const logInfo = (message, data = {}) => {
  console.log(`[${new Date().toISOString()}] ${message}:`, data);
};

module.exports = {
  generateAccessToken,
  hashPassword,
  comparePassword,
  successResponse,
  errorResponse,
  getPaginationParams,
  getStartOfDay,
  getEndOfDay,
  shuffleArray,
  isValidEmail,
  isValidPassword,
  generateFileName,
  handleAsyncError,
  logError,
  logInfo
}; 