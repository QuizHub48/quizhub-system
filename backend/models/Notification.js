const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  icon: { type: String, default: '📢' }, // emoji icon
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['user_registered', 'quiz_submitted', 'suspicious_activity', 'course_created', 'quiz_published'], default: 'user_registered' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // user who triggered the notification
  relatedQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  relatedCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // targeted recipient (e.g. lecturer)
});

module.exports = mongoose.model('Notification', notificationSchema);
