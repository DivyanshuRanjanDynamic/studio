import mongoose from 'mongoose';

const UploadedFileSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Using file.id
  userId: { type: String, ref: 'User', index: true },
  fileName: String,
  fileUrl: String,
  fileSize: Number,
  fileType: String,
  uploadedAt: { type: Date, default: Date.now },
}, { 
  timestamps: true,
  _id: false
});

UploadedFileSchema.add({ _id: { type: String, required: true } });

export const UploadedFileModel = mongoose.models.UploadedFile || mongoose.model('UploadedFile', UploadedFileSchema);
