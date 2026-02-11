const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Product actions
      'product_created',
      'product_updated',
      'product_deleted',
      'product_price_changed',
      'product_status_changed',
      // Order actions
      'order_status_updated',
      'order_cancelled',
      'refund_issued',
      // Payout actions
      'payout_requested',
      'bank_details_updated',
      // Team actions
      'team_member_invited',
      'team_member_removed',
      'team_role_changed',
      'role_created',
      'role_updated',
      'role_deleted',
      // Store actions
      'store_settings_updated',
      'shipping_settings_updated',
      // Subscription actions
      'subscription_upgraded',
      'subscription_downgraded',
      'subscription_cancelled',
      'subscription_renewed',
      // Login actions
      'login',
      'logout',
      'password_changed',
      // Other
      'other',
    ],
  },
  resourceType: {
    type: String,
    enum: ['product', 'order', 'payout', 'team', 'store', 'subscription', 'auth', 'other'],
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  description: {
    type: String,
    required: true,
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: String,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
auditLogSchema.index({ vendor: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });

// Static method to log an action
auditLogSchema.statics.log = async function(data) {
  return this.create(data);
};

// Get recent activity for a vendor
auditLogSchema.statics.getRecentActivity = async function(vendorId, limit = 50) {
  return this.find({ vendor: vendorId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'email profile.firstName profile.lastName');
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
