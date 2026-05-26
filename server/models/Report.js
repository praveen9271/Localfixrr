import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      required: [true, 'Please provide a report type'],
      trim: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

reportSchema.index({ reportType: 1, createdAt: -1 });

export default mongoose.model('Report', reportSchema);
