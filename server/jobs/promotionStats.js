const cron = require('node-cron');
const Promotion = require('../models/Promotion');
const mongoose = require('mongoose');

/**
 * Promotion Stats Aggregation Job
 * Runs daily to:
 * - Aggregate daily promotion performance metrics
 * - Calculate CTR, conversion rates, ROAS
 * - Store historical performance data
 */

// Create a schema for daily stats if not exists
const PromotionDailyStatsSchema = new mongoose.Schema({
  promotion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  uniqueClicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  spend: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  roas: { type: Number, default: 0 },
  costPerClick: { type: Number, default: 0 },
  costPerConversion: { type: Number, default: 0 },
}, {
  timestamps: true,
});

PromotionDailyStatsSchema.index({ promotion: 1, date: 1 }, { unique: true });

const PromotionDailyStats = mongoose.models.PromotionDailyStats ||
  mongoose.model('PromotionDailyStats', PromotionDailyStatsSchema);

/**
 * Aggregate daily stats for all active/completed promotions
 */
const aggregateDailyStats = async () => {
  console.log('[PromotionStats] Starting daily stats aggregation...');

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    // Get promotions that were active yesterday
    const promotions = await Promotion.find({
      $or: [
        { status: 'active' },
        { status: 'completed' },
        { status: 'paused' },
      ],
      'scheduling.startsAt': { $lte: today },
    });

    let aggregated = 0;

    for (const promotion of promotions) {
      try {
        // Get previous day's stats snapshot (or create new)
        const previousStats = await PromotionDailyStats.findOne({
          promotion: promotion._id,
          date: { $lt: yesterday },
        }).sort({ date: -1 });

        // Calculate daily metrics
        const dailyImpressions = promotion.stats.impressions - (previousStats?.impressions || 0);
        const dailyClicks = promotion.stats.clicks - (previousStats?.clicks || 0);
        const dailyConversions = promotion.stats.conversions - (previousStats?.conversions || 0);
        const dailyRevenue = promotion.stats.revenue - (previousStats?.revenue || 0);
        const dailySpend = promotion.budget.spent - (previousStats?.spend || 0);

        // Calculate rates
        const ctr = dailyImpressions > 0 ? (dailyClicks / dailyImpressions) * 100 : 0;
        const conversionRate = dailyClicks > 0 ? (dailyConversions / dailyClicks) * 100 : 0;
        const roas = dailySpend > 0 ? dailyRevenue / dailySpend : 0;
        const costPerClick = dailyClicks > 0 ? dailySpend / dailyClicks : 0;
        const costPerConversion = dailyConversions > 0 ? dailySpend / dailyConversions : 0;

        // Store daily stats
        await PromotionDailyStats.findOneAndUpdate(
          { promotion: promotion._id, date: yesterday },
          {
            impressions: promotion.stats.impressions,
            clicks: promotion.stats.clicks,
            uniqueClicks: promotion.stats.uniqueClicks,
            conversions: promotion.stats.conversions,
            revenue: promotion.stats.revenue,
            spend: promotion.budget.spent,
            ctr: parseFloat(ctr.toFixed(2)),
            conversionRate: parseFloat(conversionRate.toFixed(2)),
            roas: parseFloat(roas.toFixed(2)),
            costPerClick: parseFloat(costPerClick.toFixed(2)),
            costPerConversion: parseFloat(costPerConversion.toFixed(2)),
          },
          { upsert: true, new: true }
        );

        // Update promotion's calculated metrics
        const totalCtr = promotion.stats.impressions > 0
          ? (promotion.stats.clicks / promotion.stats.impressions) * 100
          : 0;
        const totalConversionRate = promotion.stats.clicks > 0
          ? (promotion.stats.conversions / promotion.stats.clicks) * 100
          : 0;
        const totalRoas = promotion.budget.spent > 0
          ? promotion.stats.revenue / promotion.budget.spent
          : 0;

        promotion.stats.ctr = parseFloat(totalCtr.toFixed(2));
        promotion.performance = {
          ctr: parseFloat(totalCtr.toFixed(2)),
          conversionRate: parseFloat(totalConversionRate.toFixed(2)),
          roas: parseFloat(totalRoas.toFixed(2)),
          costPerClick: promotion.stats.clicks > 0
            ? parseFloat((promotion.budget.spent / promotion.stats.clicks).toFixed(2))
            : 0,
        };

        await promotion.save();
        aggregated++;
      } catch (promoError) {
        console.error(`[PromotionStats] Error aggregating stats for promotion ${promotion._id}:`, promoError);
      }
    }

    console.log(`[PromotionStats] Aggregated stats for ${aggregated} promotions`);
  } catch (error) {
    console.error('[PromotionStats] Job failed:', error);
  }
};

/**
 * Generate weekly performance reports
 */
const generateWeeklyReports = async () => {
  console.log('[PromotionStats] Generating weekly reports...');

  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get vendors with active promotions
    const vendors = await Promotion.aggregate([
      {
        $match: {
          'scheduling.startsAt': { $lte: new Date() },
          status: { $in: ['active', 'completed', 'paused'] },
        },
      },
      {
        $group: {
          _id: '$vendor',
          totalImpressions: { $sum: '$stats.impressions' },
          totalClicks: { $sum: '$stats.clicks' },
          totalConversions: { $sum: '$stats.conversions' },
          totalRevenue: { $sum: '$stats.revenue' },
          totalSpent: { $sum: '$budget.spent' },
          promotionCount: { $sum: 1 },
        },
      },
    ]);

    // TODO: Send weekly report emails to vendors
    console.log(`[PromotionStats] Generated reports for ${vendors.length} vendors`);
  } catch (error) {
    console.error('[PromotionStats] Weekly report generation failed:', error);
  }
};

// Schedule jobs
const startPromotionStatsJobs = () => {
  // Run daily stats aggregation at 1 AM
  cron.schedule('0 1 * * *', async () => {
    await aggregateDailyStats();
  });

  // Run weekly reports on Mondays at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    await generateWeeklyReports();
  });

  console.log('[PromotionStats] Jobs scheduled');
};

module.exports = {
  startPromotionStatsJobs,
  aggregateDailyStats,
  generateWeeklyReports,
  PromotionDailyStats,
};
