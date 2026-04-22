import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Using Firebase UID as the MongoDB primary key
  email: { type: String, required: true, unique: true, index: true },
  fullName: String,
  role: { 
    type: String, 
    enum: ['customer', 'vendor', 'vendor_pending', 'admin', 'mechmaster'], 
    index: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'suspended', 'deactivated'], 
    default: 'active' 
  },
  phone: String,
  teamName: String,
  designation: String,
  location: String,
  imageUrl: String,
  preferences: {
    emailUpdates: { type: Boolean, default: true },
    orderNotifications: { type: Boolean, default: true },
    marketingUpdates: { type: Boolean, default: false },
  },
  // Vendor-specific fields (sparse)
  specializations: [String],
  rating: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  bio: String,
  joinedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  // Cart (embedded)
  cart: [{
    id: String,
    name: String,
    salePrice: Number,
    basePrice: Number,
    quantity: Number,
    image: String,
    sku: String,
    inventory: Number
  }],
  emailVerified: { type: Boolean, default: false },
  onboarded: { type: Boolean, default: false },
}, { 
  timestamps: true,
  // This allows us to use the Firebase UID as the _id with Mongoose
  _id: false 
});

// Re-enable automatic _id so we can pass it manually
UserSchema.add({ _id: { type: String, required: true } });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
