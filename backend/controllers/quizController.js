const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const Course = require('../models/Course');
const Module = require('../models/Module');
const QuestionFactory = require('../patterns/factory/QuestionFactory');
const ScoringContext = require('../patterns/strategy/ScoringStrategy');
const { createNotification } = require('../utils/notificationHelper');

// POST /api/quizzes - lecturer creates quiz
const createQuiz = async (req, res) => {
  try {
    const { title, subject, description, timeLimit, randomizeQuestions, questions, startDate, endDate } = req.body;
    const builtQuestions = questions.map(q => QuestionFactory.create(q.type, q));
    const quiz = await Quiz.create({
      title, subject, description, timeLimit, randomizeQuestions,
      questions: builtQuestions, startDate, endDate,
      department: req.user.department, // auto-assign lecturer's department
      createdBy: req.user._id
    });
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/quizzes - get all published quizzes (student) or own quizzes (lecturer) or all quizzes (admin)
const getQuizzes = async (req, res) => {
  try {
    console.log('getQuizzes called by:', req.user.email, 'Role:', req.user.role);
    let quizzes;
    if (req.user.role === 'admin') {
      console.log('Fetching all quizzes for admin');
      quizzes = await Quiz.find({}).select('-questions.correctAnswer');
      console.log('Total quizzes found:', quizzes.length);
    } else if (req.user.role === 'lecturer') {
      console.log('Fetching lecturer quizzes for:', req.user._id, 'Department:', req.user.department);
      quizzes = await Quiz.find({
        createdBy: req.user._id,
        department: req.user.department
      }).select('-questions.correctAnswer');
      console.log('Lecturer quizzes found:', quizzes.length);
    } else if (req.user.role === 'student') {
      console.log('Fetching student quizzes for department:', req.user.department);
      quizzes = await Quiz.find({
        isPublished: true,
        department: req.user.department
      })
        .select('-questions.correctAnswer')
        .populate('createdBy', 'name')
        .populate('assignedCourses', 'name code');
      console.log('Student quizzes found:', quizzes.length);
    } else {
      quizzes = [];
    }
    res.json(quizzes);
  } catch (err) {
    console.error('getQuizzes error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/quizzes/:id - get single quiz for taking
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Check department access
    if ((req.user.role === 'lecturer' || req.user.role === 'student') && quiz.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied: This quiz is not available in your department' });
    }

    // Students don't see correct answers
    if (req.user.role === 'student') {
      const safeQuiz = quiz.toObject();
      let qs = safeQuiz.questions.map(({ correctAnswer, ...rest }) => rest);
      if (safeQuiz.randomizeQuestions) {
        qs = qs.sort(() => Math.random() - 0.5);
      }
      safeQuiz.questions = qs;
      return res.json(safeQuiz);
    }
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/quizzes/:id - update quiz
const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    Object.assign(quiz, req.body);
    await quiz.save();
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/quizzes/:id
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/quizzes/:id/publish
const publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isPublished: true },
      { new: true }
    );
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz published', quiz });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/quizzes/:id/submit - student submits quiz
const submitQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Check attempts
    const previousResults = await Result.find({ student: req.user._id, quiz: req.params.id }).sort({ attempt: -1 });
    const lastAttempt = previousResults[0];
    const attemptNumber = lastAttempt ? lastAttempt.attempt + 1 : 1;

    if (quiz.urgent) {
      if (previousResults.length === 0) {
        return res.status(400).json({ message: 'Urgent reattempt is for students who previously attempted and failed.' });
      }
      if (lastAttempt && lastAttempt.passed) {
        return res.status(400).json({ message: 'You already passed this quiz.' });
      }
      if (attemptNumber > quiz.reattemptCount) {
        return res.status(400).json({ message: 'Maximum urgent reattempt attempts reached' });
      }
    } else if (!quiz.allowReattempt && previousResults.length > 0) {
      return res.status(400).json({ message: 'Reattempts not allowed for this quiz' });
    } else if (quiz.allowReattempt && attemptNumber > quiz.reattemptCount) {
      return res.status(400).json({ message: 'Maximum attempts reached' });
    }

    const { answers, timeTaken } = req.body;
    const { totalScore, gradedAnswers } = ScoringContext.scoreQuiz(quiz.questions, answers);

    const result = await Result.create({
      student: req.user._id,
      quiz: req.params.id,
      answers: gradedAnswers,
      score: totalScore,
      totalMarks: quiz.totalMarks,
      timeTaken,
      attempt: attemptNumber
    });

    // Calculate percentage for notification (mirrors pre-save hook)
    const percentage = Math.round((totalScore / quiz.totalMarks) * 100);
    const passed = percentage >= 50;

    // Notify the lecturer who owns this quiz
    await createNotification(
      'quiz_submitted',
      `${req.user.name} completed "${quiz.title}"`,
      `Score: ${totalScore}/${quiz.totalMarks} (${percentage}%) — ${passed ? 'Passed ✅' : 'Failed ❌'}`,
      req.user._id,
      quiz._id,
      null,
      quiz.createdBy  // recipientId — only this lecturer sees it
    );

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/quizzes/lecturer/notifications - get lecturer's notifications
const getLecturerNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientId: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(notifications);
  } catch (err) {
    console.error('getLecturerNotifications error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/quizzes/:id/reattempt - lecturer enables reattempt for failed students
const enableReattempt = async (req, res) => {
  try {
    const { allowReattempt, reattemptCount, urgent } = req.body;
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    quiz.allowReattempt = allowReattempt !== undefined ? allowReattempt : quiz.allowReattempt;
    quiz.reattemptCount = reattemptCount !== undefined ? reattemptCount : quiz.reattemptCount;
    quiz.urgent = urgent !== undefined ? urgent : quiz.urgent;
    await quiz.save();

    // Notify failed students if reattempt is enabled
    if (allowReattempt) {
      const failedResults = await Result.find({ quiz: req.params.id, passed: false });
      const studentIds = failedResults.map(r => r.student);
      await createNotification(
        'quiz_reattempt',
        `Reattempt enabled for "${quiz.title}"`,
        `You can now retake this quiz. Max attempts: ${reattemptCount}`,
        null,
        quiz._id,
        studentIds
      );
    }

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/quizzes/lecturer/notifications/:id/read - mark lecturer notification as read
const markLecturerNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/quizzes/lecturer/notifications/mark-all-read - mark all lecturer notifications as read
const markAllLecturerNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/quizzes/lecturer/info - lecturer profile info (courses, modules, students)
const getLecturerInfo = async (req, res) => {
  try {
    const lecturerId = req.user._id;

    // Actual modules where this lecturer is assigned
    const modules = await Module.find({ lecturers: lecturerId })
      .populate('course', 'name code')
      .populate('students', 'name email studentId');

    // Courses derived from those modules (for context)
    const courseIds = [...new Set(modules.map(m => m.course?._id?.toString()).filter(Boolean))];
    const courses = await Course.find({ _id: { $in: courseIds } })
      .populate('students', 'name email studentId')
      .select('name code students');

    // Unique students across all assigned modules
    const studentMap = {};
    modules.forEach(m => {
      (m.students || []).forEach(s => {
        studentMap[s._id] = s;
      });
    });
    const students = Object.values(studentMap);

    res.json({
      department: req.user.department,
      modules: modules.map(m => ({
        _id: m._id,
        name: m.name,
        description: m.description,
        courseName: m.course?.name || '',
        courseCode: m.course?.code || '',
        students: (m.students || []).map(s => ({
          _id: s._id, name: s.name, email: s.email, studentId: s.studentId
        }))
      })),
      // courses kept for backward compat (used for student count subtitle)
      courses: courses.map(c => ({ _id: c._id, name: c.name, code: c.code })),
      students
    });
  } catch (err) {
    console.error('getLecturerInfo error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createQuiz, getQuizzes, getQuizById, updateQuiz, deleteQuiz, publishQuiz, submitQuiz, getLecturerNotifications, markLecturerNotificationAsRead, markAllLecturerNotificationsAsRead, getLecturerInfo, enableReattempt };
