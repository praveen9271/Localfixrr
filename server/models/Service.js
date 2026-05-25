const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a service title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  location: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  images: [
    {
      type: String,
      trim: true,
    },
  ],
  duration: {
    type: Number,
    min: 0,
    default: 60,
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  reviewsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search
serviceSchema.index({ title: 'text', description: 'text', category: 'text' });
serviceSchema.index({ provider: 1, status: 1 });

module.exports = mongoose.model('Service', serviceSchema);
