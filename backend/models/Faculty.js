const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  prefix: { type: String, required: true, uppercase: true },
});

const facultySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  departments: [departmentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);
