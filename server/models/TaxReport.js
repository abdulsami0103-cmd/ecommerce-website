const mongoose = require('mongoose');

const taxReportSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number, // 1-12, null for annual
      min: 1,
      max: 12,
    },
    quarter: {
      type: Number, // 1-4, null for monthly/annual
      min: 1,
      max: 4,
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },

    // Earnings Summary
    grossEarnings: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalRefunds: { type: Number, default: 0 },

    // Deductions
    commissionPaid: { type: Number, default: 0 },
    platformFees: { type: Number, default: 0 },
    processingFees: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },

    // Tax Calculations
    taxableAmount: { type: Number, default: 0 },
    withholdingTax: { type: Number, default: 0 },
    withholdingTaxRate: { type: Number, default: 0 },
    salesTaxCollected: { type: Number, default: 0 },

    // Net
    netEarnings: { type: Number, default: 0 },

    // Payouts in this period
    totalWithdrawals: { type: Number, default: 0 },
    withdrawalCount: { type: Number, default: 0 },

    // File
    fileUrl: { type: String },
    fileName: { type: String },
    generatedAt: { type: Date },

    // Status
    status: {
      type: String,
      enum: ['pending', 'generated', 'sent', 'acknowledged'],
      default: 'pending',
    },

    // Meta
    notes: { type: String },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique reports
taxReportSchema.index(
  { vendor: 1, reportType: 1, year: 1, month: 1, quarter: 1 },
  { unique: true }
);
taxReportSchema.index({ vendor: 1, year: 1 });
taxReportSchema.index({ status: 1 });

// Static method to generate report data
taxReportSchema.statics.generateReportData = async function (vendorId, reportType, year, month, quarter) {
  const WalletTransaction = mongoose.model('WalletTransaction');
  const OrderCommission = mongoose.model('OrderCommission');
  const PayoutRequest = mongoose.model('PayoutRequest');

  // Calculate period dates
  let periodStart, periodEnd;

  if (reportType === 'monthly') {
    periodStart = new Date(year, month - 1, 1);
    periodEnd = new Date(year, month, 0, 23, 59, 59, 999);
  } else if (reportType === 'quarterly') {
    const startMonth = (quarter - 1) * 3;
    periodStart = new Date(year, startMonth, 1);
    periodEnd = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
  } else {
    periodStart = new Date(year, 0, 1);
    periodEnd = new Date(year, 11, 31, 23, 59, 59, 999);
  }

  // Get transactions in period
  const transactions = await WalletTransaction.find({
    vendor: vendorId,
    createdAt: { $gte: periodStart, $lte: periodEnd },
  });

  // Calculate totals from transactions
  let grossEarnings = 0;
  let totalRefunds = 0;
  let commissionPaid = 0;
  let platformFees = 0;

  transactions.forEach((tx) => {
    if (tx.category === 'sale' && tx.type === 'credit') {
      grossEarnings += tx.amount;
    }
    if (tx.category === 'refund') {
      totalRefunds += Math.abs(tx.amount);
    }
    if (tx.category === 'commission') {
      commissionPaid += Math.abs(tx.amount);
    }
    if (tx.category === 'fee') {
      platformFees += Math.abs(tx.amount);
    }
  });

  // Get order commissions for order count
  const orderCommissions = await OrderCommission.find({
    vendor: vendorId,
    createdAt: { $gte: periodStart, $lte: periodEnd },
  });

  const totalOrders = orderCommissions.length;
  const totalSales = orderCommissions.reduce((sum, oc) => sum + (oc.saleAmount || 0), 0);

  // Get withdrawals in period
  const withdrawals = await PayoutRequest.find({
    vendor: vendorId,
    status: 'completed',
    processedAt: { $gte: periodStart, $lte: periodEnd },
  });

  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.netAmount || 0), 0);
  const withdrawalCount = withdrawals.length;
  const processingFees = withdrawals.reduce((sum, w) => sum + (w.processingFee || 0), 0);

  // Calculate deductions and taxable
  const totalDeductions = commissionPaid + platformFees + processingFees;
  const taxableAmount = grossEarnings - totalDeductions;
  const netEarnings = taxableAmount - totalRefunds;

  return {
    period: { start: periodStart, end: periodEnd },
    grossEarnings,
    totalSales,
    totalOrders,
    totalRefunds,
    commissionPaid,
    platformFees,
    processingFees,
    otherDeductions: 0,
    totalDeductions,
    taxableAmount,
    netEarnings,
    totalWithdrawals,
    withdrawalCount,
  };
};

// Instance method to regenerate
taxReportSchema.methods.regenerate = async function () {
  const data = await this.constructor.generateReportData(
    this.vendor,
    this.reportType,
    this.year,
    this.month,
    this.quarter
  );

  Object.assign(this, data);
  this.generatedAt = new Date();
  this.status = 'generated';

  await this.save();
  return this;
};

module.exports = mongoose.model('TaxReport', taxReportSchema);
