const mongoose = require('mongoose');

// Question sub-schema - Abstraction (base question, extended by type)
const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'true_false', 'fill_blank'], required: true },
  questionText: { type: String, required: true },
  options: [{ type: String }],         // MCQ options
  correctAnswer: { type: String, required: true },
  marks: { type: Number, default: 1 }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String },
  department: { type: String, required: true }, // department this quiz belongs to
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [questionSchema],
  timeLimit: { type: Number, required: true }, // minutes
  totalMarks: { type: Number, default: 0 },
  passingMarks: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  randomizeQuestions: { type: Boolean, default: true },
  assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  startDate: { type: Date },
  endDate: { type: Date },
  allowReattempt: { type: Boolean, default: false },
  reattemptCount: { type: Number, default: 1 }, // max reattempts allowed
  urgent: { type: Boolean, default: false }, // mark as urgent
  createdAt: { type: Date, default: Date.now }
});

// Auto-calculate totalMarks
quizSchema.pre('save', function (next) {
  this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  this.passingMarks = Math.ceil(this.totalMarks * 0.5);
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);
