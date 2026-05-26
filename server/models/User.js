import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  address: {
    type: String,
    required: [true, 'Please provide an address'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  resetOTP: {
    type: String,
    select: false,
    default: undefined
  },
  resetOTPExpire: {
    type: Date,
    default: undefined
  },
  resetOTPAttempts: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'service_provider', 'admin'],
    default: 'user'
  },
  providerProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
  },
  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // Profile fields
  avatar: {
    type: String,
    default: ''
  },
  location: {
    lat: {
      type: Number,
      default: null,
    },
    lng: {
      type: Number,
      default: null,
    },
    label: {
      type: String,
      trim: true,
      default: '',
    },
  },
  bio: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  if (this.$locals.passwordAlreadyHashed) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
