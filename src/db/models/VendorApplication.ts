import mongoose from 'mongoose';

const VendorApplicationSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', index: true },
  ownerName: String,
  companyName: String,
  email: String,
  phone: String,
  status: { type: String, default: 'pending' },
  ndaAgreed: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  remindersSent: { type: Number, default: 0 },
  lastReminderAt: Date,
}, { 
  timestamps: true 
});

export const VendorApplicationModel = mongoose.models.VendorApplication || mongoose.model('VendorApplication', VendorApplicationSchema);
