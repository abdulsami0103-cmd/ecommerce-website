const NodeCache = require('node-cache');
const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const Product = require('../models/Product');
const VendorWallet = require('../models/VendorWallet');
const PageView = require('../models/PageView');
const Review = require('../models/Review');

// Initialize cache with 60 second TTL
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * Helper to get date range based on preset
 */
const getDateRange = (range, startDate, endDate) => {
  const now = new Date();
  let start, end;

  switch (range) {
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = now;
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = now;
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      end = now;
      break;
    case 'custom':
      start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = endDate ? new Date(endDate) : now;
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = now;
  }

  return { start, end };
};

/**
 * @desc    Get dashboard summary with all "at a glance" stats
 * @route   GET /api/vendor/dashboard/summary
 * @access  Vendor
 */
const getSummary = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const cacheKey = `vendor:${vendorId}:summary`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      todayStats,
      pendingOrders,
      lowStockProducts,
      thirtyDayStats,
      previousPeriodStats,
      wallet,
      unreadMessages,
      pendingReviews,
      pageViewStats,
    ] = await Promise.all([
      // Today's stats
      SubOrder.aggregate([
        {
          $match: {
            vendor: new mongoose.Types.ObjectId(vendorId),
            createdAt: { $gte: todayStart },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
      ]),

      // Pending orders count
      SubOrder.countDocuments({
        vendor: vendorId,
        status: { $in: ['pending', 'confirmed'] },
      }),

      // Low stock products (less than 5)
      Product.countDocuments({
        vendor: vendorId,
        status: 'active',
        stock: { $lt: 5, $gt: 0 },
      }),

      // Last 30 days stats
      SubOrder.aggregate([
        {
          $match: {
            vendor: new mongoose.Types.ObjectId(vendorId),
            createdAt: { $gte: thirtyDaysAgo },
            status: { $nin: ['cancelled', 'returned'] },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
      ]),

      // Previous 30 days (for trend calculation)
      SubOrder.aggregate([
        {
          $match: {
            vendor: new mongoose.Types.ObjectId(vendorId),
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
            status: { $nin: ['cancelled', 'returned'] },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
      ]),

      // Wallet balance
      VendorWallet.findOne({ vendor: vendorId }),

      // Unread messages (placeholder - implement when message model exists)
      Promise.resolve(0),

      // Pending reviews to respond to
      Review.countDocuments({
        vendor: vendorId,
        'vendorResponse.response': { $exists: false },
        createdAt: { $gte: thirtyDaysAgo },
      }).catch(() => 0),

      // Page view stats for last 30 days
      PageView.getStats(vendorId, thirtyDaysAgo, now).catch(() => ({
        totalViews: 0,
        uniqueVisitors: 0,
      })),
    ]);

    // Calculate values
    const todayRevenue = todayStats[0]?.revenue || 0;
    const todayOrders = todayStats[0]?.orders || 0;

    const totalRevenue = thirtyDayStats[0]?.revenue || 0;
    const totalOrders = thirtyDayStats[0]?.orders || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const prevRevenue = previousPeriodStats[0]?.revenue || 0;
    const prevOrders = previousPeriodStats[0]?.orders || 0;

    // Calculate trends (percentage change)
    const revenueTrend = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;
    const ordersTrend = prevOrders > 0 ? Math.round(((totalOrders - prevOrders) / prevOrders) * 100) : 0;

    // Calculate conversion rate (orders / unique visitors)
    const conversionRate =
      pageViewStats.uniqueVisitors > 0
        ? Math.round((totalOrders / pageViewStats.uniqueVisitors) * 100 * 100) / 100
        : 0;

    const summary = {
      // Quick stats (today)
      todayRevenue,
      todayOrders,

      // Pending actions
      pendingOrders,
      lowStockProducts,
      newMessages: unreadMessages,
      pendingReviews,

      // Performance (30 days)
      totalRevenue,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue),
      conversionRate,

      // Traffic
      totalPageViews: pageViewStats.totalViews,
      uniqueVisitors: pageViewStats.uniqueVisitors,

      // Wallet
      availableBalance: wallet?.availableBalance || 0,
      pendingBalance: wallet?.pendingBalance || 0,

      // Trends
      revenueTrend,
      ordersTrend,
    };

    // Cache the result
    cache.set(cacheKey, summary);

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard summary',
    });
  }
};

/**
 * @desc    Get sales data with chart points
 * @route   GET /api/vendor/dashboard/sales
 * @access  Vendor
 */
const getSales = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { range = '30d', startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const cacheKey = `vendor:${vendorId}:sales:${range}:${start.toISOString()}:${end.toISOString()}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Get daily sales data
    const salesData = await SubOrder.aggregate([
      {
        $match: {
          vendor: new mongoose.Types.ObjectId(vendorId),
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['cancelled', 'returned'] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing dates with zeros
    const chartData = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayData = salesData.find((d) => d._id === dateStr);
      chartData.push({
        date: dateStr,
        revenue: dayData?.revenue || 0,
        orders: dayData?.orders || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    // Calculate totals
    const totals = chartData.reduce(
      (acc, day) => ({
        revenue: acc.revenue + day.revenue,
        orders: acc.orders + day.orders,
      }),
      { revenue: 0, orders: 0 }
    );
    totals.averageOrderValue = totals.orders > 0 ? Math.round(totals.revenue / totals.orders) : 0;

    const result = { chartData, totals };

    // Cache for 5 minutes
    cache.set(cacheKey, result, 300);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales data',
    });
  }
};

/**
 * @desc    Get demographics and traffic data
 * @route   GET /api/vendor/dashboard/demographics
 * @access  Vendor
 */
const getDemographics = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { range = '30d', startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const cacheKey = `vendor:${vendorId}:demographics:${range}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Get all demographics data in parallel
    const [trafficSources, geoData, devices] = await Promise.all([
      PageView.getTrafficSources(vendorId, start, end),
      PageView.getGeographicData(vendorId, start, end),
      PageView.getDeviceBreakdown(vendorId, start, end),
    ]);

    const result = {
      trafficSources,
      countries: geoData.countries,
      cities: geoData.cities,
      devices,
    };

    // Cache for 15 minutes
    cache.set(cacheKey, result, 900);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get demographics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get demographics data',
    });
  }
};

/**
 * @desc    Get top selling products
 * @route   GET /api/vendor/dashboard/top-products
 * @access  Vendor
 */
const getTopProducts = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { limit = 10, sortBy = 'revenue', range = '30d' } = req.query;
    const { start, end } = getDateRange(range);

    const cacheKey = `vendor:${vendorId}:top-products:${sortBy}:${range}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Aggregate sales by product
    const salesByProduct = await SubOrder.aggregate([
      {
        $match: {
          vendor: new mongoose.Types.ObjectId(vendorId),
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['cancelled', 'returned'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: sortBy === 'quantity' ? { unitsSold: -1 } : { revenue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Get product details
    const productIds = salesByProduct.map((p) => p._id);
    const products = await Product.find({ _id: { $in: productIds } }).select('name images stock status').lean();

    // Merge data
    const topProducts = salesByProduct.map((sale) => {
      const product = products.find((p) => p._id.toString() === sale._id?.toString());
      let stockStatus = 'in_stock';
      if (!product || product.stock === 0) stockStatus = 'out_of_stock';
      else if (product.stock < 5) stockStatus = 'low_stock';

      return {
        id: sale._id,
        name: product?.name || 'Unknown Product',
        image: product?.images?.[0] || null,
        unitsSold: sale.unitsSold,
        revenue: sale.revenue,
        stockLevel: product?.stock || 0,
        stockStatus,
      };
    });

    // Cache for 5 minutes
    cache.set(cacheKey, topProducts, 300);

    res.json({ success: true, data: topProducts });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top products',
    });
  }
};

/**
 * @desc    Export sales data as CSV
 * @route   GET /api/vendor/dashboard/export
 * @access  Vendor
 */
const exportSalesData = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { range = '30d', startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get sales data
    const salesData = await SubOrder.aggregate([
      {
        $match: {
          vendor: new mongoose.Types.ObjectId(vendorId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    if (format === 'json') {
      return res.json({ success: true, data: salesData });
    }

    // Generate CSV
    const headers = ['Date', 'Revenue', 'Total Orders', 'Completed Orders', 'Cancelled Orders'];
    const rows = salesData.map((d) => [
      d._id,
      d.revenue.toFixed(2),
      d.orders,
      d.completedOrders,
      d.cancelledOrders,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export sales data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export sales data',
    });
  }
};

/**
 * Invalidate cache for a vendor (called when orders change)
 */
const invalidateVendorCache = (vendorId) => {
  const keys = cache.keys();
  keys.forEach((key) => {
    if (key.startsWith(`vendor:${vendorId}:`)) {
      cache.del(key);
    }
  });
};

module.exports = {
  getSummary,
  getSales,
  getDemographics,
  getTopProducts,
  exportSalesData,
  invalidateVendorCache,
};
