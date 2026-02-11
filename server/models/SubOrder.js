const mongoose = require('mongoose');

const subOrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
  },
  variantName: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  fulfilledQuantity: { type: Number, default: 0 },
  itemStatus: {
    type: String,
    enum: ['unfulfilled', 'partial', 'fulfilled'],
    default: 'unfulfilled',
  },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
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

const subOrderSchema = new mongoose.Schema(
  {
    parentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    subOrderNumber: {
      type: String,
      unique: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [subOrderItemSchema],

    // Financials
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'PKR' },

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    statusHistory: [statusHistorySchema],

    // Shipping
    shippingAddress: addressSchema,
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
    },
    shippingMethod: { type: String },
    estimatedDelivery: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },

    // Vendor communication
    vendorNote: { type: String },
    customerNote: { type: String },

    // Cancellation/Return
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Commission tracking
    commission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrderCommission',
    },
    vendorEarnings: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Generate sub-order number before saving
subOrderSchema.pre('save', async function (next) {
  if (!this.subOrderNumber) {
    const Order = mongoose.model('Order');
    const parentOrder = await Order.findById(this.parentOrder);
    const orderNumber = parentOrder?.orderNumber || 'ORD-UNKNOWN';

    // Count existing sub-orders for this parent
    const SubOrder = mongoose.model('SubOrder');
    const count = await SubOrder.countDocuments({ parentOrder: this.parentOrder });

    this.subOrderNumber = `${orderNumber}-V${count + 1}`;
  }
  next();
});

// Add status to history when status changes
subOrderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

// Indexes
subOrderSchema.index({ parentOrder: 1 });
subOrderSchema.index({ vendor: 1, createdAt: -1 });
subOrderSchema.index({ customer: 1, createdAt: -1 });
subOrderSchema.index({ status: 1 });
subOrderSchema.index({ subOrderNumber: 1 });
subOrderSchema.index({ 'shipment': 1 });

// Virtual for full name
subOrderSchema.virtual('customerFullName').get(function () {
  if (this.shippingAddress) {
    return `${this.shippingAddress.firstName} ${this.shippingAddress.lastName}`;
  }
  return '';
});

// Methods
subOrderSchema.methods.updateStatus = async function (newStatus, note, changedBy) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    changedBy,
  });

  // Update timestamps based on status
  if (newStatus === 'shipped') {
    this.shippedAt = new Date();
  } else if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    this.cancelledBy = changedBy;
  }

  await this.save();
  return this;
};

// Static method to get vendor's pending sub-orders
subOrderSchema.statics.getVendorPendingOrders = function (vendorId) {
  return this.find({
    vendor: vendorId,
    status: { $in: ['pending', 'confirmed', 'processing'] },
  })
    .populate('customer', 'email profile.firstName profile.lastName')
    .populate('parentOrder', 'orderNumber')
    .sort({ createdAt: -1 });
};

// Static method to aggregate parent order status
subOrderSchema.statics.aggregateParentStatus = async function (parentOrderId) {
  const subOrders = await this.find({ parentOrder: parentOrderId });

  if (subOrders.length === 0) return 'pending';

  const statuses = subOrders.map((so) => so.status);

  // If all delivered
  if (statuses.every((s) => s === 'delivered')) return 'completed';

  // If all cancelled
  if (statuses.every((s) => s === 'cancelled')) return 'cancelled';

  // If some delivered, some cancelled (partially fulfilled)
  if (statuses.some((s) => s === 'cancelled') && statuses.some((s) => s === 'delivered')) {
    return 'partially_cancelled';
  }

  // If any is shipped/out_for_delivery
  if (statuses.some((s) => ['shipped', 'out_for_delivery'].includes(s))) {
    return 'processing';
  }

  // If any is processing/confirmed
  if (statuses.some((s) => ['processing', 'confirmed'].includes(s))) {
    return 'processing';
  }

  return 'pending';
};

module.exports = mongoose.model('SubOrder', subOrderSchema);
