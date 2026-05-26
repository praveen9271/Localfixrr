import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      trim: true,
      unique: true,
    },
    icon: {
      type: String,
      trim: true,
      default: 'Wrench',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

categorySchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Category', categorySchema);
