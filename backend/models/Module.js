const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lecturers:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  students:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  order:       { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Module', moduleSchema);
