const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    serviceAreas: [
      {
        type: String,
        trim: true,
      },
    ],
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    available: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'suspended'],
      default: 'pending',
    },
    earnings: {
      type: Number,
      min: 0,
      default: 0,
    },
    documents: [
      {
        name: { type: String, trim: true, default: '' },
        url: { type: String, trim: true, default: '' },
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

providerSchema.index({ businessName: 'text', bio: 'text', skills: 'text', serviceAreas: 'text' });

module.exports = mongoose.model('Provider', providerSchema);
