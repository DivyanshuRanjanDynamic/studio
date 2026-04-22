import mongoose from 'mongoose';

const TimelineEventSchema = new mongoose.Schema({
  id: String,
  type: String,
  message: String,
  timestamp: String,
  status: String,
  projectId: String,
  actorType: String,
  actorId: String,
  content: String,
  channel: String,
}, { _id: false, strict: false }); // strict: false allows additional fields from different event types


const NegotiationMessageSchema = new mongoose.Schema({
  senderId: String,
  content: String,
  timestamp: String,
  role: String,
}, { _id: false });

const ProjectRFQSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Using rfq_xxx nanoid
  userId: { type: String, ref: 'User', index: true },
  userName: String,
  userEmail: String,
  projectName: String,
  status: { 
    type: String, 
    index: true 
  },
  workflowStatus: String,
  deliveryLocation: String,
  quotedPrice: Number,
  leadTimeDays: Number,
  finalPrice: Number,
  assignedVendorId: { type: String, ref: 'User', index: true },
  invitedVendorIds: [String],
  shortlistedVendorIds: [String],
  timelineEvents: [TimelineEventSchema],
  negotiationHistory: [NegotiationMessageSchema],
  paymentStatus: {
    advance: {
      paid: { type: Boolean, default: false },
      paidAt: String,
      amount: Number
    },
    completion: {
      paid: { type: Boolean, default: false },
      paidAt: String,
      amount: Number
    }
  },
  artifacts: [{
    id: String,
    type: String,
    name: String,
    url: String,
    uploadedAt: String
  }],
}, { 
  timestamps: true,
  _id: false 
});

ProjectRFQSchema.add({ _id: { type: String, required: true } });

export const ProjectRFQModel = mongoose.models.ProjectRFQ || mongoose.model('ProjectRFQ', ProjectRFQSchema);
