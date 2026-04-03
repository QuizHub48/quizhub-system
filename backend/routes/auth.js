const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, forgotPassword, verifyOtp, getDepartments } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/departments', getDepartments);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);

module.exports = router;
