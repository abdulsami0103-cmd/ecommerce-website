const mongoose = require('mongoose');

const vendorAnalyticsSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },
  // Sales metrics
  totalOrders: {
    type: Number,
    default: 0,
  },
  completedOrders: {
    type: Number,
    default: 0,
  },
  cancelledOrders: {
    type: Number,
    default: 0,
  },
  returnedOrders: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  netRevenue: {
    type: Number,
    default: 0, // After returns/refunds
  },
  averageOrderValue: {
    type: Number,
    default: 0,
  },
  // Customer metrics
  totalCustomers: {
    type: Number,
    default: 0,
  },
  newCustomers: {
    type: Number,
    default: 0,
  },
  repeatCustomers: {
    type: Number,
    default: 0,
  },
  // Product metrics
  totalProductViews: {
    type: Number,
    default: 0,
  },
  totalProductsSold: {
    type: Number,
    default: 0,
  },
  topSellingProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    quantity: Number,
    revenue: Number,
  }],
  // Rating metrics
  totalReviews: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
  },
  ratingBreakdown: {
    five: { type: Number, default: 0 },
    four: { type: Number, default: 0 },
    three: { type: Number, default: 0 },
    two: { type: Number, default: 0 },
    one: { type: Number, default: 0 },
  },
  // Fulfillment metrics
  ordersShippedOnTime: {
    type: Number,
    default: 0,
  },
  fulfillmentRate: {
    type: Number,
    default: 0,
  },
  averageShippingTime: {
    type: Number, // in hours
    default: 0,
  },
  // Financial metrics
  commissionPaid: {
    type: Number,
    default: 0,
  },
  payoutAmount: {
    type: Number,
    default: 0,
  },
  refundsIssued: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
vendorAnalyticsSchema.index({ vendor: 1, date: -1, period: 1 });
vendorAnalyticsSchema.index({ date: -1 });

// Static method to get or create analytics for a date
vendorAnalyticsSchema.statics.getOrCreate = async function(vendorId, date, period = 'daily') {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  let analytics = await this.findOne({
    vendor: vendorId,
    date: startOfDay,
    period,
  });

  if (!analytics) {
    analytics = await this.create({
      vendor: vendorId,
      date: startOfDay,
      period,
    });
  }

  return analytics;
};

module.exports = mongoose.model('VendorAnalytics', vendorAnalyticsSchema);
