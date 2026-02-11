/**
 * Financial Aggregation Job
 *
 * Runs daily to aggregate financial metrics into FinancialSummary documents.
 * This enables fast reporting without real-time aggregation queries.
 *
 * Schedule: Daily at 00:05 AM
 */

const mongoose = require('mongoose');
const FinancialSummary = require('../models/FinancialSummary');
const OrderCommission = require('../models/OrderCommission');
const Order = require('../models/Order');
const PayoutRequest = require('../models/PayoutRequest');

/**
 * Aggregate financial data for a given date and period
 * @param {Date} date - The date to aggregate
 * @param {string} period - 'daily' | 'weekly' | 'monthly' | 'yearly'
 */
const aggregateFinancials = async (date = new Date(), period = 'daily') => {
  console.log(`[FinancialAggregation] Starting ${period} aggregation for ${date.toISOString().split('T')[0]}`);

  try {
    // Calculate period boundaries
    const { periodStart, periodEnd } = getPeriodBoundaries(date, period);

    // ============ PLATFORM-LEVEL AGGREGATION ============
    await aggregatePlatformMetrics(periodStart, periodEnd, period);

    // ============ VENDOR-LEVEL AGGREGATION ============
    await aggregateVendorMetrics(periodStart, periodEnd, period);

    // ============ CATEGORY-LEVEL AGGREGATION ============
    await aggregateCategoryMetrics(periodStart, periodEnd, period);

    console.log(`[FinancialAggregation] Completed ${period} aggregation`);
    return { success: true, period, periodStart, periodEnd };
  } catch (error) {
    console.error('[FinancialAggregation] Error:', error);
    throw error;
  }
};

/**
 * Calculate period start and end dates
 */
function getPeriodBoundaries(date, period) {
  const d = new Date(date);
  let periodStart, periodEnd;

  switch (period) {
    case 'daily':
      periodStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      periodEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      break;
    case 'weekly':
      // Week starts on Monday
      const dayOfWeek = d.getDay();
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      periodStart = new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      periodStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      periodEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'yearly':
      periodStart = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
      periodEnd = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    default:
      throw new Error(`Invalid period: ${period}`);
  }

  return { periodStart, periodEnd };
}

/**
 * Aggregate platform-level metrics
 */
async function aggregatePlatformMetrics(periodStart, periodEnd, period) {
  // Get order metrics
  const orderMetrics = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: periodStart, $lte: periodEnd },
        orderStatus: { $nin: ['cancelled'] },
      },
    },
    {
      $group: {
        _id: null,
        grossMerchandiseValue: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' },
        totalTax: { $sum: { $ifNull: ['$tax', 0] } },
      },
    },
  ]);

  // Get commission metrics
  const commissionMetrics = await OrderCommission.aggregate([
    {
      $match: {
        createdAt: { $gte: periodStart, $lte: periodEnd },
        status: { $ne: 'refunded' },
      },
    },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: '$commissionAmount' },
        totalVendorEarnings: { $sum: '$vendorEarning' },
      },
    },
    {
      $lookup: {
        from: 'ordercommissions',
        pipeline: [
          {
            $match: {
              createdAt: { $gte: periodStart, $lte: periodEnd },
              status: { $ne: 'refunded' },
            },
          },
          {
            $group: {
              _id: '$commissionType',
              amount: { $sum: '$commissionAmount' },
            },
          },
        ],
        as: 'byType',
      },
    },
  ]);

  // Get payout metrics
  const payoutMetrics = await PayoutRequest.aggregate([
    {
      $match: {
        completedAt: { $gte: periodStart, $lte: periodEnd },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        totalPayoutsProcessed: { $sum: '$netAmount' },
        payoutCount: { $sum: 1 },
      },
    },
  ]);

  // Get pending payouts
  const pendingPayouts = await PayoutRequest.aggregate([
    {
      $match: {
        status: { $in: ['requested', 'under_review', 'approved', 'processing'] },
      },
    },
    {
      $group: {
        _id: null,
        pendingPayouts: { $sum: '$requestedAmount' },
      },
    },
  ]);

  // Get refunds
  const refundMetrics = await Order.aggregate([
    {
      $match: {
        updatedAt: { $gte: periodStart, $lte: periodEnd },
        orderStatus: 'refunded',
      },
    },
    {
      $group: {
        _id: null,
        totalRefunds: { $sum: '$totalAmount' },
      },
    },
  ]);

  // Build commission by type
  const commissionByType = { fixed: 0, percentage: 0, tiered: 0 };
  if (commissionMetrics[0]?.byType) {
    commissionMetrics[0].byType.forEach((t) => {
      if (commissionByType.hasOwnProperty(t._id)) {
        commissionByType[t._id] = t.amount;
      }
    });
  }

  // Calculate net revenue
  const gmv = orderMetrics[0]?.grossMerchandiseValue || 0;
  const commission = commissionMetrics[0]?.totalCommission || 0;
  const refunds = refundMetrics[0]?.totalRefunds || 0;
  const netRevenue = commission - refunds;

  // Upsert platform summary
  await FinancialSummary.findOneAndUpdate(
    { scope: 'platform', period, periodStart },
    {
      $set: {
        periodEnd,
        grossMerchandiseValue: gmv,
        totalOrders: orderMetrics[0]?.totalOrders || 0,
        averageOrderValue: orderMetrics[0]?.avgOrderValue || 0,
        totalCommission: commission,
        commissionByType,
        totalVendorEarnings: commissionMetrics[0]?.totalVendorEarnings || 0,
        totalPayoutsProcessed: payoutMetrics[0]?.totalPayoutsProcessed || 0,
        pendingPayouts: pendingPayouts[0]?.pendingPayouts || 0,
        totalTaxCollected: orderMetrics[0]?.totalTax || 0,
        totalRefunds: refunds,
        netRevenue,
        lastUpdated: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  console.log(`[FinancialAggregation] Platform metrics saved: GMV=${gmv}, Commission=${commission}`);
}

/**
 * Aggregate vendor-level metrics
 */
async function aggregateVendorMetrics(periodStart, periodEnd, period) {
  const vendorMetrics = await OrderCommission.aggregate([
    {
      $match: {
        createdAt: { $gte: periodStart, $lte: periodEnd },
        status: { $ne: 'refunded' },
      },
    },
    {
      $group: {
        _id: '$vendor',
        grossMerchandiseValue: { $sum: '$saleAmount' },
        totalOrders: { $sum: 1 },
        totalCommission: { $sum: '$commissionAmount' },
        totalVendorEarnings: { $sum: '$vendorEarning' },
      },
    },
  ]);

  // Get payouts per vendor
  const vendorPayouts = await PayoutRequest.aggregate([
    {
      $match: {
        completedAt: { $gte: periodStart, $lte: periodEnd },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$vendor',
        totalPayoutsProcessed: { $sum: '$netAmount' },
      },
    },
  ]);

  const payoutMap = {};
  vendorPayouts.forEach((p) => {
    payoutMap[p._id.toString()] = p.totalPayoutsProcessed;
  });

  // Upsert each vendor's summary
  for (const v of vendorMetrics) {
    await FinancialSummary.findOneAndUpdate(
      { scope: 'vendor', scopeRef: v._id, period, periodStart },
      {
        $set: {
          periodEnd,
          grossMerchandiseValue: v.grossMerchandiseValue,
          totalOrders: v.totalOrders,
          averageOrderValue: v.totalOrders > 0 ? v.grossMerchandiseValue / v.totalOrders : 0,
          totalCommission: v.totalCommission,
          totalVendorEarnings: v.totalVendorEarnings,
          totalPayoutsProcessed: payoutMap[v._id.toString()] || 0,
          netRevenue: v.totalVendorEarnings,
          lastUpdated: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }

  console.log(`[FinancialAggregation] ${vendorMetrics.length} vendor summaries saved`);
}

/**
 * Aggregate category-level metrics
 */
async function aggregateCategoryMetrics(periodStart, periodEnd, period) {
  const categoryMetrics = await OrderCommission.aggregate([
    {
      $match: {
        createdAt: { $gte: periodStart, $lte: periodEnd },
        status: { $ne: 'refunded' },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: '$productInfo' },
    {
      $group: {
        _id: '$productInfo.category',
        grossMerchandiseValue: { $sum: '$saleAmount' },
        totalOrders: { $sum: 1 },
        totalCommission: { $sum: '$commissionAmount' },
      },
    },
  ]);

  // Upsert each category's summary
  for (const c of categoryMetrics) {
    if (!c._id) continue;

    await FinancialSummary.findOneAndUpdate(
      { scope: 'category', scopeRef: c._id, period, periodStart },
      {
        $set: {
          periodEnd,
          grossMerchandiseValue: c.grossMerchandiseValue,
          totalOrders: c.totalOrders,
          averageOrderValue: c.totalOrders > 0 ? c.grossMerchandiseValue / c.totalOrders : 0,
          totalCommission: c.totalCommission,
          lastUpdated: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }

  console.log(`[FinancialAggregation] ${categoryMetrics.length} category summaries saved`);
}

/**
 * Run aggregation for multiple periods
 */
const runAllAggregations = async (date = new Date()) => {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);

  // Run daily aggregation
  await aggregateFinancials(yesterday, 'daily');

  // If it's Monday, run weekly aggregation for last week
  if (date.getDay() === 1) {
    const lastWeek = new Date(date);
    lastWeek.setDate(lastWeek.getDate() - 7);
    await aggregateFinancials(lastWeek, 'weekly');
  }

  // If it's the 1st, run monthly aggregation for last month
  if (date.getDate() === 1) {
    const lastMonth = new Date(date);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    await aggregateFinancials(lastMonth, 'monthly');
  }

  // If it's Jan 1st, run yearly aggregation for last year
  if (date.getMonth() === 0 && date.getDate() === 1) {
    const lastYear = new Date(date);
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    await aggregateFinancials(lastYear, 'yearly');
  }
};

module.exports = {
  aggregateFinancials,
  runAllAggregations,
};
