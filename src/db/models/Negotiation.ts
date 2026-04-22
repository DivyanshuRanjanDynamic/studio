import mongoose from 'mongoose';

const NegotiationMessageSchema = new mongoose.Schema({
  senderId: { type: String, ref: 'User' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const NegotiationSchema = new mongoose.Schema({
  customerId: { type: String, ref: 'User', index: true },
  vendorId: { type: String, ref: 'User', index: true },
  rfqId: { type: String, index: true }, // Refers to the rfq_xxx nanoid
  status: String,
  messages: [NegotiationMessageSchema],
}, { 
  timestamps: true 
});

export const NegotiationModel = mongoose.models.Negotiation || mongoose.model('Negotiation', NegotiationSchema);
