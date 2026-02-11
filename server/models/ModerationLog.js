const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema(
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
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: [
        'submitted',           // Vendor submitted for review
        'approved',            // Admin approved
        'rejected',            // Admin rejected
        'changes_requested',   // Admin requested changes
        'resubmitted',         // Vendor resubmitted after changes
        'auto_approved',       // System auto-approved (trusted vendor)
        'published',           // Product published
        'unpublished',         // Product unpublished
        'edited_after_approval', // Product edited after approval
      ],
      required: true,
    },
    previousStatus: { type: String },
    newStatus: { type: String },
    reason: { type: String },
    notes: { type: String }, // Internal admin notes
    // Track what changed (for re-review triggers)
    changes: {
      fields: [{ type: String }],
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    // Request metadata
    metadata: {
      ipAddress: { type: String },
      userAgent: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
moderationLogSchema.index({ product: 1, createdAt: -1 });
moderationLogSchema.index({ vendor: 1, createdAt: -1 });
moderationLogSchema.index({ reviewer: 1, createdAt: -1 });
moderationLogSchema.index({ action: 1, createdAt: -1 });

// Static method to get moderation history for a product
moderationLogSchema.statics.getProductHistory = function (productId, limit = 50) {
  return this.find({ product: productId })
    .populate('reviewer', 'profile.firstName profile.lastName email')
    .sort('-createdAt')
    .limit(limit);
};

// Static method to get recent moderation activity
moderationLogSchema.statics.getRecentActivity = function (options = {}) {
  const { vendorId, reviewerId, action, limit = 50, skip = 0 } = options;
  const query = {};

  if (vendorId) query.vendor = vendorId;
  if (reviewerId) query.reviewer = reviewerId;
  if (action) query.action = action;

  return this.find(query)
    .populate('product', 'name slug images')
    .populate('vendor', 'storeName')
    .populate('reviewer', 'profile.firstName profile.lastName')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
};

// Static method to log moderation action
moderationLogSchema.statics.logAction = async function (data) {
  const {
    product,
    vendor,
    reviewer,
    action,
    previousStatus,
    newStatus,
    reason,
    notes,
    changes,
    metadata,
  } = data;

  return this.create({
    product,
    vendor,
    reviewer,
    action,
    previousStatus,
    newStatus,
    reason,
    notes,
    changes,
    metadata,
  });
};

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
