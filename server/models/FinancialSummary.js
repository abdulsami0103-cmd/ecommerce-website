const mongoose = require('mongoose');

const financialSummarySchema = new mongoose.Schema({
  // Scope
  scope: {
    type: String,
    enum: ['platform', 'vendor', 'category'],
    required: true,
  },
  scopeRef: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'scopeModel',
  },
  scopeModel: {
    type: String,
    enum: ['Vendor', 'Category', null],
  },

  // Period
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
  },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },

  // Revenue metrics
  grossMerchandiseValue: { type: Number, default: 0 }, // GMV - total sales value
  totalOrders: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 },
  cancelledOrders: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },

  // Commission metrics
  totalCommission: { type: Number, default: 0 },
  commissionByType: {
    fixed: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    tiered: { type: Number, default: 0 },
  },

  // Vendor payouts
  totalVendorEarnings: { type: Number, default: 0 },
  totalPayoutsProcessed: { type: Number, default: 0 },
  payoutCount: { type: Number, default: 0 },
  pendingPayouts: { type: Number, default: 0 },

  // Tax metrics
  totalTaxCollected: { type: Number, default: 0 },
  taxByType: {
    vat: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    salesTax: { type: Number, default: 0 },
    serviceTax: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },

  // Refunds
  totalRefunds: { type: Number, default: 0 },
  refundCount: { type: Number, default: 0 },

  // Shipping
  totalShippingCollected: { type: Number, default: 0 },

  // Discounts
  totalDiscountsApplied: { type: Number, default: 0 },

  // Net revenue (platform perspective: commission + fees)
  netRevenue: { type: Number, default: 0 },

  // Customer metrics
  uniqueCustomers: { type: Number, default: 0 },
  newCustomers: { type: Number, default: 0 },
  repeatCustomers: { type: Number, default: 0 },

  // Product metrics
  totalProductsSold: { type: Number, default: 0 },
  topProducts: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    revenue: Number,
  }],

  // Currency
  currency: { type: String, default: 'PKR' },

  // Processing metadata
  processedAt: { type: Date },
  dataVersion: { type: Number, default: 1 },
  isComplete: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Indexes
financialSummarySchema.index({ scope: 1, scopeRef: 1, period: 1, periodStart: -1 }, { unique: true });
financialSummarySchema.index({ periodStart: -1, period: 1 });
financialSummarySchema.index({ scope: 1, period: 1, periodStart: -1 });

// Set scopeModel based on scope
financialSummarySchema.pre('save', function(next) {
  if (this.scope === 'vendor') {
    this.scopeModel = 'Vendor';
  } else if (this.scope === 'category') {
    this.scopeModel = 'Category';
  } else {
    this.scopeModel = null;
    this.scopeRef = null;
  }
  next();
});

// Static method to get or create summary
financialSummarySchema.statics.getOrCreateSummary = async function(scope, scopeRef, period, periodStart, periodEnd) {
  let summary = await this.findOne({
    scope,
    scopeRef: scopeRef || null,
    period,
    periodStart,
  });

  if (!summary) {
    summary = await this.create({
      scope,
      scopeRef,
      period,
      periodStart,
      periodEnd,
    });
  }

  return summary;
};

// Static method to get period boundaries
financialSummarySchema.statics.getPeriodBoundaries = function(period, date = new Date()) {
  const d = new Date(date);
  let periodStart, periodEnd;

  switch (period) {
    case 'daily':
      periodStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      periodEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      break;

    case 'weekly':
      const dayOfWeek = d.getDay();
      periodStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek);
      periodEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - dayOfWeek), 23, 59, 59, 999);
      break;

    case 'monthly':
      periodStart = new Date(d.getFullYear(), d.getMonth(), 1);
      periodEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case 'yearly':
      periodStart = new Date(d.getFullYear(), 0, 1);
      periodEnd = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
  }

  return { periodStart, periodEnd };
};

// Static method to get platform summary for date range
financialSummarySchema.statics.getPlatformSummary = async function(startDate, endDate, period = 'daily') {
  return this.find({
    scope: 'platform',
    period,
    periodStart: { $gte: startDate },
    periodEnd: { $lte: endDate },
  }).sort({ periodStart: 1 });
};

// Static method to get vendor summary
financialSummarySchema.statics.getVendorSummary = async function(vendorId, startDate, endDate, period = 'daily') {
  return this.find({
    scope: 'vendor',
    scopeRef: vendorId,
    period,
    periodStart: { $gte: startDate },
    periodEnd: { $lte: endDate },
  }).sort({ periodStart: 1 });
};

// Static method to get top vendors by GMV
financialSummarySchema.statics.getTopVendors = async function(startDate, endDate, limit = 10) {
  return this.aggregate([
    {
      $match: {
        scope: 'vendor',
        periodStart: { $gte: startDate },
        periodEnd: { $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$scopeRef',
        totalGMV: { $sum: '$grossMerchandiseValue' },
        totalOrders: { $sum: '$totalOrders' },
        totalCommission: { $sum: '$totalCommission' },
      },
    },
    { $sort: { totalGMV: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'vendors',
        localField: '_id',
        foreignField: '_id',
        as: 'vendor',
      },
    },
    { $unwind: '$vendor' },
    {
      $project: {
        vendor: { _id: 1, storeName: 1, storeSlug: 1 },
        totalGMV: 1,
        totalOrders: 1,
        totalCommission: 1,
      },
    },
  ]);
};

// Static method to get category performance
financialSummarySchema.statics.getCategoryPerformance = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        scope: 'category',
        periodStart: { $gte: startDate },
        periodEnd: { $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$scopeRef',
        totalGMV: { $sum: '$grossMerchandiseValue' },
        totalOrders: { $sum: '$totalOrders' },
        productsSold: { $sum: '$totalProductsSold' },
      },
    },
    { $sort: { totalGMV: -1 } },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        category: { _id: 1, name: 1, slug: 1 },
        totalGMV: 1,
        totalOrders: 1,
        productsSold: 1,
      },
    },
  ]);
};

// Static method to get revenue trend
financialSummarySchema.statics.getRevenueTrend = async function(startDate, endDate, period = 'daily') {
  return this.aggregate([
    {
      $match: {
        scope: 'platform',
        period,
        periodStart: { $gte: startDate },
        periodEnd: { $lte: endDate },
      },
    },
    {
      $project: {
        date: '$periodStart',
        gmv: '$grossMerchandiseValue',
        commission: '$totalCommission',
        orders: '$totalOrders',
        refunds: '$totalRefunds',
        netRevenue: '$netRevenue',
      },
    },
    { $sort: { date: 1 } },
  ]);
};

module.exports = mongoose.model('FinancialSummary', financialSummarySchema);
