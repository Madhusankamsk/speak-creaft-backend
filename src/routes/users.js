const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { userAuth } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validation');

// All routes require authentication
router.use(userAuth);

// Profile management
router.get('/profile', userController.getProfile);
router.put('/profile', validateProfileUpdate, userController.updateProfile);

// Statistics and progress
router.get('/stats', userController.getUserStats);
router.get('/progress/categories', userController.getCategoryProgress);

// Push notification token management
router.post('/push-token', userController.registerPushToken);
router.delete('/push-token', userController.unregisterPushToken);

module.exports = router; 