const express = require('express');
const router = express.Router();
const dailyUnlockController = require('../controllers/dailyUnlockController');
const { userAuth } = require('../middleware/auth');

// All routes require authentication
router.use(userAuth);

// Daily unlock management
router.get('/status', dailyUnlockController.getTodayStatus);
router.get('/check', dailyUnlockController.checkAndUnlockTips);
router.get('/history', dailyUnlockController.getUnlockHistory);

module.exports = router; 