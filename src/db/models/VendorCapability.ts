import mongoose from 'mongoose';

const VendorCapabilitySchema = new mongoose.Schema({
  vendorId: { type: String, ref: 'User', index: true },
  service: String,
  materials: [String],
  maxPartSize: mongoose.Schema.Types.Mixed,
  certifications: [String],
}, { 
  timestamps: true 
});

export const VendorCapabilityModel = mongoose.models.VendorCapability || mongoose.model('VendorCapability', VendorCapabilitySchema);
