const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const VendorAnalytics = require('../models/VendorAnalytics');
const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const Product = require('../models/Product');
const Review = require('../models/Review');

// @desc    Get vendor analytics dashboard
// @route   GET /api/vendor/analytics
// @access  Private (Vendor)
exports.getVendorAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const vendorObjId = new mongoose.Types.ObjectId(vendor._id);

    // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Aggregate directly from SubOrder for accurate data
    const [statsResult, dailyData] = await Promise.all([
      SubOrder.aggregate([
        {
          $match: {
            vendor: vendorObjId,
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
            },
            returnedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] },
            },
            totalRevenue: {
              $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$total', 0] },
            },
            netRevenue: {
              $sum: { $cond: [{ $in: ['$status', ['delivered', 'shipped', 'confirmed', 'pending']] }, '$total', 0] },
            },
          },
        },
      ]),
      // Daily chart data
      SubOrder.aggregate([
        {
          $match: {
            vendor: vendorObjId,
            createdAt: { $gte: start, $lte: end },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
            customers: { $addToSet: '$customer' },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: '$_id',
            revenue: 1,
            orders: 1,
            customers: { $size: '$customers' },
          },
        },
      ]),
    ]);

    const totals = statsResult[0] || {
      totalOrders: 0, completedOrders: 0, cancelledOrders: 0,
      returnedOrders: 0, totalRevenue: 0, netRevenue: 0,
    };

    // Get unique customers count
    const uniqueCustomers = await SubOrder.distinct('customer', {
      vendor: vendorObjId,
      createdAt: { $gte: start, $lte: end },
    });

    // Get review stats
    const reviewCount = await Review.countDocuments({
      vendor: vendor._id,
      createdAt: { $gte: start, $lte: end },
    }).catch(() => 0);

    // Calculate rates
    const fulfillmentRate = totals.totalOrders > 0
      ? ((totals.completedOrders / totals.totalOrders) * 100).toFixed(1)
      : 0;
    const cancellationRate = totals.totalOrders > 0
      ? ((totals.cancelledOrders / totals.totalOrders) * 100).toFixed(1)
      : 0;
    const returnRate = totals.totalOrders > 0
      ? ((totals.returnedOrders / totals.totalOrders) * 100).toFixed(1)
      : 0;
    const avgOrderValue = totals.totalOrders > 0
      ? (totals.totalRevenue / totals.totalOrders).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders: totals.totalOrders,
          completedOrders: totals.completedOrders,
          cancelledOrders: totals.cancelledOrders,
          returnedOrders: totals.returnedOrders,
          totalRevenue: totals.totalRevenue,
          netRevenue: totals.netRevenue,
          totalCustomers: uniqueCustomers.length,
          totalReviews: reviewCount,
          fulfillmentRate: parseFloat(fulfillmentRate),
          cancellationRate: parseFloat(cancellationRate),
          returnRate: parseFloat(returnRate),
          avgOrderValue: parseFloat(avgOrderValue),
          averageRating: vendor.rating?.average || 0,
          totalRatings: vendor.rating?.count || 0,
        },
        chartData: dailyData,
        period: { start, end },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get real-time stats
// @route   GET /api/vendor/analytics/realtime
// @access  Private (Vendor)
exports.getRealtimeStats = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const vendorObjId = new mongoose.Types.ObjectId(vendor._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's orders from SubOrder
    const todayStats = await SubOrder.aggregate([
      {
        $match: {
          vendor: vendorObjId,
          createdAt: { $gte: today },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
    ]);

    // Pending orders from SubOrder
    const pendingOrders = await SubOrder.countDocuments({
      vendor: vendorObjId,
      status: { $in: ['pending', 'confirmed'] },
    });

    // Low stock products
    const lowStockProducts = await Product.countDocuments({
      vendor: vendor._id,
      status: 'active',
      stock: { $lt: 5, $gt: 0 },
    });

    // Recent reviews
    const recentReviews = await Review.find({
      product: { $in: await Product.find({ vendor: vendor._id }).distinct('_id') },
    })
      .sort('-createdAt')
      .limit(5)
      .populate('user', 'profile.firstName')
      .populate('product', 'name');

    res.json({
      success: true,
      data: {
        todayOrders: todayStats[0]?.count || 0,
        todayRevenue: todayStats[0]?.revenue || 0,
        pendingOrders,
        lowStockProducts,
        recentReviews,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get top selling products
// @route   GET /api/vendor/analytics/top-products
// @access  Private (Vendor)
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const vendorObjId = new mongoose.Types.ObjectId(vendor._id);
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const topProducts = await SubOrder.aggregate([
      {
        $match: {
          vendor: vendorObjId,
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'cancelled' },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get customer analytics
// @route   GET /api/vendor/analytics/customers
// @access  Private (Vendor)
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const vendorObjId = new mongoose.Types.ObjectId(vendor._id);

    // Get unique customers from SubOrder
    const customers = await SubOrder.aggregate([
      {
        $match: {
          vendor: vendorObjId,
        },
      },
      {
        $group: {
          _id: '$customer',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          firstOrder: { $min: '$createdAt' },
          lastOrder: { $max: '$createdAt' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 20 },
    ]);

    // Get customer details
    const User = require('../models/User');
    const customerDetails = await User.find({
      _id: { $in: customers.map(c => c._id) },
    }).select('email profile');

    const enrichedCustomers = customers.map(c => {
      const user = customerDetails.find(u => u._id.toString() === c._id.toString());
      return {
        ...c,
        email: user?.email,
        name: user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Unknown',
      };
    });

    // Total unique customers
    const totalCustomers = await SubOrder.distinct('customer', { vendor: vendorObjId });

    // Repeat customers (more than 1 order)
    const repeatCustomers = await SubOrder.aggregate([
      { $match: { vendor: vendorObjId } },
      { $group: { _id: '$customer', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: 'total' },
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers: totalCustomers.length,
        repeatCustomers: repeatCustomers[0]?.total || 0,
        repeatRate: totalCustomers.length > 0
          ? (((repeatCustomers[0]?.total || 0) / totalCustomers.length) * 100).toFixed(1)
          : 0,
        topCustomers: enrichedCustomers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get all vendors analytics (ranked)
// @route   GET /api/admin/vendor/analytics
// @access  Private (Admin)
exports.getAllVendorsAnalytics = async (req, res) => {
  try {
    const { sortBy = 'revenue', order = 'desc', limit = 20 } = req.query;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const vendorStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: 'cancelled' },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.vendor',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          avgOrderValue: { $avg: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      {
        $sort: {
          [sortBy === 'orders' ? 'totalOrders' : 'totalRevenue']: order === 'desc' ? -1 : 1,
        },
      },
      { $limit: parseInt(limit) },
    ]);

    // Get vendor details
    const vendorIds = vendorStats.map(v => v._id);
    const vendors = await Vendor.find({ _id: { $in: vendorIds } })
      .select('storeName storeSlug rating verificationStatus');

    const enrichedStats = vendorStats.map((stat, index) => {
      const vendor = vendors.find(v => v._id.toString() === stat._id?.toString());
      return {
        rank: index + 1,
        vendor: vendor,
        ...stat,
      };
    });

    res.json({
      success: true,
      data: enrichedStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update analytics (called by cron or event)
// @route   POST /api/vendor/analytics/update
// @access  Internal
exports.updateVendorAnalytics = async (vendorId, date = new Date()) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get orders for the day
    const orders = await Order.find({
      'items.vendor': vendorId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // Calculate metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    let totalRevenue = 0;
    let totalProductsSold = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.vendor?.toString() === vendorId.toString()) {
          totalRevenue += item.price * item.quantity;
          totalProductsSold += item.quantity;
        }
      });
    });

    // Get or create analytics record
    const analytics = await VendorAnalytics.getOrCreate(vendorId, startOfDay, 'daily');

    // Update values
    analytics.totalOrders = totalOrders;
    analytics.completedOrders = completedOrders;
    analytics.cancelledOrders = cancelledOrders;
    analytics.totalRevenue = totalRevenue;
    analytics.netRevenue = totalRevenue; // Adjust for refunds if needed
    analytics.averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    analytics.totalProductsSold = totalProductsSold;

    // Unique customers
    const uniqueCustomers = [...new Set(orders.map(o => o.customer.toString()))];
    analytics.totalCustomers = uniqueCustomers.length;

    await analytics.save();

    return analytics;
  } catch (error) {
    console.error('Error updating vendor analytics:', error);
    throw error;
  }
};
