const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Base User - Encapsulation + Inheritance base
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'lecturer', 'admin'], default: 'student' },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  // Student-specific
  studentId: { type: String },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  // Lecturer-specific
  department: { type: String },
  // OTP for password reset
  otpCode:   { type: String },
  otpExpiry: { type: Date },
  // Flag set after OTP verification — allows password change without current password
  passwordResetAllowed: { type: Boolean, default: false },
  passwordResetExpiry:  { type: Date },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
