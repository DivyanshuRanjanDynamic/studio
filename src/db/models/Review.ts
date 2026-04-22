import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  customerId: { type: String, ref: 'User', index: true },
  vendorId: { type: String, ref: 'User', index: true },
  projectId: { type: String, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  isPublic: { type: Boolean, default: true },
}, { 
  timestamps: true 
});

export const ReviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
