const express = require('express');
const router  = express.Router();
const {
  getModulesByCourse, createModule, updateModule, deleteModule,
  assignLecturer, removeLecturer, enrollStudent, unenrollStudent, getModuleQuizzes
} = require('../controllers/moduleController');
const { protect, authorize } = require('../middleware/auth');

router.get('/course/:courseId', protect, getModulesByCourse);
router.post('/', protect, authorize('admin'), createModule);
router.put('/:id', protect, authorize('admin'), updateModule);
router.delete('/:id', protect, authorize('admin'), deleteModule);

router.post('/:id/lecturers', protect, authorize('admin'), assignLecturer);
router.delete('/:id/lecturers/:lecturerId', protect, authorize('admin'), removeLecturer);

router.post('/:id/students', protect, authorize('admin'), enrollStudent);
router.delete('/:id/students/:studentId', protect, authorize('admin'), unenrollStudent);

router.get('/:id/quizzes', protect, getModuleQuizzes);

module.exports = router;
