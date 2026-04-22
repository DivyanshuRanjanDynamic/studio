import mongoose from 'mongoose';

const ShippingAddressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  address: String,
  apartment: String,
  city: String,
  state: String,
  pincode: String,
  phone: String,
}, { _id: false });

const ShippingOptionSchema = new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  description: String,
  estimatedDays: Number,
}, { _id: false });

const QuoteCartItemSchema = new mongoose.Schema({
  id: String,
  projectName: String,
  quote: {
    totalPrice: Number,
    leadTimeDays: Number,
    expiresAt: Date,
    quoteRef: String,
  },
  parts: [mongoose.Schema.Types.Mixed],
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Using nanoid (order_xxx) as _id
  orderNumber: { type: String, unique: true, index: true },
  userId: { type: String, ref: 'User', index: true },
  items: [QuoteCartItemSchema],
  shopItems: [mongoose.Schema.Types.Mixed],
  shippingAddress: ShippingAddressSchema,
  shippingOption: ShippingOptionSchema,
  subtotal: Number,
  gst: Number,
  shippingCost: Number,
  total: Number,
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'refunded', 'failed'], 
    default: 'unpaid' 
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  projectId: { type: String, index: true }, // Optional ref to ProjectRFQ nanoid
  isAdvance: { type: Boolean, default: false },
  isBalance: { type: Boolean, default: false },
  advancePercentage: Number,
  paidAt: Date,
  shippedAt: Date,
  estimatedDeliveryDate: Date,
  trackingNumber: String,
}, { 
  timestamps: true,
  _id: false 
});

OrderSchema.add({ _id: { type: String, required: true } });

export const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);
