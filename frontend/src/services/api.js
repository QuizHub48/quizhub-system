import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Automatically attach JWT token from localStorage to every request
API.interceptors.request.use((config) => {
  const user = localStorage.getItem('quizhub_user');
  if (user) {
    const { token } = JSON.parse(user);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 / 403 responses globally — clear stale token and redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Don't log out on message-related errors to avoid interrupting chat
      if (error.config?.url?.includes('/messages')) {
        return Promise.reject(error);
      }
      // Token is expired or role has changed — force fresh login
      localStorage.removeItem('quizhub_user');
      window.location.href = '/login?reason=session_expired';
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const getDepartments = () => API.get('/auth/departments');
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
export const verifyOtp = (email, otp) => API.post('/auth/verify-otp', { email, otp });

// Quizzes
export const getQuizzes = () => API.get('/quizzes');
export const getQuizById = (id) => API.get(`/quizzes/${id}`);
export const createQuiz = (data) => API.post('/quizzes', data);
export const updateQuiz = (id, data) => API.put(`/quizzes/${id}`, data);
export const deleteQuiz = (id) => API.delete(`/quizzes/${id}`);
export const publishQuiz = (id) => API.put(`/quizzes/${id}/publish`);
export const submitQuiz = (id, data) => API.post(`/quizzes/${id}/submit`, data);
export const enableQuizReattempt = (id, data) => API.put(`/quizzes/${id}/reattempt`, data);

// AI-based Quiz Generation
export const generateMCQsFromNotes = (formData) =>
  API.post('/quizzes/generate-from-notes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const saveGeneratedQuiz = (data) => API.post('/quizzes/save-generated', data);

// Lecturer Info
export const getLecturerInfo = () => API.get('/quizzes/lecturer/info');

// Lecturer Notifications
export const getLecturerNotifications = () => API.get('/quizzes/lecturer/notifications');
export const markLecturerNotificationAsRead = (id) => API.put(`/quizzes/lecturer/notifications/${id}/read`);
export const markAllLecturerNotificationsAsRead = () => API.put('/quizzes/lecturer/notifications/mark-all-read');

// Results
export const getMyResults = () => API.get('/results/my');
export const getOverallLeaderboard = () => API.get('/results/leaderboard-overall');
export const getResultById = (id) => API.get(`/results/${id}`);
export const getQuizResults = (quizId) => API.get(`/results/quiz/${quizId}`);
export const getLeaderboard = (quizId) => API.get(`/results/leaderboard/${quizId}`);
export const getQuizAnalytics = (quizId) => API.get(`/results/analytics/${quizId}`);

// Admin
export const getAllUsers = () => API.get('/admin/users');
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);
export const updateUserRole = (id, role) => API.put(`/admin/users/${id}/role`, { role });
export const getSystemStats = () => API.get('/admin/stats');
export const getCourses = () => API.get('/admin/courses');
export const createCourse = (data) => API.post('/admin/courses', data);
export const updateCourse = (id, data) => API.put(`/admin/courses/${id}`, data);
export const toggleCourseStatus = (id) => API.put(`/admin/courses/${id}/toggle-status`);
export const getCourseById = (id) => API.get(`/admin/courses/${id}`);
export const assignCourseLecturer = (courseId, lecturerId) => API.post(`/admin/courses/${courseId}/lecturers`, { lecturerId });
export const removeCourseLecturer = (courseId, lecturerId) => API.delete(`/admin/courses/${courseId}/lecturers/${lecturerId}`);
export const enrollStudentInCourse = (courseId, studentId) => API.post(`/admin/courses/${courseId}/enroll`, { studentId });
export const unenrollStudentFromCourse = (courseId, studentId) => API.delete(`/admin/courses/${courseId}/students/${studentId}`);

// Modules
export const getModulesByCourse = (courseId) => API.get(`/modules/course/${courseId}`);
export const createModule = (data) => API.post('/modules', data);
export const updateModule = (id, data) => API.put(`/modules/${id}`, data);
export const deleteModule = (id) => API.delete(`/modules/${id}`);
export const assignModuleLecturer = (id, lecturerId) => API.post(`/modules/${id}/lecturers`, { lecturerId });
export const removeModuleLecturer = (id, lecturerId) => API.delete(`/modules/${id}/lecturers/${lecturerId}`);
export const enrollStudentInModule = (id, studentId) => API.post(`/modules/${id}/students`, { studentId });
export const unenrollStudentFromModule = (id, studentId) => API.delete(`/modules/${id}/students/${studentId}`);
export const getModuleQuizzes = (id) => API.get(`/modules/${id}/quizzes`);
export const deleteCourse = (id) => API.delete(`/admin/courses/${id}`);
export const getAllResults = () => API.get('/admin/all-results');
export const getRecentActivity = () => API.get('/admin/recent-activity');
export const toggleUserStatus = (id) => API.put(`/admin/users/${id}/toggle-status`);
export const editUserDetails = (id, data) => API.put(`/admin/users/${id}/edit`, data);
export const getSettings = () => API.get('/admin/settings');
export const updateSettings = (data) => API.put('/admin/settings', data);
export const getNotifications = () => API.get('/admin/notifications');

// Faculties & Departments (dynamic)
export const getFaculties = () => API.get('/faculties');
export const createFaculty = (name) => API.post('/faculties', { name });
export const deleteFaculty = (id) => API.delete(`/faculties/${id}`);
export const addDepartment = (facultyId, data) => API.post(`/faculties/${facultyId}/departments`, data);
export const removeDepartment = (facultyId, deptId) => API.delete(`/faculties/${facultyId}/departments/${deptId}`);

// Messages (general admin-student/lecturer conversation)
export const sendMessage = (data) => API.post('/messages', data);
export const getAllMessages = () => API.get('/messages');
export const getMessageThread = (userId) => API.get(`/messages/thread/${userId}`);
export const replyToMessage = (id, content) => API.post(`/messages/${id}/reply`, { content });
export const markMessageRead = (id) => API.put(`/messages/${id}/read`);

// Messages (direct student-lecturer)
export const sendDirectMessage = (data) => API.post('/messages/direct', data);
export const getAssignedLecturers = () => API.get('/messages/direct/assigned-lecturers');
export const getDirectMessages = () => API.get('/messages/direct');
export const replyToDirectMessage = (id, content) => API.post(`/messages/direct/${id}/reply`, { content });
export const markDirectMessageRead = (id) => API.put(`/messages/direct/${id}/read`);
export const getDirectUnreadCount = () => API.get('/messages/direct/unread-count');

// Chat / messaging helpers
export const getMyMessages = () => API.get('/messages/my');
export const getMyUnreadCount = () => API.get('/messages/my/unread-count');
export const getAdminUnreadCount = () => API.get('/messages/unread-count');

// Student Notifications
export const getStudentNotifications = () => API.get('/notifications/student');
export const markNotificationAsRead = (id) => API.put(`/notifications/${id}/read`);
export const markNotificationRead = (id) => API.put(`/admin/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/admin/notifications/mark-all-read');
export const syncEnrollments = () => API.post('/admin/sync-enrollments');
export const fixEnrollments = () => API.post('/admin/fix-enrollments');
