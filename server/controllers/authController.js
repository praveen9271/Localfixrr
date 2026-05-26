import User from '../models/User.js';
import Provider from '../models/Provider.js';
import PendingRegistration from '../models/PendingRegistration.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { normalizeServiceCategory } from '../config/serviceCategories.js';
import {
  OTP_MAX_ATTEMPTS,
  OTP_MAX_RESENDS,
  OTP_RESEND_SECONDS,
  canResend,
  generateOtp,
  getOtpExpiry,
  hashOtp,
  isOtpMatch,
  sendEmailOtp,
  sendResetPasswordOtp,
} from '../services/otpService.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'localfixr-dev-secret';

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, getJwtSecret(), {
    expiresIn: '30d'
  });
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeText = (value) => String(value || '').trim();
const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);
const isStrongPassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(password || ''));
const RESET_TOKEN_TTL = '10m';
const DATABASE_UNAVAILABLE_MESSAGE =
  'Database connection is unavailable. Check MongoDB Atlas Network Access IP whitelist and MONGODB_URI, then restart the server.';

const isDatabaseConnectionError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.name === 'MongooseServerSelectionError' ||
    error?.name === 'MongoServerSelectionError' ||
    error?.name === 'MongoNetworkError' ||
    message.includes('buffering timed out') ||
    message.includes('cannot call') ||
    message.includes('ssl') ||
    message.includes('tls') ||
    message.includes('mongodb atlas')
  );
};

const requireDatabaseConnection = (res) => {
  if (mongoose.connection.readyState === 1) return true;

  res.status(503).json({
    success: false,
    message: DATABASE_UNAVAILABLE_MESSAGE,
  });
  return false;
};

const formatUser = (user, provider) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  role: user.role,
  isActive: user.isActive,
  providerId: provider?._id || user.providerProfile || null,
});

const validateRegistrationPayload = (body) => {
  const normalizedName = normalizeText(body.name);
  const normalizedEmail = normalizeEmail(body.email);
  const normalizedPhone = normalizePhone(body.phone);
  const normalizedAddress = normalizeText(body.address);
  const password = String(body.password || '');
  const confirmPassword = String(body.confirmPassword || '');

  if (!normalizedName || !normalizedEmail || !normalizedPhone || !normalizedAddress || !password || !confirmPassword) {
    return { message: 'Please fill in all required fields' };
  }
  if (!isValidEmail(normalizedEmail)) return { message: 'Please provide a valid email address' };
  if (!isValidPhone(normalizedPhone)) return { message: 'Please provide a valid 10-digit phone number' };
  if (password.length < 6) return { message: 'Password must be at least 6 characters' };
  if (password !== confirmPassword) return { message: 'Passwords do not match' };

  const userRole = ['user', 'service_provider'].includes(body.role) ? body.role : 'user';
  const serviceCategory = normalizeServiceCategory(body.serviceCategory);

  if (userRole === 'service_provider' && !serviceCategory) {
    return { message: 'Please select a valid service work type' };
  }

  return {
    value: {
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      address: normalizedAddress,
      password,
      role: userRole,
      businessName: normalizeText(body.businessName),
      serviceCategory,
    },
  };
};

const getPending = async (email, phone) => {
  return PendingRegistration.findOne({
    email: normalizeEmail(email),
    phone: normalizePhone(phone),
  }).select('+emailOtpHash +passwordHash');
};

const sendPendingEmailOtp = async (pending) => {
  const devOtps = {};
  const emailOtp = generateOtp();

  pending.emailOtpHash = hashOtp(emailOtp, pending.email);
  pending.emailAttempts = 0;
  await sendEmailOtp({ email: pending.email, name: pending.name, otp: emailOtp });
  if (process.env.NODE_ENV !== 'production') devOtps.emailOtp = emailOtp;

  pending.lastSentAt = new Date();
  pending.resendCount += 1;
  pending.expiresAt = getOtpExpiry();
  await pending.save();

  return devOtps;
};

// @desc    Start verified registration and send OTPs
// @route   POST /api/auth/register/start
// @access  Public
const startRegistration = async (req, res) => {
  try {
    const validation = validateRegistrationPayload(req.body);
    if (validation.message) return res.status(400).json({ success: false, message: validation.message });
    if (!requireDatabaseConnection(res)) return;

    const payload = validation.value;

    const existingUser = await User.findOne({
      $or: [{ email: payload.email }, { phone: payload.phone }],
    });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account already exists with this email or phone number' });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const emailOtp = generateOtp();

    const pending = await PendingRegistration.findOneAndUpdate(
      { email: payload.email, phone: payload.phone },
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        passwordHash,
        role: payload.role,
        businessName: payload.businessName,
        serviceCategory: payload.serviceCategory,
        emailOtpHash: hashOtp(emailOtp, payload.email),
        emailVerified: false,
        emailAttempts: 0,
        resendCount: 1,
        lastSentAt: new Date(),
        expiresAt: getOtpExpiry(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await sendEmailOtp({ email: pending.email, name: pending.name, otp: emailOtp });

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email.',
      email: pending.email,
      phone: pending.phone,
      expiresAt: pending.expiresAt,
      ...(process.env.NODE_ENV !== 'production' ? { devOtps: { emailOtp } } : {}),
    });
  } catch (error) {
    console.error('Start registration error:', error);
    res.status(500).json({ success: false, message: 'Unable to start registration', error: error.message });
  }
};

// @desc    Resend registration OTP
// @route   POST /api/auth/register/resend
// @access  Public
const resendRegistrationOtp = async (req, res) => {
  try {
    if (!requireDatabaseConnection(res)) return;

    const { email, phone } = req.body;
    const pending = await getPending(email, phone);
    if (!pending) return res.status(404).json({ success: false, message: 'Registration session not found. Please start again.' });

    if (pending.resendCount >= OTP_MAX_RESENDS) {
      return res.status(429).json({ success: false, message: 'Maximum OTP resend limit reached. Please start registration again.' });
    }
    if (!canResend(pending)) {
      return res.status(429).json({ success: false, message: `Please wait ${OTP_RESEND_SECONDS} seconds before requesting another OTP.` });
    }

    const devOtps = await sendPendingEmailOtp(pending);

    res.status(200).json({
      success: true,
      message: 'Verification code resent.',
      expiresAt: pending.expiresAt,
      ...(process.env.NODE_ENV !== 'production' ? { devOtps } : {}),
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Unable to resend OTP', error: error.message });
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    if (!requireDatabaseConnection(res)) return;

    const { email, phone, otp } = req.body;
    const pending = await getPending(email, phone);
    if (!pending) return res.status(404).json({ success: false, message: 'Registration session not found. Please start again.' });
    if (pending.expiresAt <= new Date()) return res.status(410).json({ success: false, message: 'OTP expired. Please resend a new code.' });

    if (pending.emailVerified) {
      return res.status(200).json({ success: true, message: 'Email is already verified.', emailVerified: pending.emailVerified });
    }
    if (pending.emailAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please resend OTP.' });
    }
    if (!otp || !isOtpMatch(String(otp).trim(), pending.email, pending.emailOtpHash)) {
      pending.emailAttempts += 1;
      await pending.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    pending.emailVerified = true;
    await pending.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      emailVerified: pending.emailVerified,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Unable to verify OTP', error: error.message });
  }
};

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }
    if (!requireDatabaseConnection(res)) return;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No LocalFixr account exists with this email address' });
    }
    if (!user.isActive || user.isBlocked) {
      return res.status(403).json({ success: false, message: 'This account is inactive or blocked' });
    }

    const otp = generateOtp();
    user.resetOTP = hashOtp(otp, user.email);
    user.resetOTPExpire = getOtpExpiry();
    user.resetOTPAttempts = 0;
    await user.save({ validateBeforeSave: false });

    await sendResetPasswordOtp({ email: user.email, name: user.name, otp });

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email.',
      email: user.email,
      expiresAt: user.resetOTPExpire,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send password reset OTP', error: error.message });
  }
};

// @desc    Verify password reset OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyResetOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    if (!email || !isValidEmail(email) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email and 6-digit OTP' });
    }
    if (!requireDatabaseConnection(res)) return;

    const user = await User.findOne({ email }).select('+resetOTP');
    if (!user || !user.resetOTP || !user.resetOTPExpire) {
      return res.status(400).json({ success: false, message: 'Password reset session not found. Please request a new OTP.' });
    }
    if (user.resetOTPExpire <= new Date()) {
      user.resetOTP = undefined;
      user.resetOTPExpire = undefined;
      user.resetOTPAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return res.status(410).json({ success: false, message: 'OTP expired. Please request a new code.' });
    }
    if (user.resetOTPAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
    }
    if (!isOtpMatch(otp, user.email, user.resetOTP)) {
      user.resetOTPAttempts += 1;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password_reset' },
      getJwtSecret(),
      { expiresIn: RESET_TOKEN_TTL },
    );

    return res.status(200).json({
      success: true,
      message: 'OTP verified. You can now reset your password.',
      resetToken,
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return res.status(500).json({ success: false, message: 'Unable to verify OTP', error: error.message });
  }
};

// @desc    Reset password after OTP verification
// @route   POST /api/auth/reset-password
// @access  Public with reset token
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    if (!resetToken) {
      return res.status(400).json({ success: false, message: 'Reset token is required. Please verify your OTP again.' });
    }
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please fill in both password fields' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number',
      });
    }
    if (!requireDatabaseConnection(res)) return;

    let decoded;
    try {
      decoded = jwt.verify(resetToken, getJwtSecret());
    } catch {
      return res.status(401).json({ success: false, message: 'Reset session expired. Please request a new OTP.' });
    }
    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({ success: false, message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.id).select('+password +resetOTP');
    if (!user || !user.resetOTP || !user.resetOTPExpire || user.resetOTPExpire <= new Date()) {
      return res.status(400).json({ success: false, message: 'Password reset session expired. Please request a new OTP.' });
    }

    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
    user.resetOTPAttempts = 0;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Unable to reset password', error: error.message });
  }
};

// @desc    Complete verified registration and create user
// @route   POST /api/auth/register/complete
// @access  Public
const completeRegistration = async (req, res) => {
  try {
    if (!requireDatabaseConnection(res)) return;

    const { email, phone } = req.body;
    const pending = await getPending(email, phone);
    if (!pending) return res.status(404).json({ success: false, message: 'Registration session not found. Please start again.' });
    if (!pending.emailVerified) {
      return res.status(400).json({ success: false, message: 'Please verify your email before creating your account.' });
    }
    if (pending.role === 'service_provider' && !normalizeServiceCategory(pending.serviceCategory)) {
      return res.status(400).json({ success: false, message: 'Please restart registration and select a valid service work type.' });
    }

    const existingUser = await User.findOne({
      $or: [{ email: pending.email }, { phone: pending.phone }],
    });
    if (existingUser) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(409).json({ success: false, message: 'An account already exists with this email or phone number' });
    }

    const user = new User({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      address: pending.address,
      password: pending.passwordHash,
      role: pending.role,
      isEmailVerified: true,
    });
    user.$locals.passwordAlreadyHashed = true;
    await user.save();

    let provider = null;
    if (pending.role === 'service_provider') {
      provider = await Provider.create({
        user: user._id,
        businessName: pending.businessName || `${pending.name}'s Services`,
        skills: [normalizeServiceCategory(pending.serviceCategory)],
        serviceAreas: [pending.address].filter(Boolean),
      });
      user.providerProfile = provider._id;
      await user.save();
    }

    await PendingRegistration.deleteOne({ _id: pending._id });

    const token = generateToken(user._id, user.role);
    res.status(201).json({
      success: true,
      message: 'Account created and verified successfully.',
      token,
      user: formatUser(user, provider),
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ success: false, message: 'Unable to complete registration', error: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    if (!requireDatabaseConnection(res)) return;

    if (process.env.ALLOW_LEGACY_REGISTER !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'Please use the verified registration flow.',
      });
    }

    const {
      name,
      email,
      phone,
      address,
      password,
      confirmPassword,
      role,
      businessName,
      bio,
      skills,
      serviceAreas,
      experienceYears,
      serviceCategory,
    } = req.body;

    const normalizedName = normalizeText(name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizeText(phone);
    const normalizedAddress = normalizeText(address);

    // Validation
    if (!normalizedName || !normalizedEmail || !normalizedPhone || !normalizedAddress || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (normalizedPhone.length !== 10 || !/^[0-9]{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit phone number' });
    }

    // Validate role - only allow user or service_provider during registration
    // Admin role can only be assigned manually in database
    let userRole = 'user';
    if (role && ['user', 'service_provider'].includes(role)) {
      userRole = role;
    }
    const normalizedServiceCategory = normalizeServiceCategory(serviceCategory);
    if (userRole === 'service_provider' && !normalizedServiceCategory) {
      return res.status(400).json({ message: 'Please select a valid service work type' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      address: normalizedAddress,
      password,
      role: userRole,
      isEmailVerified: true,
    });

    let provider = null;
    if (userRole === 'service_provider') {
      provider = await Provider.create({
        user: user._id,
        businessName: normalizeText(businessName) || `${normalizedName}'s Services`,
        bio: normalizeText(bio),
        skills: Array.isArray(skills) && skills.length ? skills.map(normalizeServiceCategory).filter(Boolean) : [normalizedServiceCategory],
        serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [normalizedAddress].filter(Boolean),
        experienceYears: Number(experienceYears) || 0,
      });
      user.providerProfile = provider._id;
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: formatUser(user, provider)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: `Registration failed: ${error.message || 'Unknown server error'}`,
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    if (!requireDatabaseConnection(res)) return;

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Validation
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists (include password for comparison)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive || user.isBlocked) {
      return res.status(403).json({ message: 'Your account is blocked or inactive' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id, user.role);
    const provider = user.role === 'service_provider'
      ? await Provider.findOne({ user: user._id })
      : null;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUser(user, provider)
    });
  } catch (error) {
    console.error('Login error:', error);
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json({
        success: false,
        message: DATABASE_UNAVAILABLE_MESSAGE,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const provider = user.role === 'service_provider'
      ? await Provider.findOne({ user: user._id })
      : null;

    res.status(200).json({
      success: true,
      user: formatUser(user, provider),
      provider,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    await user.save();
    res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export {
  completeRegistration,
  resendRegistrationOtp,
  registerUser,
  startRegistration,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
  verifyEmailOtp,
};
