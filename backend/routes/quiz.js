const express = require('express');
const router = express.Router();
const { createQuiz, getQuizzes, getQuizById, updateQuiz, deleteQuiz, publishQuiz, submitQuiz, getLecturerNotifications, markLecturerNotificationAsRead, markAllLecturerNotificationsAsRead, getLecturerInfo, enableReattempt } = require('../controllers/quizController');
const { generateFromNotes, saveGeneratedQuiz } = require('../controllers/generationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes that must come BEFORE /:id to avoid conflicts
router.get('/lecturer/info', protect, authorize('lecturer', 'admin'), getLecturerInfo);
router.get('/lecturer/notifications', protect, authorize('lecturer', 'admin'), getLecturerNotifications);
router.put('/lecturer/notifications/mark-all-read', protect, authorize('lecturer', 'admin'), markAllLecturerNotificationsAsRead);
router.put('/lecturer/notifications/:id/read', protect, authorize('lecturer', 'admin'), markLecturerNotificationAsRead);
router.post('/generate-from-notes', protect, authorize('lecturer', 'admin'), upload.single('file'), generateFromNotes);
router.post('/save-generated', protect, authorize('lecturer', 'admin'), saveGeneratedQuiz);

// Standard quiz routes (must come after specific routes)
router.get('/', protect, getQuizzes);
router.post('/', protect, authorize('lecturer', 'admin'), createQuiz);
router.get('/:id', protect, getQuizById);
router.put('/:id', protect, authorize('lecturer', 'admin'), updateQuiz);
router.delete('/:id', protect, authorize('lecturer', 'admin'), deleteQuiz);
router.put('/:id/reattempt', protect, authorize('lecturer', 'admin'), enableReattempt);
router.post('/:id/submit', protect, authorize('student'), submitQuiz);

module.exports = router;
