const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  trackingNumber: { type: String },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
});

const addressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
  phone: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    payment: {
      method: {
        type: String,
        enum: ['cod', 'jazzcash', 'easypaisa', 'card', 'bank_transfer', 'stripe', 'paypal', 'razorpay'],
        required: true,
      },
      transactionId: { type: String },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending',
      },
      paidAt: { type: Date },
    },
    totals: {
      subtotal: { type: Number, required: true },
      shipping: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'PKR' },
    },
    couponCode: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled', 'partially_cancelled'],
      default: 'pending',
    },
    notes: { type: String },

    // Multi-vendor support
    orderType: {
      type: String,
      enum: ['single_vendor', 'multi_vendor'],
      default: 'single_vendor',
    },
    subOrders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubOrder',
    }],
    vendorCount: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Index for querying
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'items.vendor': 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);
