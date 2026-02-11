const mongoose = require('mongoose');

const rmaItemSchema = new mongoose.Schema({
  orderItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubOrder.items',
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: { type: String, required: true },
  productImage: { type: String },
  variant: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  reason: {
    type: String,
    enum: [
      'defective',
      'wrong_item',
      'not_as_described',
      'changed_mind',
      'damaged_shipping',
      'missing_parts',
      'quality_issue',
      'size_fit_issue',
      'other',
    ],
    required: true,
  },
  description: { type: String, required: true },
  images: [{ type: String }], // Evidence images
});

const resolutionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['full_refund', 'partial_refund', 'exchange', 'store_credit', 'repair', 'rejected'],
  },
  amount: { type: Number, default: 0 },
  storeCredit: { type: Number, default: 0 },
  note: { type: String },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: { type: Date },
});

const returnShipmentSchema = new mongoose.Schema({
  trackingNumber: { type: String },
  courier: { type: String },
  labelUrl: { type: String },
  shippedAt: { type: Date },
  receivedAt: { type: Date },
  condition: {
    type: String,
    enum: ['good', 'damaged', 'missing_items', 'used', 'not_original'],
  },
  conditionNote: { type: String },
  images: [{ type: String }], // Images of received items
});

const refundSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ['original_payment', 'wallet_credit', 'bank_transfer'],
    required: true,
  },
  transactionId: { type: String },
  processedAt: { type: Date },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  bankDetails: {
    bankName: { type: String },
    accountNumber: { type: String },
    accountTitle: { type: String },
  },
});

const rmaRequestSchema = new mongoose.Schema(
  {
    rmaNumber: {
      type: String,
      unique: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    subOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubOrder',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },

    // Items being returned
    items: [rmaItemSchema],

    // Request Type
    type: {
      type: String,
      enum: ['return', 'refund_only', 'exchange'],
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: [
        'requested',          // Customer submitted request
        'vendor_review',      // Vendor is reviewing
        'approved',           // Vendor approved, awaiting return shipment
        'rejected',           // Vendor rejected
        'return_shipped',     // Customer shipped return
        'return_received',    // Vendor received return
        'inspection',         // Item being inspected
        'refund_processing',  // Refund being processed
        'exchange_shipped',   // Exchange item shipped
        'resolved',           // RMA completed
        'escalated',          // Escalated to admin
        'closed',             // Closed without resolution
      ],
      default: 'requested',
    },

    // Resolution
    resolution: resolutionSchema,

    // Return Shipment
    returnShipment: returnShipmentSchema,

    // Refund Details
    refund: refundSchema,

    // Exchange Details
    exchange: {
      newProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      newVariant: { type: String },
      shipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
      },
      trackingNumber: { type: String },
      shippedAt: { type: Date },
    },

    // Calculated Amounts
    totalItemValue: { type: Number, required: true },
    refundableAmount: { type: Number },
    restockingFee: { type: Number, default: 0 },
    returnShippingCost: { type: Number, default: 0 },

    // Vendor Response
    vendorResponseDeadline: { type: Date },
    vendorResponse: {
      accepted: { type: Boolean },
      note: { type: String },
      respondedAt: { type: Date },
    },

    // Escalation
    isEscalated: { type: Boolean, default: false },
    escalatedAt: { type: Date },
    escalatedReason: { type: String },
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Admin Notes (internal)
    adminNote: { type: String },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },

    // Timestamps
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    closedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Generate RMA number before saving
rmaRequestSchema.pre('save', async function (next) {
  if (!this.rmaNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    });
    this.rmaNumber = `RMA-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }

  // Set vendor response deadline (48 hours from request)
  if (!this.vendorResponseDeadline && this.status === 'requested') {
    this.vendorResponseDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }

  // Calculate refundable amount
  if (!this.refundableAmount) {
    this.refundableAmount = this.totalItemValue - this.restockingFee - this.returnShippingCost;
  }

  next();
});

// Indexes
rmaRequestSchema.index({ rmaNumber: 1 });
rmaRequestSchema.index({ customer: 1, createdAt: -1 });
rmaRequestSchema.index({ vendor: 1, status: 1, createdAt: -1 });
rmaRequestSchema.index({ order: 1 });
rmaRequestSchema.index({ subOrder: 1 });
rmaRequestSchema.index({ status: 1 });
rmaRequestSchema.index({ isEscalated: 1, status: 1 });
rmaRequestSchema.index({ vendorResponseDeadline: 1, status: 1 });

// Methods
rmaRequestSchema.methods.updateStatus = async function (newStatus, note, changedBy) {
  const RMAStatusLog = mongoose.model('RMAStatusLog');

  const oldStatus = this.status;
  this.status = newStatus;

  // Update specific timestamps
  if (newStatus === 'approved') {
    this.approvedAt = new Date();
  } else if (newStatus === 'rejected') {
    this.rejectedAt = new Date();
  } else if (['resolved', 'closed'].includes(newStatus)) {
    this.closedAt = new Date();
  } else if (newStatus === 'escalated') {
    this.isEscalated = true;
    this.escalatedAt = new Date();
    this.escalatedReason = note;
    this.escalatedBy = changedBy;
  }

  await this.save();

  // Create status log
  await RMAStatusLog.create({
    rmaRequest: this._id,
    fromStatus: oldStatus,
    toStatus: newStatus,
    changedBy,
    reason: note,
  });

  return this;
};

// Static method to get overdue RMAs for escalation
rmaRequestSchema.statics.getOverdueForEscalation = function () {
  return this.find({
    status: { $in: ['requested', 'vendor_review'] },
    vendorResponseDeadline: { $lt: new Date() },
    isEscalated: false,
  })
    .populate('vendor', 'storeName email')
    .populate('customer', 'email profile.firstName profile.lastName');
};

// Static method to get vendor's RMA stats
rmaRequestSchema.statics.getVendorStats = async function (vendorId) {
  const stats = await this.aggregate([
    { $match: { vendor: new mongoose.Types.ObjectId(vendorId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalItemValue' },
      },
    },
  ]);

  return stats.reduce((acc, item) => {
    acc[item._id] = { count: item.count, totalValue: item.totalValue };
    return acc;
  }, {});
};

module.exports = mongoose.model('RMARequest', rmaRequestSchema);
