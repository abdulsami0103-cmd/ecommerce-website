const mongoose = require('mongoose');

const vendorSubscriptionSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorPlan',
    required: true,
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'trialing', 'paused', 'expired'],
    default: 'active',
  },
  // Dates
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  trialEndDate: Date,
  cancelledAt: Date,
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: true,
  },
  // Payment
  lastPaymentDate: Date,
  nextPaymentDate: Date,
  lastPaymentAmount: Number,
  // Stripe
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  // Grace period for failed payments
  gracePeriodEnds: Date,
  failedPaymentAttempts: {
    type: Number,
    default: 0,
  },
  // History
  previousPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorPlan',
  },
  upgradedAt: Date,
  downgradedAt: Date,
}, {
  timestamps: true,
});

// Indexes
vendorSubscriptionSchema.index({ vendor: 1 });
vendorSubscriptionSchema.index({ status: 1 });
vendorSubscriptionSchema.index({ endDate: 1 });
vendorSubscriptionSchema.index({ stripeSubscriptionId: 1 });

// Check if subscription is active
vendorSubscriptionSchema.methods.isActive = function() {
  if (this.status === 'active' || this.status === 'trialing') {
    return true;
  }
  // Check grace period
  if (this.status === 'past_due' && this.gracePeriodEnds && new Date() < this.gracePeriodEnds) {
    return true;
  }
  return false;
};

// Calculate days until expiry
vendorSubscriptionSchema.methods.daysUntilExpiry = function() {
  if (!this.endDate) return null;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('VendorSubscription', vendorSubscriptionSchema);
