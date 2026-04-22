import mongoose from 'mongoose';

const RestockRequestSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  userId: { type: String, ref: 'User', index: true },
  productName: String,
  sku: String,
  userEmail: String,
  status: { type: String, default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
}, { 
  timestamps: true 
});

export const RestockRequestModel = mongoose.models.RestockRequest || mongoose.model('RestockRequest', RestockRequestSchema);
