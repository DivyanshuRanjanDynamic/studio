import mongoose from 'mongoose';

const BlogCommentSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', index: true },
  userName: String,
  userImage: String,
  slug: { type: String, index: true },
  content: { type: String, required: true },
  parentId: String, // For nested replies if needed
}, { 
  timestamps: true 
});

export const BlogCommentModel = mongoose.models.BlogComment || mongoose.model('BlogComment', BlogCommentSchema);
