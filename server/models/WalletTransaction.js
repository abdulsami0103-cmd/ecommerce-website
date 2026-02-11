const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorWallet',
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },

  type: {
    type: String,
    enum: ['credit', 'debit', 'hold', 'release', 'refund', 'adjustment'],
    required: true,
  },

  category: {
    type: String,
    enum: ['sale', 'commission', 'payout', 'refund', 'dispute', 'adjustment', 'fee', 'bonus'],
    required: true,
  },

  amount: { type: Number, required: true },
  currency: { type: String, default: 'PKR' },

  // Balance snapshot after transaction
  balanceAfter: {
    available: { type: Number, required: true },
    pending: { type: Number, required: true },
    reserved: { type: Number, required: true },
  },

  // Reference to related entity
  reference: {
    type: { type: String, enum: ['Order', 'PayoutRequest', 'Refund', 'Adjustment', 'OrderCommission'] },
    id: mongoose.Schema.Types.ObjectId,
  },

  description: { type: String, maxlength: 500 },
  metadata: mongoose.Schema.Types.Mixed,

  // For pending balance release tracking
  releaseDate: { type: Date },
  releasedAt: { type: Date },

  // Who initiated the transaction
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // For reversals
  isReversed: { type: Boolean, default: false },
  reversedAt: { type: Date },
  reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reversalReason: { type: String },
  originalTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction' },
}, {
  timestamps: true,
});

// Indexes
walletTransactionSchema.index({ wallet: 1, createdAt: -1 });
walletTransactionSchema.index({ vendor: 1, type: 1, createdAt: -1 });
walletTransactionSchema.index({ releaseDate: 1, releasedAt: 1 });
walletTransactionSchema.index({ 'reference.type': 1, 'reference.id': 1 });
walletTransactionSchema.index({ category: 1, createdAt: -1 });

// Static method to create transaction and update wallet atomically
walletTransactionSchema.statics.createTransaction = async function(data) {
  const VendorWallet = mongoose.model('VendorWallet');
  const wallet = await VendorWallet.findById(data.wallet);

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // Create transaction with current balance snapshot
  const transaction = new this({
    ...data,
    balanceAfter: {
      available: wallet.availableBalance,
      pending: wallet.pendingBalance,
      reserved: wallet.reservedBalance,
    },
  });

  await transaction.save();
  return transaction;
};

// Static method to get transactions pending release
walletTransactionSchema.statics.getPendingRelease = async function(beforeDate = new Date()) {
  return this.find({
    type: 'credit',
    category: 'sale',
    releaseDate: { $lte: beforeDate },
    releasedAt: null,
  }).populate('wallet vendor');
};

// Static method to get vendor transaction summary
walletTransactionSchema.statics.getVendorSummary = async function(vendorId, startDate, endDate) {
  const match = {
    vendor: mongoose.Types.ObjectId(vendorId),
  };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = {};
  result.forEach(item => {
    const key = `${item._id.type}_${item._id.category}`;
    summary[key] = { total: item.total, count: item.count };
  });

  return summary;
};

// Virtual for formatted description
walletTransactionSchema.virtual('formattedDescription').get(function() {
  const typeLabels = {
    credit: 'Credit',
    debit: 'Debit',
    hold: 'Hold',
    release: 'Released',
    refund: 'Refund',
    adjustment: 'Adjustment',
  };

  const categoryLabels = {
    sale: 'Sale Earnings',
    commission: 'Commission',
    payout: 'Payout',
    refund: 'Order Refund',
    dispute: 'Dispute',
    adjustment: 'Manual Adjustment',
    fee: 'Platform Fee',
    bonus: 'Bonus',
  };

  return this.description || `${typeLabels[this.type]} - ${categoryLabels[this.category]}`;
});

walletTransactionSchema.set('toJSON', { virtuals: true });
walletTransactionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
