import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true, index: true },
  description: String,
  basePrice: { type: Number, required: true },
  salePrice: Number,
  inventory: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  images: [{
    id: String,
    url: String,
    type: String,
    isMain: Boolean
  }],
  category: String,
  tags: [String],
}, { 
  timestamps: true 
});

export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
