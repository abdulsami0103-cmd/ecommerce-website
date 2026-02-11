const FinancialSummary = require('../models/FinancialSummary');
const OrderCommission = require('../models/OrderCommission');
const VendorWallet = require('../models/VendorWallet');
const PayoutRequest = require('../models/PayoutRequest');
const Order = require('../models/Order');

// @desc    Get platform revenue overview
// @route   GET /api/reports/admin/overview
// @access  Private (Admin)
exports.getPlatformOverview = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;

    const query = { scope: 'platform', period };

    if (startDate || endDate) {
      query.periodStart = {};
      if (startDate) query.periodStart.$gte = new Date(startDate);
      if (endDate) query.periodStart.$lte = new Date(endDate);
    }

    const summaries = await FinancialSummary.find(query)
      .sort({ periodStart: -1 })
      .limit(30);

    // Get current totals
    const totals = await FinancialSummary.aggregate([
      { $match: { scope: 'platform', ...query } },
      {
        $group: {
          _id: null,
          totalGMV: { $sum: '$grossMerchandiseValue' },
          totalOrders: { $sum: '$totalOrders' },
          totalCommission: { $sum: '$totalCommission' },
          totalVendorEarnings: { $sum: '$totalVendorEarnings' },
          totalPayoutsProcessed: { $sum: '$totalPayoutsProcessed' },
          totalTaxCollected: { $sum: '$totalTaxCollected' },
          totalRefunds: { $sum: '$totalRefunds' },
          netRevenue: { $sum: '$netRevenue' },
        },
      },
    ]);

    // Get pending payouts
    const pendingPayouts = await PayoutRequest.aggregate([
      { $match: { status: { $in: ['requested', 'under_review', 'approved', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$requestedAmount' } } },
    ]);

    // Get total vendor balances owed
    const vendorBalances = await VendorWallet.aggregate([
      {
        $group: {
          _id: null,
          totalAvailable: { $sum: '$availableBalance' },
          totalPending: { $sum: '$pendingBalance' },
          totalReserved: { $sum: '$reservedBalance' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summaries,
        totals: totals[0] || {
          totalGMV: 0,
          totalOrders: 0,
          totalCommission: 0,
          totalVendorEarnings: 0,
          totalPayoutsProcessed: 0,
          totalTaxCollected: 0,
          totalRefunds: 0,
          netRevenue: 0,
        },
        pendingPayouts: pendingPayouts[0]?.total || 0,
        vendorBalances: vendorBalances[0] || {
          totalAvailable: 0,
          totalPending: 0,
          totalReserved: 0,
        },
      },
    });
  } catch (error) {
    console.error('Error in getPlatformOverview:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get revenue breakdown by vendor
// @route   GET /api/reports/admin/by-vendor
// @access  Private (Admin)
exports.getRevenueByVendor = async (req, res, next) => {
  try {
    const { startDate, endDate, page = 1, limit = 20, sortBy = 'totalSales', sortOrder = 'desc' } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = dateFilter;
    }

    const vendorStats = await OrderCommission.aggregate([
      { $match: { status: { $ne: 'refunded' }, ...matchStage } },
      {
        $group: {
          _id: '$vendor',
          totalSales: { $sum: '$saleAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalEarnings: { $sum: '$vendorEarning' },
          orderCount: { $sum: 1 },
          avgCommissionRate: { $avg: '$commissionRate' },
        },
      },
      { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          vendorId: '$_id',
          vendorName: '$vendor.storeName',
          vendorEmail: '$vendor.contactEmail',
          totalSales: 1,
          totalCommission: 1,
          totalEarnings: 1,
          orderCount: 1,
          avgCommissionRate: { $round: ['$avgCommissionRate', 2] },
        },
      },
    ]);

    // Get total count
    const totalVendors = await OrderCommission.aggregate([
      { $match: { status: { $ne: 'refunded' }, ...matchStage } },
      { $group: { _id: '$vendor' } },
      { $count: 'total' },
    ]);

    res.status(200).json({
      success: true,
      data: vendorStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalVendors[0]?.total || 0,
        pages: Math.ceil((totalVendors[0]?.total || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error in getRevenueByVendor:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get revenue breakdown by category
// @route   GET /api/reports/admin/by-category
// @access  Private (Admin)
exports.getRevenueByCategory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const matchStage = { status: { $ne: 'refunded' } };
    if (startDate || endDate) {
      matchStage.createdAt = dateFilter;
    }

    // Get from FinancialSummary if available
    const summaries = await FinancialSummary.find({
      scope: 'category',
      ...(startDate || endDate ? { periodStart: dateFilter } : {}),
    })
      .populate('scopeRef', 'name slug')
      .sort({ grossMerchandiseValue: -1 });

    if (summaries.length > 0) {
      const categoryMap = {};
      summaries.forEach((s) => {
        const catId = s.scopeRef?._id?.toString();
        if (!catId) return;
        if (!categoryMap[catId]) {
          categoryMap[catId] = {
            categoryId: catId,
            categoryName: s.scopeRef.name,
            totalSales: 0,
            totalCommission: 0,
            totalOrders: 0,
          };
        }
        categoryMap[catId].totalSales += s.grossMerchandiseValue;
        categoryMap[catId].totalCommission += s.totalCommission;
        categoryMap[catId].totalOrders += s.totalOrders;
      });

      return res.status(200).json({
        success: true,
        data: Object.values(categoryMap).sort((a, b) => b.totalSales - a.totalSales),
      });
    }

    // Fallback to real-time aggregation from orders
    const categoryStats = await Order.aggregate([
      { $match: { orderStatus: { $nin: ['cancelled', 'refunded'] }, ...matchStage } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: '$_id',
          categoryName: { $ifNull: ['$category.name', 'Uncategorized'] },
          totalSales: 1,
          orderCount: 1,
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: categoryStats,
    });
  } catch (error) {
    console.error('Error in getRevenueByCategory:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get revenue over time
// @route   GET /api/reports/admin/by-period
// @access  Private (Admin)
exports.getRevenueByPeriod = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'daily', groupBy = 'day' } = req.query;

    const query = { scope: 'platform', period };

    if (startDate || endDate) {
      query.periodStart = {};
      if (startDate) query.periodStart.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.periodStart.$lte = end;
      }
    }

    const summaries = await FinancialSummary.find(query)
      .sort({ periodStart: 1 })
      .select('periodStart periodEnd grossMerchandiseValue totalOrders totalCommission totalVendorEarnings totalTaxCollected netRevenue');

    if (summaries.length === 0) {
      const dateMatch = {};
      if (startDate) dateMatch.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateMatch.$lte = end;
      }

      let dateFormat;
      switch (groupBy) {
        case 'month':
          dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        case 'week':
          dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
          break;
        default:
          dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      }

      const realTimeStats = await Order.aggregate([
        {
          $match: {
            orderStatus: { $nin: ['cancelled'] },
            ...(startDate || endDate ? { createdAt: dateMatch } : {}),
          },
        },
        {
          $group: {
            _id: dateFormat,
            totalSales: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
            avgOrderValue: { $avg: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return res.status(200).json({
        success: true,
        data: realTimeStats.map((s) => ({
          period: s._id,
          grossMerchandiseValue: s.totalSales,
          totalOrders: s.orderCount,
          averageOrderValue: Math.round(s.avgOrderValue * 100) / 100,
        })),
      });
    }

    res.status(200).json({
      success: true,
      data: summaries,
    });
  } catch (error) {
    console.error('Error in getRevenueByPeriod:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get vendor earnings report
// @route   GET /api/reports/vendor/earnings
// @access  Private (Vendor)
exports.getVendorEarnings = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const vendorId = req.user.vendor;

    if (!vendorId) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const dateMatch = {};
    if (startDate) dateMatch.$gte = new Date(startDate);
    if (endDate) dateMatch.$lte = new Date(endDate);

    // Get commission summary
    const commissionSummary = await OrderCommission.aggregate([
      {
        $match: {
          vendor: vendorId,
          ...(startDate || endDate ? { createdAt: dateMatch } : {}),
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$saleAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalEarnings: { $sum: '$vendorEarning' },
          orderCount: { $sum: 1 },
          avgCommissionRate: { $avg: '$commissionRate' },
        },
      },
    ]);

    // Get earnings over time
    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'week':
        dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        break;
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const earningsOverTime = await OrderCommission.aggregate([
      {
        $match: {
          vendor: vendorId,
          ...(startDate || endDate ? { createdAt: dateMatch } : {}),
        },
      },
      {
        $group: {
          _id: dateFormat,
          sales: { $sum: '$saleAmount' },
          commission: { $sum: '$commissionAmount' },
          earnings: { $sum: '$vendorEarning' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get wallet info
    const wallet = await VendorWallet.findOne({ vendor: vendorId });

    // Get commission by type
    const commissionByType = await OrderCommission.aggregate([
      {
        $match: {
          vendor: vendorId,
          ...(startDate || endDate ? { createdAt: dateMatch } : {}),
        },
      },
      {
        $group: {
          _id: '$commissionType',
          amount: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: commissionSummary[0] || {
          totalSales: 0,
          totalCommission: 0,
          totalEarnings: 0,
          orderCount: 0,
          avgCommissionRate: 0,
        },
        earningsOverTime,
        commissionByType: commissionByType.reduce((acc, c) => {
          acc[c._id] = { amount: c.amount, count: c.count };
          return acc;
        }, {}),
        wallet: wallet
          ? {
              availableBalance: wallet.availableBalance,
              pendingBalance: wallet.pendingBalance,
              reservedBalance: wallet.reservedBalance,
              totalEarned: wallet.totalEarned,
              totalWithdrawn: wallet.totalWithdrawn,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error in getVendorEarnings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get top performing products
// @route   GET /api/reports/admin/top-products
// @access  Private (Admin)
exports.getTopProducts = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const dateMatch = {};
    if (startDate) dateMatch.$gte = new Date(startDate);
    if (endDate) {
      // Set endDate to end of day to include all records from that day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateMatch.$lte = end;
    }

    const topProducts = await OrderCommission.aggregate([
      {
        $match: {
          status: { $ne: 'refunded' },
          ...(startDate || endDate ? { createdAt: dateMatch } : {}),
        },
      },
      {
        $group: {
          _id: '$product',
          totalSales: { $sum: '$saleAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          unitsSold: { $sum: '$quantity' },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          productSku: '$product.sku',
          totalSales: 1,
          totalCommission: 1,
          unitsSold: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get payout statistics
// @route   GET /api/reports/admin/payouts
// @access  Private (Admin)
exports.getPayoutStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateMatch = {};
    if (startDate) dateMatch.$gte = new Date(startDate);
    if (endDate) dateMatch.$lte = new Date(endDate);

    // Payout by status
    const payoutsByStatus = await PayoutRequest.aggregate([
      {
        $match: startDate || endDate ? { createdAt: dateMatch } : {},
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$requestedAmount' },
          totalFees: { $sum: '$fees.totalFees' },
          totalNetAmount: { $sum: '$netAmount' },
        },
      },
    ]);

    // Payout by method
    const payoutsByMethod = await PayoutRequest.aggregate([
      {
        $match: {
          status: 'completed',
          ...(startDate || endDate ? { createdAt: dateMatch } : {}),
        },
      },
      {
        $group: {
          _id: '$paymentMethod.type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$requestedAmount' },
        },
      },
    ]);

    // Monthly payout trend
    const monthlyTrend = await PayoutRequest.aggregate([
      {
        $match: {
          status: 'completed',
          ...(startDate || endDate ? { completedAt: dateMatch } : {}),
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$completedAt' } },
          count: { $sum: 1 },
          totalAmount: { $sum: '$requestedAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: payoutsByStatus.reduce((acc, p) => {
          acc[p._id] = { count: p.count, totalAmount: p.totalAmount, totalFees: p.totalFees, netAmount: p.totalNetAmount };
          return acc;
        }, {}),
        byMethod: payoutsByMethod.reduce((acc, p) => {
          acc[p._id] = { count: p.count, totalAmount: p.totalAmount };
          return acc;
        }, {}),
        monthlyTrend,
      },
    });
  } catch (error) {
    console.error('Error in getPayoutStats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Export report data
// @route   POST /api/reports/export
// @access  Private (Admin)
exports.exportReport = async (req, res, next) => {
  try {
    const { reportType, format = 'csv', startDate, endDate } = req.body;

    let data;
    let filename;

    const dateMatch = {};
    if (startDate) dateMatch.$gte = new Date(startDate);
    if (endDate) dateMatch.$lte = new Date(endDate);

    switch (reportType) {
      case 'commissions':
        data = await OrderCommission.find(startDate || endDate ? { createdAt: dateMatch } : {})
          .populate('vendor', 'businessName email')
          .populate('product', 'name sku')
          .populate('order', 'orderNumber')
          .lean();
        filename = `commissions-${Date.now()}`;
        break;

      case 'payouts':
        data = await PayoutRequest.find(startDate || endDate ? { createdAt: dateMatch } : {})
          .populate('vendor', 'businessName email')
          .lean();
        filename = `payouts-${Date.now()}`;
        break;

      case 'vendor-earnings':
        data = await OrderCommission.aggregate([
          { $match: startDate || endDate ? { createdAt: dateMatch } : {} },
          {
            $group: {
              _id: '$vendor',
              totalSales: { $sum: '$saleAmount' },
              totalCommission: { $sum: '$commissionAmount' },
              totalEarnings: { $sum: '$vendorEarning' },
              orderCount: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: 'vendors',
              localField: '_id',
              foreignField: '_id',
              as: 'vendor',
            },
          },
          { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
        ]);
        filename = `vendor-earnings-${Date.now()}`;
        break;

      case 'revenue-summary':
        data = await FinancialSummary.find({
          scope: 'platform',
          ...(startDate || endDate ? { periodStart: dateMatch } : {}),
        }).lean();
        filename = `revenue-summary-${Date.now()}`;
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    if (format === 'csv') {
      if (data.length === 0) {
        return res.status(200).json({
          success: true,
          data: { csv: '', filename: `${filename}.csv` },
        });
      }

      const headers = Object.keys(flattenObject(data[0]));
      const csvRows = [headers.join(',')];

      for (const row of data) {
        const flat = flattenObject(row);
        const values = headers.map((h) => {
          const val = flat[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return val;
        });
        csvRows.push(values.join(','));
      }

      res.status(200).json({
        success: true,
        data: {
          csv: csvRows.join('\n'),
          filename: `${filename}.csv`,
        },
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          json: data,
          filename: `${filename}.json`,
        },
      });
    }
  } catch (error) {
    console.error('Error in exportReport:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper function to flatten nested objects
function flattenObject(obj, prefix = '') {
  const result = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !value._bsontype) {
        Object.assign(result, flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value);
      } else if (value instanceof Date) {
        result[newKey] = value.toISOString();
      } else if (value?._bsontype === 'ObjectId') {
        result[newKey] = value.toString();
      } else {
        result[newKey] = value;
      }
    }
  }

  return result;
}

// @desc    Manually trigger financial aggregation
// @route   POST /api/reports/admin/aggregate
// @access  Private (Admin)
exports.triggerAggregation = async (req, res, next) => {
  try {
    const { date, period = 'daily' } = req.body;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setDate(targetDate.getDate() - 1);

    const { aggregateFinancials } = require('../jobs/aggregateFinancials');
    await aggregateFinancials(targetDate, period);

    res.status(200).json({
      success: true,
      message: `Financial aggregation triggered for ${targetDate.toISOString().split('T')[0]}`,
    });
  } catch (error) {
    console.error('Error in triggerAggregation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
