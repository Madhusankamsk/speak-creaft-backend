const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { userAuth, requireQuizCompletion } = require('../middleware/auth');

// All profile routes require authentication
router.use(userAuth);

// Profile management
router.get('/', profileController.getUserProfile);
router.put('/', profileController.updateUserProfile);

// Notification settings
router.get('/notification-settings', profileController.getNotificationSettings);
router.put('/notification-settings', profileController.updateNotificationSettings);

// Support features
router.post('/contact', profileController.sendContactMessage);
router.get('/faqs', profileController.getFAQs);

// Legal documents
router.get('/terms-of-service', profileController.getTermsOfService);
router.get('/privacy-policy', profileController.getPrivacyPolicy);

module.exports = router;