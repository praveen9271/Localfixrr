const express = require('express');
const router = express.Router();
const {
  completeRegistration,
  loginUser,
  registerUser,
  resendRegistrationOtp,
  startRegistration,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  verifyEmailOtp,
  verifyResetOtp,
} = require('../controllers/authController');
const { protect } = require('../middleware/roleMiddleware');
const { authRateLimit, otpRateLimit } = require('../middleware/rateLimitMiddleware');

router.post('/register/start', otpRateLimit, startRegistration);
router.post('/register/resend', otpRateLimit, resendRegistrationOtp);
router.post('/register/verify-email', otpRateLimit, verifyEmailOtp);
router.post('/register/complete', otpRateLimit, completeRegistration);
router.post('/register', otpRateLimit, registerUser);
router.post('/login', authRateLimit, loginUser);
router.post('/forgot-password', otpRateLimit, forgotPassword);
router.post('/verify-otp', otpRateLimit, verifyResetOtp);
router.post('/reset-password', otpRateLimit, resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;


