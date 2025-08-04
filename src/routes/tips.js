const express = require('express');
const router = express.Router();
const { 
  getDailyTips, 
  getUserTips, 
  markAsRead, 
  toggleFavorite, 
  getFavoriteTips,
  getDebugSchedule
} = require('../controllers/tipController');
const { userAuth, requireQuizCompletion } = require('../middleware/auth');

// All tip routes require authentication and quiz completion
router.use(userAuth);
router.use(requireQuizCompletion);

// Daily tips
router.get('/daily', getDailyTips);

// User tips
router.get('/user', getUserTips);

// Tip interactions
router.post('/:tipId/read', markAsRead);
router.post('/:tipId/favorite', toggleFavorite);

// Favorites
router.get('/favorites', getFavoriteTips);

// Debug endpoint (temporary)
router.get('/debug-schedule', getDebugSchedule);

module.exports = router; 