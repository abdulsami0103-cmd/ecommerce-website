const mongoose = require('mongoose');

const invoiceCounterSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'customer_invoice',
        'vendor_statement',
        'commission_invoice',
        'credit_note',
        'payout_receipt',
        'tax_invoice',
      ],
    },
    year: {
      type: Number,
      required: true,
    },
    lastNumber: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique type + year combination
invoiceCounterSchema.index({ type: 1, year: 1 }, { unique: true });

// Static method to get next number
invoiceCounterSchema.statics.getNextNumber = async function (type) {
  const year = new Date().getFullYear();

  const counter = await this.findOneAndUpdate(
    { type, year },
    { $inc: { lastNumber: 1 } },
    { new: true, upsert: true }
  );

  return counter.lastNumber;
};

// Static method to reset counters (for new year)
invoiceCounterSchema.statics.initializeYear = async function (year) {
  const types = [
    'customer_invoice',
    'vendor_statement',
    'commission_invoice',
    'credit_note',
    'payout_receipt',
    'tax_invoice',
  ];

  const bulkOps = types.map((type) => ({
    updateOne: {
      filter: { type, year },
      update: { $setOnInsert: { lastNumber: 0 } },
      upsert: true,
    },
  }));

  await this.bulkWrite(bulkOps);
};

module.exports = mongoose.model('InvoiceCounter', invoiceCounterSchema);
