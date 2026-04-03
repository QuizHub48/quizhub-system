const express = require('express');
const router = express.Router();
const { getStudentNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// GET /api/notifications/student - get student notifications
router.get('/student', protect, getStudentNotifications);

// PUT /api/notifications/:id/read - mark notification as read
router.put('/:id/read', protect, markAsRead);

module.exports = router;
