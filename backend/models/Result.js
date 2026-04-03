const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId },
  questionText: { type: String },
  selectedAnswer: { type: String },
  correctAnswer: { type: String },
  isCorrect: { type: Boolean },
  marks: { type: Number }
});

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [answerSchema],
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number },
  passed: { type: Boolean },
  timeTaken: { type: Number }, // seconds
  attempt: { type: Number, default: 1 }, // attempt number
  submittedAt: { type: Date, default: Date.now }
});

resultSchema.pre('save', function (next) {
  this.percentage = Math.round((this.score / this.totalMarks) * 100);
  this.passed = this.percentage >= 50;
  next();
});

module.exports = mongoose.model('Result', resultSchema);
