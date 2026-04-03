const Result = require('../models/Result');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Course = require('../models/Course');

// GET /api/results/my - student's own results (only from their department)
const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate({
        path: 'quiz',
        select: 'title subject totalMarks department',
        match: { department: req.user.department } // only include quizzes from student's department
      })
      .sort({ submittedAt: -1 });
    // Filter out results where quiz is null (from other departments)
    const filteredResults = results.filter(r => r.quiz !== null);
    res.json(filteredResults);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/results/:id - single result detail
const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('quiz', 'title subject totalMarks passingMarks')
      .populate('student', 'name email');
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/results/quiz/:quizId - all results for a quiz (lecturer - only their department)
const getQuizResults = async (req, res) => {
  try {
    // Verify quiz belongs to lecturer's department
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz || quiz.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const results = await Result.find({ quiz: req.params.quizId })
      .populate('student', 'name email studentId')
      .sort({ score: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/results/leaderboard/:quizId
const getLeaderboard = async (req, res) => {
  try {
    const results = await Result.find({ quiz: req.params.quizId })
      .populate('student', 'name profilePicture')
      .populate('quiz', 'title subject')
      .sort({ score: -1, timeTaken: 1 })
      .limit(10);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/results/analytics/:quizId - quiz analytics for lecturer
const getQuizAnalytics = async (req, res) => {
  try {
    const results = await Result.find({ quiz: req.params.quizId });
    if (!results.length) return res.json({ message: 'No results yet' });

    const scores = results.map(r => r.percentage);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const passed = results.filter(r => r.passed).length;

    res.json({
      totalAttempts: results.length,
      averageScore: Math.round(avg),
      passRate: Math.round((passed / results.length) * 100),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/results/leaderboard-overall - all students ranked by average score
const getOverallLeaderboard = async (req, res) => {
  try {
    const requestingUser = req.user;
    const department = requestingUser?.department || null;

    const results = await Result.find()
      .populate('student', 'name email department')
      .populate('quiz', 'title');

    const studentMap = {};
    results.forEach(r => {
      if (!r.student) return;
      // Filter by department if the requester has one (i.e. is a student)
      if (department && r.student.department !== department) return;
      const id = r.student._id.toString();
      if (!studentMap[id]) {
        studentMap[id] = {
          student: r.student,
          totalPercentage: 0,
          quizzesTaken: 0,
          passed: 0
        };
      }
      studentMap[id].totalPercentage += r.percentage;
      studentMap[id].quizzesTaken += 1;
      if (r.passed) studentMap[id].passed += 1;
    });

    const ranked = Object.values(studentMap)
      .map(item => ({
        ...item,
        averageScore: Math.round(item.totalPercentage / item.quizzesTaken)
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    res.json({ rankings: ranked, department });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyResults, getResultById, getQuizResults, getLeaderboard, getQuizAnalytics, getOverallLeaderboard };
