import mongoose from 'mongoose';

const QuotationSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Using nanoid
  rfqId: { type: String, ref: 'ProjectRFQ', index: true },
  vendorId: { type: String, ref: 'User', index: true },
  vendorName: String,
  quotedPrice: Number,
  leadTimeDays: Number,
  notes: String,
  status: { 
    type: String, 
    enum: ['pending', 'revised', 'accepted', 'declined', 'cancelled'],
    default: 'pending'
  },
  negotiationHistory: [{
    senderId: String,
    content: String,
    timestamp: String,
    role: String
  }],
}, { 
  timestamps: true,
  _id: false
});

QuotationSchema.add({ _id: { type: String, required: true } });

export const QuotationModel = mongoose.models.Quotation || mongoose.model('Quotation', QuotationSchema);
