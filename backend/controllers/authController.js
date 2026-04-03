const User = require('../models/User');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const jwt = require('jsonwebtoken');
const { createNotification } = require('../utils/notificationHelper');
const { sendOtpEmail } = require('../utils/emailHelper');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// GET /api/auth/departments - public: departments from Faculty collection (with faculty + prefix)
const getDepartments = async (req, res) => {
  try {
    const faculties = await Faculty.find().sort('name');
    // Return flat list: [{ name, prefix, faculty }]
    const depts = [];
    faculties.forEach(f => {
      f.departments.forEach(d => {
        depts.push({ name: d.name, prefix: d.prefix, faculty: f.name });
      });
    });
    res.json(depts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, studentId, department } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    // Validate student ID prefix matches department (dynamic from Faculty collection)
    if (role === 'student' && studentId && department) {
      const faculties = await Faculty.find();
      let requiredPrefix = null;
      for (const f of faculties) {
        const dept = f.departments.find(d => d.name === department);
        if (dept) { requiredPrefix = dept.prefix; break; }
      }
      if (requiredPrefix && !studentId.toUpperCase().startsWith(requiredPrefix)) {
        return res.status(400).json({
          message: `Student ID must start with "${requiredPrefix}" for ${department} department`
        });
      }
    }

    const user = await User.create({ name, email, password, role, studentId, department });

    // Auto-enroll students in their department's courses
    if (role === 'student' && department) {
      const deptCourses = await Course.find({ department });
      for (const course of deptCourses) {
        if (!course.students.includes(user._id)) {
          course.students.push(user._id);
          await course.save();
        }
      }
    }

    // Create notification for new user registration
    await createNotification(
      'user_registered',
      `New ${role} registered`,
      `${user.name} (${user.email}) joined as a ${role}`,
      user._id
    );

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      profilePicture: user.profilePicture,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log('Login attempt for:', email);
    console.log('User found:', !!user);
    if (user) {
      console.log('User role:', user.role);
      console.log('User department:', user.department);
      console.log('Password match:', await user.matchPassword(password));
    }
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic profile fields
    if (req.body.name && typeof req.body.name === 'string') {
      user.name = req.body.name.trim();
    }

    // Handle email change - check if email is already in use
    if (req.body.email && typeof req.body.email === 'string') {
      const emailLower = req.body.email.toLowerCase().trim();
      if (!emailLower.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      if (emailLower !== user.email.toLowerCase()) {
        const existingUser = await User.findOne({ email: emailLower });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      user.email = emailLower;
    }

    if (req.body.bio && typeof req.body.bio === 'string') {
      user.bio = req.body.bio.trim();
    }

    // Handle profile picture - limit to 2MB to avoid database issues
    if (req.body.profilePicture && typeof req.body.profilePicture === 'string') {
      console.log('Updating profile picture, length:', req.body.profilePicture.length);

      // Check if it's a base64 data URL
      if (req.body.profilePicture.startsWith('data:image')) {
        const base64Part = req.body.profilePicture.split(',')[1] || '';
        console.log('Base64 part length:', base64Part.length);
        if (base64Part.length > 2097152) { // 2MB in bytes
          console.log('Base64 too large');
          return res.status(400).json({ message: 'Profile picture is too large. Please use a smaller image.' });
        }
      } else if (req.body.profilePicture.length > 2097152) {
        console.log('Image data too large');
        return res.status(400).json({ message: 'Profile picture is too large. Please use a smaller image.' });
      }

      user.profilePicture = req.body.profilePicture;
      console.log('Profile picture updated successfully');
    }

    // Handle password change with verification
    if (req.body.password && typeof req.body.password === 'string') {
      const otpResetValid = user.passwordResetAllowed && user.passwordResetExpiry > new Date();

      if (req.body.skipCurrentPassword && otpResetValid) {
        // Came through OTP verification — no current password needed
        user.password             = req.body.password;
        user.passwordResetAllowed = false;
        user.passwordResetExpiry  = undefined;
      } else {
        if (!req.body.currentPassword || typeof req.body.currentPassword !== 'string') {
          return res.status(400).json({ message: 'Current password is required to change password' });
        }
        const isPasswordMatch = await user.matchPassword(req.body.currentPassword);
        if (!isPasswordMatch) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
        user.password = req.body.password;
      }
    }

    // Ensure name and email are not empty before saving
    if (!user.name || !user.email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    await user.save();
    res.json({ message: 'Profile updated', user: { _id: user._id, name: user.name, email: user.email, bio: user.bio, profilePicture: user.profilePicture, role: user.role } });
  } catch (err) {
    console.error('Profile update error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: err.message || 'Failed to update profile' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with that email' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otpCode   = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // In development, skip email and return OTP directly for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n==== DEV MODE OTP for ${email}: ${otp} ====\n`);
      return res.json({ message: 'OTP sent to your email', devOtp: otp });
    }

    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Check email configuration.' });
  }
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.otpCode || user.otpCode !== otp)
      return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpiry < new Date())
      return res.status(400).json({ message: 'OTP has expired' });

    // Clear OTP, set password-reset window (10 min), and log user in
    user.otpCode              = undefined;
    user.otpExpiry            = undefined;
    user.passwordResetAllowed = true;
    user.passwordResetExpiry  = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile, forgotPassword, verifyOtp, getDepartments };
