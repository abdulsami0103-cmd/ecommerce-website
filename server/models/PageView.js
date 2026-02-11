const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema(
  {
    // Which vendor's page was viewed
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },

    // Optional - if it's a product page
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },

    // Type of page viewed
    pageType: {
      type: String,
      enum: ['store', 'product', 'category'],
      default: 'store',
    },

    // Visitor identification
    visitorId: {
      type: String, // Anonymous tracking ID from cookie
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // If logged in
    },

    sessionId: String,

    // Traffic source tracking
    source: {
      type: String, // utm_source or inferred from referrer
      default: 'direct',
    },

    medium: {
      type: String, // utm_medium (organic, cpc, social, referral, etc.)
      default: 'none',
    },

    campaign: String, // utm_campaign

    referrer: String, // Full referrer URL

    // Geo data (from IP lookup)
    country: String,
    countryCode: String,
    city: String,
    region: String,

    // Device information
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },

    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,

    // Request metadata
    ipAddress: String,
    userAgent: String,

    // Page-specific data
    url: String,
    duration: Number, // Time spent on page in seconds (updated on next page view)
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
pageViewSchema.index({ vendor: 1, createdAt: -1 });
pageViewSchema.index({ vendor: 1, product: 1, createdAt: -1 });
pageViewSchema.index({ vendor: 1, source: 1, createdAt: -1 });
pageViewSchema.index({ vendor: 1, country: 1, createdAt: -1 });
pageViewSchema.index({ vendor: 1, deviceType: 1, createdAt: -1 });
pageViewSchema.index({ visitorId: 1, createdAt: -1 });

// TTL index - auto-delete after 90 days
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static methods for analytics aggregation

/**
 * Get traffic sources breakdown for a vendor
 */
pageViewSchema.statics.getTrafficSources = async function (vendorId, startDate, endDate) {
  const match = {
    vendor: new mongoose.Types.ObjectId(vendorId),
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$source',
        visits: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$visitorId' },
      },
    },
    {
      $project: {
        source: '$_id',
        visits: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
      },
    },
    { $sort: { visits: -1 } },
    { $limit: 10 },
  ]);

  // Calculate percentages
  const totalVisits = result.reduce((sum, r) => sum + r.visits, 0);
  return result.map((r) => ({
    source: r.source || 'direct',
    visits: r.visits,
    uniqueVisitors: r.uniqueVisitors,
    percentage: totalVisits > 0 ? Math.round((r.visits / totalVisits) * 100) : 0,
  }));
};

/**
 * Get geographic breakdown for a vendor
 */
pageViewSchema.statics.getGeographicData = async function (vendorId, startDate, endDate) {
  const match = {
    vendor: new mongoose.Types.ObjectId(vendorId),
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const [countries, cities] = await Promise.all([
    // Top countries
    this.aggregate([
      { $match: match },
      {
        $group: {
          _id: { country: '$country', countryCode: '$countryCode' },
          visits: { $sum: 1 },
        },
      },
      {
        $project: {
          country: '$_id.country',
          countryCode: '$_id.countryCode',
          visits: 1,
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 10 },
    ]),
    // Top cities
    this.aggregate([
      { $match: { ...match, city: { $ne: null } } },
      {
        $group: {
          _id: '$city',
          visits: { $sum: 1 },
        },
      },
      {
        $project: {
          city: '$_id',
          visits: 1,
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return { countries, cities };
};

/**
 * Get device breakdown for a vendor
 */
pageViewSchema.statics.getDeviceBreakdown = async function (vendorId, startDate, endDate) {
  const match = {
    vendor: new mongoose.Types.ObjectId(vendorId),
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$deviceType',
        visits: { $sum: 1 },
      },
    },
    {
      $project: {
        type: '$_id',
        visits: 1,
      },
    },
    { $sort: { visits: -1 } },
  ]);

  // Calculate percentages
  const totalVisits = result.reduce((sum, r) => sum + r.visits, 0);
  return result.map((r) => ({
    type: r.type || 'unknown',
    visits: r.visits,
    percentage: totalVisits > 0 ? Math.round((r.visits / totalVisits) * 100) : 0,
  }));
};

/**
 * Get page view stats for a vendor
 */
pageViewSchema.statics.getStats = async function (vendorId, startDate, endDate) {
  const match = {
    vendor: new mongoose.Types.ObjectId(vendorId),
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$visitorId' },
        productViews: {
          $sum: { $cond: [{ $ne: ['$product', null] }, 1, 0] },
        },
        storeViews: {
          $sum: { $cond: [{ $eq: ['$pageType', 'store'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        totalViews: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
        productViews: 1,
        storeViews: 1,
      },
    },
  ]);

  return (
    result[0] || {
      totalViews: 0,
      uniqueVisitors: 0,
      productViews: 0,
      storeViews: 0,
    }
  );
};

/**
 * Get daily page view trend
 */
pageViewSchema.statics.getDailyTrend = async function (vendorId, startDate, endDate) {
  const match = {
    vendor: new mongoose.Types.ObjectId(vendorId),
    createdAt: { $gte: startDate, $lte: endDate },
  };

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$visitorId' },
      },
    },
    {
      $project: {
        date: '$_id',
        views: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
      },
    },
    { $sort: { date: 1 } },
  ]);
};

module.exports = mongoose.model('PageView', pageViewSchema);
