import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import OtpVerification from './pages/OtpVerification';
import StudentDashboard from './pages/student/Dashboard';
import StudentMyQuizzes from './pages/student/MyQuizzes';
import StudentNotifications from './pages/student/Notifications';
import StudentProfile from './pages/student/Profile';
import StudentLeaderboard from './pages/student/Leaderboard2';
import TakeQuiz from './pages/student/TakeQuiz';
import QuizResult from './pages/student/QuizResult';
import ResultHistory from './pages/student/ResultHistory';
import Leaderboard from './pages/student/Leaderboard';
import StudentMessages from './pages/student/Messages';
import LecturerDashboard from './pages/lecturer/Dashboard';
import ManageQuizzes from './pages/lecturer/ManageQuizzes';
import CreateQuiz from './pages/lecturer/CreateQuiz';
import ManageQuiz from './pages/lecturer/ManageQuiz';
import QuizAnalytics from './pages/lecturer/QuizAnalytics';
import LecturerAnalytics from './pages/lecturer/LecturerAnalytics';
import LecturerStudents from './pages/lecturer/LecturerStudents';
import LecturerProfile from './pages/lecturer/LecturerProfile';
import LecturerMessages from './pages/lecturer/Messages';
import GenerateQuizFromNotes from './pages/lecturer/GenerateQuizFromNotes';
import StudentResult from './pages/lecturer/StudentResult';
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCourses from './pages/admin/ManageCourses';
import CourseDetail from './pages/admin/CourseDetail';
import Reports from './pages/admin/Reports';
import Activity from './pages/admin/Activity';
import AdminProfile from './pages/admin/AdminProfile';
import AdminMessages from './pages/admin/Messages';
import Profile from './pages/Profile';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Home />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'lecturer') return <Navigate to="/lecturer" />;
  return <Navigate to="/student" />;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<OtpVerification />} />

      {/* Student */}
      <Route path="/student" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
      <Route path="/student/my-quizzes" element={<PrivateRoute roles={['student']}><StudentMyQuizzes /></PrivateRoute>} />
      <Route path="/student/schedule" element={<Navigate to="/student/my-quizzes" replace />} />
      <Route path="/student/notifications" element={<PrivateRoute roles={['student']}><StudentNotifications /></PrivateRoute>} />
      <Route path="/student/messages" element={<PrivateRoute roles={['student']}><StudentMessages /></PrivateRoute>} />
      <Route path="/student/profile" element={<PrivateRoute roles={['student']}><StudentProfile /></PrivateRoute>} />
      <Route path="/student/leaderboard" element={<PrivateRoute roles={['student']}><StudentLeaderboard /></PrivateRoute>} />
      <Route path="/quiz/:id/take" element={<PrivateRoute roles={['student']}><TakeQuiz /></PrivateRoute>} />
      <Route path="/result/:id" element={<PrivateRoute roles={['student']}><QuizResult /></PrivateRoute>} />
      <Route path="/results" element={<PrivateRoute roles={['student']}><ResultHistory /></PrivateRoute>} />
      <Route path="/leaderboard/:quizId" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />

      {/* Lecturer */}
      <Route path="/lecturer" element={<PrivateRoute roles={['lecturer']}><LecturerDashboard /></PrivateRoute>} />
      <Route path="/lecturer/quizzes" element={<PrivateRoute roles={['lecturer']}><ManageQuizzes /></PrivateRoute>} />
      <Route path="/lecturer/create-quiz" element={<PrivateRoute roles={['lecturer']}><CreateQuiz /></PrivateRoute>} />
      <Route path="/lecturer/generate" element={<PrivateRoute roles={['lecturer']}><GenerateQuizFromNotes /></PrivateRoute>} />
      <Route path="/lecturer/messages" element={<PrivateRoute roles={['lecturer']}><LecturerMessages /></PrivateRoute>} />
      <Route path="/lecturer/quiz/:id/manage" element={<PrivateRoute roles={['lecturer']}><ManageQuiz /></PrivateRoute>} />
      <Route path="/lecturer/quiz/:id/analytics" element={<PrivateRoute roles={['lecturer']}><QuizAnalytics /></PrivateRoute>} />
      <Route path="/lecturer/analytics" element={<PrivateRoute roles={['lecturer']}><LecturerAnalytics /></PrivateRoute>} />
      <Route path="/lecturer/students" element={<PrivateRoute roles={['lecturer']}><LecturerStudents /></PrivateRoute>} />
      <Route path="/lecturer/profile" element={<PrivateRoute roles={['lecturer']}><LecturerProfile /></PrivateRoute>} />
      <Route path="/lecturer/student-result/:id" element={<PrivateRoute roles={['lecturer']}><StudentResult /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><ManageUsers /></PrivateRoute>} />
      <Route path="/admin/courses" element={<PrivateRoute roles={['admin']}><ManageCourses /></PrivateRoute>} />
      <Route path="/admin/courses/:id" element={<PrivateRoute roles={['admin']}><CourseDetail /></PrivateRoute>} />
      <Route path="/admin/reports" element={<PrivateRoute roles={['admin']}><Reports /></PrivateRoute>} />
      <Route path="/admin/activity" element={<PrivateRoute roles={['admin']}><Activity /></PrivateRoute>} />
      <Route path="/admin/profile" element={<PrivateRoute roles={['admin']}><AdminProfile /></PrivateRoute>} />
      <Route path="/admin/messages" element={<PrivateRoute roles={['admin']}><AdminMessages /></PrivateRoute>} />

      {/* Shared */}
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
    </Routes>
    <ToastContainer position="top-right" autoClose={3000} />
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
