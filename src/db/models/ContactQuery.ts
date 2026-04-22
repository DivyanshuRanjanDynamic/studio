import mongoose from 'mongoose';

const ContactQuerySchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, required: true },
  phone: String,
  company: String,
  message: String,
  status: { type: String, default: 'new' },
}, { 
  timestamps: true 
});

export const ContactQueryModel = mongoose.models.ContactQuery || mongoose.model('ContactQuery', ContactQuerySchema);
