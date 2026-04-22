import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: String,
  isRead: { type: Boolean, default: false },
  metadata: mongoose.Schema.Types.Mixed,
}, { 
  timestamps: true 
});

export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
