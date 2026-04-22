import mongoose from 'mongoose';

const NewsletterSubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  subscribedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, { 
  timestamps: true 
});

export const NewsletterSubscriberModel = mongoose.models.NewsletterSubscriber || mongoose.model('NewsletterSubscriber', NewsletterSubscriberSchema);
