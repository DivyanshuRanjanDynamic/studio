import mongoose from 'mongoose';

const ProjectPartSchema = new mongoose.Schema({
  projectId: { type: String, ref: 'ProjectRFQ', index: true },
  userId: { type: String, ref: 'User', index: true },
  partName: { type: String, required: true },
  service: String,
  cadFile: {
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    uploadedAt: Date,
  },
  material: {
    id: String,
    name: String,
    grade: String,
    thickness: Number,
  },
  secondaryProcesses: [String],
  coatingColor: String,
  taps: [{
    holeIndex: Number,
    tapType: String,
  }],
  tappingNotes: String,
  dimensions: {
    x: Number,
    y: Number,
    z: Number,
  },
  quantity: { type: Number, default: 1 },
  unitCost: Number,
  discountTier: String,
  status: { type: String, default: 'draft' },
  analysis: mongoose.Schema.Types.Mixed,
}, { 
  timestamps: true 
});

export const ProjectPartModel = mongoose.models.ProjectPart || mongoose.model('ProjectPart', ProjectPartSchema);
