const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payout amount is required'],
      min: [1, 'Minimum payout amount is $1'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    stripeTransferId: { type: String },
    stripePayoutId: { type: String },
    failureReason: { type: String },
    processedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Index for vendor payout history
payoutSchema.index({ vendor: 1, createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);
