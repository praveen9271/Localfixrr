import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  serviceItem: {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    duration: {
      type: String,
      trim: true,
      default: '',
    },
  },
  serviceItems: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: {
        type: String,
        trim: true,
        default: '',
      },
      price: {
        type: Number,
        min: 0,
        default: 0,
      },
      description: {
        type: String,
        trim: true,
        default: '',
      },
      duration: {
        type: String,
        trim: true,
        default: '',
      },
    },
  ],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'confirmed', 'rejected', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for common queries
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ service: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, createdAt: -1 });
bookingSchema.index({ date: 1, status: 1 });

export default mongoose.model('Booking', bookingSchema);
