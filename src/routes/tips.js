const express = require('express');
const router = express.Router();
const {
  getDailyTips,
  getUserTips,
  getHistoricalTips,
  markAsRead,
  toggleFavorite,
  getFavoriteTips,
  getDebugSchedule
} = require('../controllers/tipController');
const { userAuth, requireQuizCompletion } = require('../middleware/auth');
const { readOnlyLimiter } = require('../middleware/rateLimiter');

// All tip routes require authentication and quiz completion
router.use(userAuth);
router.use(requireQuizCompletion);

// Daily tips (with lenient rate limiting for read operations)
router.get('/daily', readOnlyLimiter, getDailyTips);

// User tips
router.get('/user', readOnlyLimiter, getUserTips);

// Historical tips
router.get('/history', readOnlyLimiter, getHistoricalTips);

// Tip interactions
router.post('/:tipId/read', markAsRead);
router.post('/:tipId/favorite', toggleFavorite);

// Favorites
router.get('/favorites', getFavoriteTips);

// Debug endpoint (temporary)
router.get('/debug-schedule', getDebugSchedule);

module.exports = router; 