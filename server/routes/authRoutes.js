import express from 'express';
const router = express.Router();
import {
  completeRegistration,
  deleteAccount,
  googleAuth,
  loginUser,
  registerUser,
  resendRegistrationOtp,
  startRegistration,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  updateProfilePhoto,
  changePassword,
  removeProfilePhoto,
  verifyEmailOtp,
  verifyResetOtp,
} from '../controllers/authController.js';
import { protect } from '../middleware/roleMiddleware.js';
import { authRateLimit, otpRateLimit } from '../middleware/rateLimitMiddleware.js';
import { parseSingleImage } from '../middleware/uploadMiddleware.js';

router.post('/register/start', otpRateLimit, startRegistration);
router.post('/register/resend', otpRateLimit, resendRegistrationOtp);
router.post('/register/verify-email', otpRateLimit, verifyEmailOtp);
router.post('/register/complete', otpRateLimit, completeRegistration);
router.post('/register', otpRateLimit, registerUser);
router.post('/login', authRateLimit, loginUser);
router.post('/google', authRateLimit, googleAuth);
router.post('/forgot-password', otpRateLimit, forgotPassword);
router.post('/verify-otp', otpRateLimit, verifyResetOtp);
router.post('/reset-password', otpRateLimit, resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/profile/photo', protect, parseSingleImage, updateProfilePhoto);
router.delete('/profile/photo', protect, removeProfilePhoto);
router.put('/password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

export default router;


