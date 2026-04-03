const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, updateUserRole, editUser, getSystemStats, getCourses, createCourse, deleteCourse, updateCourse, toggleCourseStatus, getAllResults, getRecentActivity, toggleUserStatus, getSettings, updateSettings, getNotifications, markNotificationRead, markAllNotificationsRead, syncEnrollments, fixEnrollments, enrollStudent, unenrollStudent, getCourseById, assignCourseLecturer, removeCourseLecturer } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.put('/users/:id/edit', editUser);
router.delete('/users/:id', deleteUser);
router.get('/stats', getSystemStats);
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.get('/courses/:id', getCourseById);
router.put('/courses/:id/toggle-status', toggleCourseStatus);
router.put('/courses/:id', updateCourse);
router.post('/courses/:id/lecturers', assignCourseLecturer);
router.delete('/courses/:id/lecturers/:lecturerId', removeCourseLecturer);
router.post('/courses/:id/enroll', enrollStudent);
router.delete('/courses/:id/students/:studentId', unenrollStudent);
router.delete('/courses/:id', deleteCourse);
router.get('/all-results', getAllResults);
router.get('/recent-activity', getRecentActivity);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/mark-all-read', markAllNotificationsRead);
router.post('/sync-enrollments', syncEnrollments);
router.post('/fix-enrollments', fixEnrollments);

module.exports = router;
