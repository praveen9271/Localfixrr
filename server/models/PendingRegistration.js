const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'service_provider'],
      default: 'user',
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    serviceCategory: {
      type: String,
      trim: true,
      default: '',
    },
    emailOtpHash: {
      type: String,
      required: true,
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailAttempts: {
      type: Number,
      default: 0,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true },
);

pendingRegistrationSchema.index({ email: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
