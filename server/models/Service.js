import mongoose from 'mongoose';

const normalizeServiceText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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
  normalizedTitle: {
    type: String,
    trim: true,
    default: '',
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

serviceSchema.pre('validate', function normalizeServiceIdentity() {
  this.normalizedTitle = normalizeServiceText(this.title);
});

// Index for search
serviceSchema.index({ title: 'text', description: 'text', category: 'text' });
serviceSchema.index({ provider: 1, status: 1 });
serviceSchema.index(
  { provider: 1, normalizedTitle: 1, category: 1 },
  {
    unique: true,
    partialFilterExpression: { normalizedTitle: { $type: 'string', $ne: '' } },
  },
);

export default mongoose.model('Service', serviceSchema);
export { normalizeServiceText };
