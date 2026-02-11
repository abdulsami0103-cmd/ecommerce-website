const mongoose = require('mongoose');

const currencyRateLogSchema = new mongoose.Schema(
  {
    currencyCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    previousRate: {
      type: Number,
      min: 0,
    },
    source: {
      type: String,
      enum: ['manual', 'api', 'system', 'openexchangerates', 'fixer', 'currencylayer'],
      default: 'api',
    },
    changePercent: {
      type: Number,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Additional metadata
    metadata: {
      provider: String,
      requestId: String,
      responseTime: Number,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - auto-delete after 365 days
currencyRateLogSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Compound index for queries
currencyRateLogSchema.index({ currencyCode: 1, recordedAt: -1 });

/**
 * Get rate history for a currency
 */
currencyRateLogSchema.statics.getHistory = async function(currencyCode, options = {}) {
  const { days = 30, limit = 100 } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    currencyCode: currencyCode.toUpperCase(),
    recordedAt: { $gte: startDate },
  })
    .sort({ recordedAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get latest rates for all currencies
 */
currencyRateLogSchema.statics.getLatestRates = async function() {
  return this.aggregate([
    { $sort: { recordedAt: -1 } },
    {
      $group: {
        _id: '$currencyCode',
        rate: { $first: '$rate' },
        previousRate: { $first: '$previousRate' },
        changePercent: { $first: '$changePercent' },
        recordedAt: { $first: '$recordedAt' },
        source: { $first: '$source' },
      },
    },
    {
      $project: {
        currencyCode: '$_id',
        rate: 1,
        previousRate: 1,
        changePercent: 1,
        recordedAt: 1,
        source: 1,
        _id: 0,
      },
    },
    { $sort: { currencyCode: 1 } },
  ]);
};

/**
 * Get rate at specific date
 */
currencyRateLogSchema.statics.getRateAtDate = async function(currencyCode, date) {
  const log = await this.findOne({
    currencyCode: currencyCode.toUpperCase(),
    recordedAt: { $lte: date },
  })
    .sort({ recordedAt: -1 })
    .lean();

  return log?.rate;
};

/**
 * Get rate statistics
 */
currencyRateLogSchema.statics.getStats = async function(currencyCode, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        currencyCode: currencyCode.toUpperCase(),
        recordedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        minRate: { $min: '$rate' },
        maxRate: { $max: '$rate' },
        avgRate: { $avg: '$rate' },
        count: { $sum: 1 },
        firstRate: { $last: '$rate' },
        lastRate: { $first: '$rate' },
      },
    },
    {
      $project: {
        _id: 0,
        minRate: { $round: ['$minRate', 4] },
        maxRate: { $round: ['$maxRate', 4] },
        avgRate: { $round: ['$avgRate', 4] },
        count: 1,
        periodChange: {
          $round: [
            { $multiply: [{ $divide: [{ $subtract: ['$lastRate', '$firstRate'] }, '$firstRate'] }, 100] },
            2,
          ],
        },
      },
    },
  ]);

  return stats[0] || null;
};

/**
 * Get daily average rates
 */
currencyRateLogSchema.statics.getDailyAverages = async function(currencyCode, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        currencyCode: currencyCode.toUpperCase(),
        recordedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' },
        },
        avgRate: { $avg: '$rate' },
        minRate: { $min: '$rate' },
        maxRate: { $max: '$rate' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        date: '$_id',
        avgRate: { $round: ['$avgRate', 4] },
        minRate: { $round: ['$minRate', 4] },
        maxRate: { $round: ['$maxRate', 4] },
        count: 1,
        _id: 0,
      },
    },
    { $sort: { date: 1 } },
  ]);
};

/**
 * Clean up old logs
 */
currencyRateLogSchema.statics.cleanup = async function(daysToKeep = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await this.deleteMany({
    recordedAt: { $lt: cutoffDate },
  });

  return result.deletedCount;
};

const CurrencyRateLog = mongoose.model('CurrencyRateLog', currencyRateLogSchema);

module.exports = CurrencyRateLog;
