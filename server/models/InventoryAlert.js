const mongoose = require('mongoose');

const inventoryAlertSchema = new mongoose.Schema(
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
      enum: ['low_stock', 'out_of_stock', 'back_in_stock'],
      required: true,
    },
    threshold: { type: Number },
    currentQuantity: { type: Number },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
    },
    // Track notification delivery
    notifications: {
      inApp: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        readAt: { type: Date },
      },
      email: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
      },
      webhook: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        response: { type: String },
      },
    },
    acknowledgedAt: { type: Date },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
inventoryAlertSchema.index({ vendor: 1, status: 1, type: 1, createdAt: -1 });
inventoryAlertSchema.index({ product: 1, status: 1 });
inventoryAlertSchema.index({ status: 1, 'notifications.inApp.sent': 1 });
inventoryAlertSchema.index({ vendor: 1, 'notifications.inApp.readAt': 1 }); // For unread count

// Static method to get active alerts for vendor
inventoryAlertSchema.statics.getVendorAlerts = function (vendorId, options = {}) {
  const { type, status = 'active', limit = 50, skip = 0 } = options;
  const query = { vendor: vendorId };

  if (status !== 'all') query.status = status;
  if (type) query.type = type;

  return this.find(query)
    .populate('product', 'name slug images inventory')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
};

// Static method to get unread alert count
inventoryAlertSchema.statics.getUnreadCount = function (vendorId) {
  return this.countDocuments({
    vendor: vendorId,
    status: 'active',
    'notifications.inApp.readAt': { $exists: false },
  });
};

// Static method to acknowledge alert
inventoryAlertSchema.statics.acknowledge = async function (alertId, userId) {
  return this.findByIdAndUpdate(
    alertId,
    {
      status: 'acknowledged',
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
      'notifications.inApp.readAt': new Date(),
    },
    { new: true }
  );
};

// Static method to resolve alert (when stock is replenished)
inventoryAlertSchema.statics.resolve = async function (productId) {
  return this.updateMany(
    {
      product: productId,
      status: { $in: ['active', 'acknowledged'] },
    },
    {
      status: 'resolved',
      resolvedAt: new Date(),
    }
  );
};

// Static method to check and create alerts
inventoryAlertSchema.statics.checkAndCreateAlert = async function (product, vendor) {
  const quantity = product.inventory.quantity;
  const threshold = product.inventory.lowStockThreshold;

  // Check for existing active alert
  const existingAlert = await this.findOne({
    product: product._id,
    status: { $in: ['active', 'acknowledged'] },
  });

  if (quantity <= 0) {
    // Out of stock
    if (!existingAlert || existingAlert.type !== 'out_of_stock') {
      if (existingAlert) {
        existingAlert.status = 'resolved';
        existingAlert.resolvedAt = new Date();
        await existingAlert.save();
      }
      return this.create({
        product: product._id,
        vendor: vendor,
        type: 'out_of_stock',
        threshold,
        currentQuantity: quantity,
      });
    }
  } else if (quantity <= threshold) {
    // Low stock
    if (!existingAlert || existingAlert.type !== 'low_stock') {
      if (existingAlert) {
        existingAlert.status = 'resolved';
        existingAlert.resolvedAt = new Date();
        await existingAlert.save();
      }
      return this.create({
        product: product._id,
        vendor: vendor,
        type: 'low_stock',
        threshold,
        currentQuantity: quantity,
      });
    }
  } else if (existingAlert) {
    // Stock is fine, resolve existing alert
    existingAlert.status = 'resolved';
    existingAlert.resolvedAt = new Date();
    await existingAlert.save();

    // Create back in stock alert if it was out of stock
    if (existingAlert.type === 'out_of_stock') {
      return this.create({
        product: product._id,
        vendor: vendor,
        type: 'back_in_stock',
        threshold,
        currentQuantity: quantity,
      });
    }
  }

  return null;
};

module.exports = mongoose.model('InventoryAlert', inventoryAlertSchema);
