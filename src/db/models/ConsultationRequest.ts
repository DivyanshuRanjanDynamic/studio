import mongoose from 'mongoose';

const ConsultationRequestSchema = new mongoose.Schema({
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  message: String,
  quoteRef: String,
  requestDate: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
}, { 
  timestamps: true 
});

export const ConsultationRequestModel = mongoose.models.ConsultationRequest || mongoose.model('ConsultationRequest', ConsultationRequestSchema);
