import mongoose from 'mongoose';

const BlogStatSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
}, { 
  timestamps: true 
});

export const BlogStatModel = mongoose.models.BlogStat || mongoose.model('BlogStat', BlogStatSchema);
