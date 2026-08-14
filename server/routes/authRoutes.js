const express = require('express');
const { register, login, verifyEmail, resendOtp, getMe, googleAuth, refreshSession } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/google', googleAuth);
router.post('/refresh-session', refreshSession);
router.get('/me', protect, getMe);

module.exports = router;
