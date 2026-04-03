const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');

// Helper: look up the ID prefix for a department name from the Faculty collection
const getDeptPrefix = async (deptName) => {
  const faculties = await Faculty.find();
  for (const f of faculties) {
    const d = f.departments.find(d => d.name === deptName);
    if (d) return d.prefix;
  }
  return null;
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/stats
const getSystemStats = async (req, res) => {
  try {
    const [totalUsers, totalQuizzes, totalResults, totalCourses] = await Promise.all([
      User.countDocuments(),
      Quiz.countDocuments(),
      Result.countDocuments(),
      Course.countDocuments()
    ]);
    const students = await User.countDocuments({ role: 'student' });
    const lecturers = await User.countDocuments({ role: 'lecturer' });
    res.json({ totalUsers, totalQuizzes, totalResults, totalCourses, students, lecturers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/courses
// GET /api/admin/courses - filter by user's department
const getCourses = async (req, res) => {
  try {
    let query = {};
    // Students/Lecturers only see courses from their department
    if (req.user.role !== 'admin') {
      query.department = req.user.department;
    }

    // Ensure all existing courses have isActive field set to true
    await Course.updateMany({ isActive: { $exists: false } }, { isActive: true });

    const courses = await Course.find(query)
      .populate('lecturer', 'name email department')
      .populate('lecturers', 'name email department')
      .populate('students', 'name email studentId department');

    res.json(courses);
  } catch (err) {
    console.error('getCourses error:', err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/courses
const createCourse = async (req, res) => {
  try {
    const { name, code, description, lecturer, students, department, faculty } = req.body;
    if (!department) return res.status(400).json({ message: 'Department is required' });

    // Lecturer is optional — only validate if provided
    if (lecturer) {
      const lecturerUser = await User.findById(lecturer);
      if (!lecturerUser) return res.status(404).json({ message: 'Lecturer not found' });
    }

    // Validate faculty if provided
    if (faculty) {
      const facultyExists = await Faculty.findOne({ name: faculty });
      if (!facultyExists) return res.status(404).json({ message: 'Faculty not found' });
    }

    const course = await Course.create({
      name, code, description,
      ...(lecturer ? { lecturer } : {}),
      students,
      department,
      ...(faculty ? { faculty } : {})
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/courses/:id
const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/courses/:id - update course details
const updateCourse = async (req, res) => {
  try {
    const { name, code, description, lecturer, faculty } = req.body;

    // Check if lecturer exists
    if (lecturer) {
      const lecturerUser = await User.findById(lecturer);
      if (!lecturerUser) return res.status(404).json({ message: 'Lecturer not found' });
    }

    // Validate faculty if provided
    if (faculty) {
      const facultyExists = await Faculty.findOne({ name: faculty });
      if (!facultyExists) return res.status(404).json({ message: 'Faculty not found' });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { name, code, description, lecturer, ...(faculty ? { faculty } : {}) },
      { new: true, runValidators: true }
    ).populate('lecturer', 'name email department').populate('lecturers', 'name email department').populate('students', 'name email studentId department');

    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    // Handle duplicate key error for course code
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/courses/:id/toggle-status - toggle active/inactive
const toggleCourseStatus = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.isActive = !course.isActive;
    await course.save();

    // Fetch and populate the updated course
    const updated = await Course.findById(req.params.id)
      .populate('lecturer', 'name email department')
      .populate('lecturers', 'name email department')
      .populate('students', 'name email studentId department');

    if (!updated) return res.status(404).json({ message: 'Course not found after update' });
    res.json(updated);
  } catch (err) {
    console.error('Toggle course status error:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/all-results  — Quiz Attempt Logs
const getAllResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate('student', 'name email studentId role')
      .populate('quiz', 'title subject')
      .sort({ submittedAt: -1 })
      .limit(50);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/recent-activity  — Recent Activities (quiz submissions + quiz creations)
const getRecentActivity = async (req, res) => {
  try {
    // Recent quiz submissions by students
    const recentResults = await Result.find()
      .populate('student', 'name role')
      .populate('quiz', 'title subject')
      .sort({ submittedAt: -1 })
      .limit(10);

    // Recent quizzes created by lecturers
    const recentQuizzes = await Quiz.find()
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(10);

    // Merge and format into unified activity list
    const activities = [
      ...recentResults.map(r => ({
        name:     r.student?.name || 'Unknown',
        role:     r.student?.role || 'student',
        activity: r.score === r.totalMarks ? 'Completed quiz' : 'Submitted quiz',
        module:   r.quiz?.title || 'Unknown Quiz',
        time:     r.submittedAt
      })),
      ...recentQuizzes.map(q => ({
        name:     q.createdBy?.name || 'Unknown',
        role:     q.createdBy?.role || 'lecturer',
        activity: q.isPublished ? 'Published quiz' : 'Created quiz',
        module:   q.title,
        time:     q.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 15);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/edit
const editUser = async (req, res) => {
  try {
    const { name, email, department, studentId } = req.body;

    // Validate student ID prefix matches department (dynamic)
    const targetUser = await User.findById(req.params.id);
    if (targetUser && targetUser.role === 'student' && studentId && department) {
      const requiredPrefix = await getDeptPrefix(department);
      if (requiredPrefix && !studentId.toUpperCase().startsWith(requiredPrefix)) {
        return res.status(400).json({
          message: `Student ID must start with "${requiredPrefix}" for ${department} department`
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, department, studentId },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/toggle-status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    const updated = await User.findById(req.params.id).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/settings
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/settings
const updateSettings = async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    Object.assign(settings, req.body);
    settings.updatedAt = new Date();
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/notifications — get latest 10 unread notifications (respecting user preferences)
const getNotifications = async (req, res) => {
  try {
    // Get user notification preferences from settings
    const settings = await Settings.getInstance();
    const notifPrefs = settings.notifications || {};

    // Map notification types to preference keys
    const typeToPreferenceMap = {
      'user_registered': 'appNewStudents', // For students
      'quiz_submitted': 'appQuizComplete',
      'quiz_published': 'appEventReminders',
      'course_created': 'appEventReminders',
      'suspicious_activity': true // Always show security alerts
    };

    // Get all notifications
    let notifications = await Notification.find()
      .populate('relatedUserId', 'name email')
      .populate('relatedQuizId', 'title')
      .populate('relatedCourseId', 'name')
      .sort({ createdAt: -1 })
      .limit(20); // Get more to filter

    // Filter based on user preferences
    notifications = notifications.filter(notif => {
      const preferenceKey = typeToPreferenceMap[notif.type];

      // Always show if no preference mapping or if preference is enabled
      if (preferenceKey === true) return true;
      if (!preferenceKey) return true;

      // Check if user has enabled this notification type
      return notifPrefs[preferenceKey] !== false;
    });

    // Return top 10 after filtering
    res.json(notifications.slice(0, 10));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/notifications/:id/read — mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/notifications/mark-all-read
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({}, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/courses/:id - single course detail
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('lecturer', 'name email department')
      .populate('lecturers', 'name email department')
      .populate('students', 'name email studentId department');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/courses/:id/lecturers - assign lecturer to course
const assignCourseLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const lecturer = await User.findById(lecturerId);
    if (!lecturer || lecturer.role !== 'lecturer')
      return res.status(404).json({ message: 'Lecturer not found' });

    if (!course.lecturers.map(l => l.toString()).includes(lecturerId)) {
      course.lecturers.push(lecturerId);
      await course.save();
    }
    const updated = await Course.findById(course._id)
      .populate('lecturer', 'name email department')
      .populate('lecturers', 'name email department')
      .populate('students', 'name email studentId department');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/courses/:id/lecturers/:lecturerId
const removeCourseLecturer = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.lecturers = course.lecturers.filter(l => l.toString() !== req.params.lecturerId);
    await course.save();
    const updated = await Course.findById(course._id)
      .populate('lecturer', 'name email department')
      .populate('lecturers', 'name email department')
      .populate('students', 'name email studentId department');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/courses/:id/enroll - enroll a student into a course
const enrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body; // MongoDB _id of the student
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student')
      return res.status(404).json({ message: 'Student not found' });

    // Department must match
    if (student.department !== course.department)
      return res.status(400).json({
        message: `Student's department (${student.department}) does not match course department (${course.department})`
      });

    // Student ID prefix must match (dynamic)
    const requiredPrefix = await getDeptPrefix(course.department);
    if (requiredPrefix && student.studentId && !student.studentId.toUpperCase().startsWith(requiredPrefix))
      return res.status(400).json({
        message: `Student ID must start with "${requiredPrefix}" for ${course.department}`
      });

    if (course.students.map(s => s.toString()).includes(studentId))
      return res.status(400).json({ message: 'Student is already enrolled in this course' });

    course.students.push(studentId);
    await course.save();

    const updated = await Course.findById(req.params.id)
      .populate('lecturer', 'name email department')
      .populate('students', 'name email studentId department');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/courses/:id/students/:studentId - unenroll a student
const unenrollStudent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.students = course.students.filter(s => s.toString() !== req.params.studentId);
    await course.save();

    const updated = await Course.findById(req.params.id)
      .populate('lecturer', 'name email department')
      .populate('students', 'name email studentId department');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/sync-enrollments - one-time migration to enroll existing students
const syncEnrollments = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' });
    let enrolledCount = 0;

    for (const student of students) {
      if (!student.department) continue;

      const deptCourses = await Course.find({ department: student.department });
      for (const course of deptCourses) {
        if (!course.students.includes(student._id)) {
          course.students.push(student._id);
          await course.save();
          enrolledCount++;
        }
      }
    }

    res.json({
      message: 'Sync complete',
      studentsProcessed: students.length,
      enrollmentsCreated: enrolledCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/fix-enrollments - fix misplaced students (remove from wrong dept, add to correct dept)
const fixEnrollments = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' });
    const courses = await Course.find().lean();
    let removed = 0;
    let added = 0;

    // First pass: remove students from wrong department courses
    for (const course of courses) {
      const originalLength = course.students.length;
      course.students = course.students.filter(studentId => {
        const student = students.find(s => s._id.toString() === studentId.toString());
        return student && student.department === course.department;
      });

      if (course.students.length < originalLength) {
        removed += originalLength - course.students.length;
        await Course.findByIdAndUpdate(course._id, { students: course.students });
      }
    }

    // Second pass: add students to correct department courses
    for (const student of students) {
      if (!student.department) continue;

      const deptCourses = await Course.find({ department: student.department });
      for (const course of deptCourses) {
        const isEnrolled = course.students.some(id => id.toString() === student._id.toString());
        if (!isEnrolled) {
          course.students.push(student._id);
          await course.save();
          added++;
        }
      }
    }

    res.json({
      message: 'Enrollments fixed',
      studentsProcessed: students.length,
      removedFromWrongDept: removed,
      addedToCorrectDept: added
    });
  } catch (err) {
    console.error('Fix enrollments error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUsers, deleteUser, updateUserRole, editUser, getSystemStats, getCourses, createCourse, deleteCourse, updateCourse, toggleCourseStatus, getAllResults, getRecentActivity, toggleUserStatus, getSettings, updateSettings, getNotifications, markNotificationRead, markAllNotificationsRead, syncEnrollments, fixEnrollments, enrollStudent, unenrollStudent, getCourseById, assignCourseLecturer, removeCourseLecturer };
