const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  department: { type: String, required: true },
  faculty: { type: String },                                                  // faculty name
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },           // legacy single
  lecturers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],        // multi-lecturer
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
