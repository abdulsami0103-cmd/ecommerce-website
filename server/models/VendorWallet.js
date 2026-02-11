const mongoose = require('mongoose');

const vendorWalletSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    unique: true,
  },

  // Balance fields
  availableBalance: { type: Number, default: 0 }, // Can withdraw
  pendingBalance: { type: Number, default: 0 },   // In holding period
  reservedBalance: { type: Number, default: 0 },  // Locked for pending payouts

  // Lifetime totals
  totalEarned: { type: Number, default: 0 },
  totalCommissionPaid: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
  totalRefunded: { type: Number, default: 0 },

  // Currency
  currency: { type: String, default: 'PKR' },

  // Auto-withdraw settings
  autoWithdraw: {
    enabled: { type: Boolean, default: false },
    threshold: { type: Number, default: 10000 }, // PKR
    method: { type: String }, // Reference to default payment method
  },

  lastActivityAt: { type: Date },
}, {
  timestamps: true,
});

// Indexes
vendorWalletSchema.index({ vendor: 1 });
vendorWalletSchema.index({ availableBalance: -1 });

// Virtual for total balance
vendorWalletSchema.virtual('totalBalance').get(function() {
  return this.availableBalance + this.pendingBalance + this.reservedBalance;
});

// Method to add earnings (goes to pending balance with holding period)
vendorWalletSchema.methods.addPendingEarnings = async function(amount, commission) {
  this.pendingBalance += amount;
  this.totalEarned += amount;
  this.totalCommissionPaid += commission;
  this.lastActivityAt = new Date();
  return this.save();
};

// Method to release pending to available
vendorWalletSchema.methods.releasePendingEarnings = async function(amount) {
  if (amount > this.pendingBalance) {
    throw new Error('Insufficient pending balance');
  }
  this.pendingBalance -= amount;
  this.availableBalance += amount;
  this.lastActivityAt = new Date();
  return this.save();
};

// Method to reserve funds for payout request
vendorWalletSchema.methods.reserveForPayout = async function(amount) {
  if (amount > this.availableBalance) {
    throw new Error('Insufficient available balance');
  }
  this.availableBalance -= amount;
  this.reservedBalance += amount;
  this.lastActivityAt = new Date();
  return this.save();
};

// Method to complete payout (deduct from reserved)
vendorWalletSchema.methods.completePayout = async function(amount) {
  if (amount > this.reservedBalance) {
    throw new Error('Insufficient reserved balance');
  }
  this.reservedBalance -= amount;
  this.totalWithdrawn += amount;
  this.lastActivityAt = new Date();
  return this.save();
};

// Method to cancel payout (return reserved to available)
vendorWalletSchema.methods.cancelPayout = async function(amount) {
  if (amount > this.reservedBalance) {
    throw new Error('Insufficient reserved balance');
  }
  this.reservedBalance -= amount;
  this.availableBalance += amount;
  this.lastActivityAt = new Date();
  return this.save();
};

// Method to process refund
vendorWalletSchema.methods.processRefund = async function(amount) {
  // Deduct from available first, then pending if needed
  let remaining = amount;

  if (this.availableBalance >= remaining) {
    this.availableBalance -= remaining;
    remaining = 0;
  } else {
    remaining -= this.availableBalance;
    this.availableBalance = 0;

    if (this.pendingBalance >= remaining) {
      this.pendingBalance -= remaining;
    } else {
      // Not enough balance - this shouldn't happen normally
      throw new Error('Insufficient balance for refund');
    }
  }

  this.totalRefunded += amount;
  this.lastActivityAt = new Date();
  return this.save();
};

// Static method to get or create wallet for vendor
vendorWalletSchema.statics.getOrCreateWallet = async function(vendorId) {
  let wallet = await this.findOne({ vendor: vendorId });
  if (!wallet) {
    wallet = await this.create({ vendor: vendorId });
  }
  return wallet;
};

// Static method to get wallets with available balance for auto-payout
vendorWalletSchema.statics.getWalletsForAutoPayout = async function() {
  return this.find({
    'autoWithdraw.enabled': true,
    $expr: { $gte: ['$availableBalance', '$autoWithdraw.threshold'] },
  }).populate('vendor');
};

module.exports = mongoose.model('VendorWallet', vendorWalletSchema);
