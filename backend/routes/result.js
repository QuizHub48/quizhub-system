const express = require('express');
const router = express.Router();
const { getMyResults, getResultById, getQuizResults, getLeaderboard, getQuizAnalytics, getOverallLeaderboard } = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my', protect, authorize('student'), getMyResults);
router.get('/leaderboard-overall', protect, getOverallLeaderboard);
router.get('/:id', protect, getResultById);
router.get('/quiz/:quizId', protect, authorize('lecturer', 'admin'), getQuizResults);
router.get('/leaderboard/:quizId', protect, getLeaderboard);
router.get('/analytics/:quizId', protect, authorize('lecturer', 'admin'), getQuizAnalytics);

module.exports = router;
