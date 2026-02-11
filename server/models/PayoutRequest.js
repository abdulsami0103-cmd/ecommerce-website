const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedAt: { type: Date, default: Date.now },
  notes: { type: String },
  metadata: mongoose.Schema.Types.Mixed,
}, { _id: false });

const payoutRequestSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorWallet',
    required: true,
  },

  // Request details
  requestedAmount: { type: Number, required: true, min: 1 },
  processedAmount: { type: Number }, // May differ due to fees
  fees: {
    platformFee: { type: Number, default: 0 },
    processingFee: { type: Number, default: 0 },
    totalFees: { type: Number, default: 0 },
  },
  netAmount: { type: Number }, // Amount vendor receives

  currency: { type: String, default: 'PKR' },

  // Status workflow
  status: {
    type: String,
    enum: ['requested', 'under_review', 'approved', 'processing', 'completed', 'rejected', 'cancelled'],
    default: 'requested',
  },

  // Payment method details
  paymentMethod: {
    type: {
      type: String,
      enum: ['bank_transfer', 'easypaisa', 'jazzcash', 'paypal', 'stripe'],
      required: true,
    },
    details: {
      // Bank transfer
      bankName: String,
      accountNumber: String,
      accountTitle: String,
      branchCode: String,
      iban: String,
      swiftCode: String,
      // Easypaisa/Jazzcash
      mobileNumber: String,
      cnic: String,
      accountName: String,
      // PayPal
      paypalEmail: String,
      // Stripe
      stripeAccountId: String,
    },
  },

  // Processing details
  transactionId: { type: String }, // External transaction reference
  externalReference: { type: String }, // Bank reference number etc
  processedAt: { type: Date },
  completedAt: { type: Date },

  // Review workflow
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNotes: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },

  // Safety checks performed
  safetyChecks: {
    hasOpenDisputes: { type: Boolean, default: false },
    disputeCount: { type: Number, default: 0 },
    lastPayoutWithin24h: { type: Boolean, default: false },
    balanceVerified: { type: Boolean, default: false },
    paymentMethodVerified: { type: Boolean, default: false },
  },

  // Audit trail
  statusHistory: [statusHistorySchema],

  // Notes
  vendorNotes: { type: String, maxlength: 500 },
  adminNotes: { type: String, maxlength: 1000 },

  // For batch processing
  batchId: { type: String },
  batchProcessedAt: { type: Date },
}, {
  timestamps: true,
});

// Indexes
payoutRequestSchema.index({ vendor: 1, status: 1 });
payoutRequestSchema.index({ status: 1, createdAt: -1 });
payoutRequestSchema.index({ createdAt: -1 });
payoutRequestSchema.index({ batchId: 1 });

// Pre-save: calculate fees and net amount
payoutRequestSchema.pre('save', function(next) {
  if (this.isModified('requestedAmount') || this.isNew) {
    // Default fee calculation - can be customized based on payment method
    const feeRates = {
      bank_transfer: { platform: 0, processing: 0 }, // Free for bank
      easypaisa: { platform: 0, processing: 1 }, // 1% processing
      jazzcash: { platform: 0, processing: 1 }, // 1% processing
      paypal: { platform: 0, processing: 2.9 }, // 2.9% PayPal fee
      stripe: { platform: 0, processing: 2.9 }, // 2.9% Stripe fee
    };

    const rates = feeRates[this.paymentMethod?.type] || { platform: 0, processing: 0 };

    this.fees.platformFee = Math.round((this.requestedAmount * rates.platform / 100) * 100) / 100;
    this.fees.processingFee = Math.round((this.requestedAmount * rates.processing / 100) * 100) / 100;
    this.fees.totalFees = this.fees.platformFee + this.fees.processingFee;
    this.processedAmount = this.requestedAmount;
    this.netAmount = this.requestedAmount - this.fees.totalFees;
  }
  next();
});

// Method to add status history
payoutRequestSchema.methods.addStatusHistory = function(status, userId, notes, metadata) {
  this.statusHistory.push({
    status,
    changedBy: userId,
    changedAt: new Date(),
    notes,
    metadata,
  });
};

// Method to start review
payoutRequestSchema.methods.startReview = async function(userId) {
  this.status = 'under_review';
  this.reviewedBy = userId;
  this.reviewedAt = new Date();
  this.addStatusHistory('under_review', userId, 'Review started');
  return this.save();
};

// Method to approve
payoutRequestSchema.methods.approve = async function(userId, notes) {
  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.adminNotes = notes || this.adminNotes;
  this.addStatusHistory('approved', userId, notes || 'Payout approved');
  return this.save();
};

// Method to reject
payoutRequestSchema.methods.reject = async function(userId, reason) {
  const VendorWallet = mongoose.model('VendorWallet');
  const wallet = await VendorWallet.findById(this.wallet);

  // Return reserved funds to available
  if (wallet) {
    await wallet.cancelPayout(this.requestedAmount);
  }

  this.status = 'rejected';
  this.rejectedBy = userId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.addStatusHistory('rejected', userId, reason);
  return this.save();
};

// Method to start processing
payoutRequestSchema.methods.startProcessing = async function(userId) {
  this.status = 'processing';
  this.processedAt = new Date();
  this.addStatusHistory('processing', userId, 'Payment processing started');
  return this.save();
};

// Method to complete
payoutRequestSchema.methods.complete = async function(transactionId, externalReference, userId) {
  const VendorWallet = mongoose.model('VendorWallet');
  const wallet = await VendorWallet.findById(this.wallet);

  // Complete the payout from reserved balance
  if (wallet) {
    await wallet.completePayout(this.requestedAmount);
  }

  this.status = 'completed';
  this.transactionId = transactionId;
  this.externalReference = externalReference;
  this.completedAt = new Date();
  this.addStatusHistory('completed', userId, `Transaction: ${transactionId}`);
  return this.save();
};

// Method to cancel (by vendor)
payoutRequestSchema.methods.cancel = async function(userId, reason) {
  if (!['requested', 'under_review'].includes(this.status)) {
    throw new Error('Cannot cancel payout in current status');
  }

  const VendorWallet = mongoose.model('VendorWallet');
  const wallet = await VendorWallet.findById(this.wallet);

  // Return reserved funds to available
  if (wallet) {
    await wallet.cancelPayout(this.requestedAmount);
  }

  this.status = 'cancelled';
  this.addStatusHistory('cancelled', userId, reason || 'Cancelled by vendor');
  return this.save();
};

// Static methods
payoutRequestSchema.statics.getPendingRequests = async function(options = {}) {
  const query = { status: { $in: ['requested', 'under_review'] } };

  if (options.vendor) {
    query.vendor = options.vendor;
  }

  return this.find(query)
    .populate('vendor', 'storeName storeSlug user')
    .populate('wallet', 'availableBalance pendingBalance')
    .sort({ createdAt: 1 });
};

payoutRequestSchema.statics.getApprovedForProcessing = async function() {
  return this.find({ status: 'approved' })
    .populate('vendor', 'storeName storeSlug user')
    .sort({ approvedAt: 1 });
};

payoutRequestSchema.statics.canVendorRequestPayout = async function(vendorId) {
  const lastRequest = await this.findOne({
    vendor: vendorId,
    status: { $nin: ['rejected', 'cancelled'] },
  }).sort({ createdAt: -1 });

  if (!lastRequest) return { canRequest: true };

  // Check 24-hour rate limit
  const hoursSinceLastRequest = (Date.now() - lastRequest.createdAt) / (1000 * 60 * 60);
  if (hoursSinceLastRequest < 24 && lastRequest.status !== 'completed') {
    return {
      canRequest: false,
      reason: 'You can only request one payout per 24 hours',
      nextAvailableAt: new Date(lastRequest.createdAt.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  return { canRequest: true };
};

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
