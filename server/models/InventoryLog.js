const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
  {
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
    type: {
      type: String,
      enum: [
        'adjustment',   // Manual adjustment
        'sale',         // Sold item
        'restock',      // Restocked inventory
        'return',       // Customer return
        'reservation',  // Reserved for pending order
        'release',      // Released reservation
        'import',       // Bulk import
        'manual',       // Manual correction
        'initial',      // Initial stock set
      ],
      required: true,
    },
    quantityBefore: {
      type: Number,
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    quantityAfter: {
      type: Number,
      required: true,
    },
    reason: { type: String },
    // Reference to related entity (order, import job, etc.)
    reference: {
      type: { type: String }, // 'order', 'import_job', etc.
      id: mongoose.Schema.Types.ObjectId,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Additional metadata
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
inventoryLogSchema.index({ product: 1, createdAt: -1 });
inventoryLogSchema.index({ vendor: 1, createdAt: -1 });
inventoryLogSchema.index({ type: 1, createdAt: -1 });
inventoryLogSchema.index({ 'reference.type': 1, 'reference.id': 1 });

// Static method to get product history
inventoryLogSchema.statics.getProductHistory = function (productId, options = {}) {
  const { type, limit = 50, skip = 0, dateFrom, dateTo } = options;
  const query = { product: productId };

  if (type) query.type = type;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  return this.find(query)
    .populate('performedBy', 'profile.firstName profile.lastName email')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
};

// Static method to get vendor inventory activity
inventoryLogSchema.statics.getVendorActivity = function (vendorId, options = {}) {
  const { type, limit = 50, skip = 0, dateFrom, dateTo } = options;
  const query = { vendor: vendorId };

  if (type) query.type = type;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  return this.find(query)
    .populate('product', 'name slug images')
    .populate('performedBy', 'profile.firstName profile.lastName')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
};

// Static method to log inventory change
inventoryLogSchema.statics.logChange = async function (data) {
  const {
    product,
    vendor,
    type,
    quantityBefore,
    quantityChange,
    reason,
    reference,
    performedBy,
    metadata,
  } = data;

  return this.create({
    product,
    vendor,
    type,
    quantityBefore,
    quantityChange,
    quantityAfter: quantityBefore + quantityChange,
    reason,
    reference,
    performedBy,
    metadata,
  });
};

// Static method to get inventory summary for vendor
inventoryLogSchema.statics.getVendorSummary = async function (vendorId, dateFrom, dateTo) {
  const match = { vendor: new mongoose.Types.ObjectId(vendorId) };

  if (dateFrom || dateTo) {
    match.createdAt = {};
    if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
    if (dateTo) match.createdAt.$lte = new Date(dateTo);
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalChange: { $sum: '$quantityChange' },
      },
    },
  ]);
};

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
