import mongoose from 'mongoose';

const QuoteSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Using quoteRef
  userId: { type: String, ref: 'User', index: true },
  quoteRef: { type: String, required: true, unique: true },
  parts: [mongoose.Schema.Types.Mixed],
  totalPrice: Number,
  leadTimeDays: Number,
  status: { type: String, default: 'active' },
  expiresAt: { type: Date, required: true },
}, { 
  timestamps: true,
  _id: false
});

QuoteSchema.add({ _id: { type: String, required: true } });

export const QuoteModel = mongoose.models.Quote || mongoose.model('Quote', QuoteSchema);
