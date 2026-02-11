const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Search by email
    if (req.query.search) {
      query.email = { $regex: req.query.search, $options: 'i' };
    }

    const users = await User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Also delete associated vendor if exists
    await Vendor.findOneAndDelete({ user: req.params.id });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vendors
// @route   GET /api/admin/vendors
// @access  Private (Admin)
const getVendors = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by approval status
    if (req.query.status === 'pending') {
      query.isApproved = false;
    } else if (req.query.status === 'approved') {
      query.isApproved = true;
    }

    const vendors = await Vendor.find(query)
      .populate('user', 'email profile')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Vendor.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve vendor
// @route   PUT /api/admin/vendors/:id/approve
// @access  Private (Admin)
const approveVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).populate('user', 'email profile');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject vendor
// @route   PUT /api/admin/vendors/:id/reject
// @access  Private (Admin)
const rejectVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    // Update user role back to customer
    await User.findByIdAndUpdate(vendor.user, { role: 'customer' });

    res.status(200).json({
      success: true,
      message: 'Vendor rejected and removed',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend vendor
// @route   PUT /api/admin/vendors/:id/suspend
// @access  Private (Admin)
const suspendVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).populate('user', 'email profile');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin)
const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
      .populate('customer', 'email profile')
      .populate('items.vendor', 'storeName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res, next) => {
  try {
    const [userStats, vendorStats, productStats, orderStats, revenueStats] = await Promise.all([
      // User stats
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]),

      // Vendor stats
      Vendor.aggregate([
        {
          $group: {
            _id: '$isApproved',
            count: { $sum: 1 },
          },
        },
      ]),

      // Product stats
      Product.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Order stats
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$totals.total' },
          },
        },
      ]),

      // Revenue by month (last 12 months)
      Order.aggregate([
        {
          $match: {
            'payment.status': 'paid',
            createdAt: {
              $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$totals.total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: userStats,
        vendors: vendorStats,
        products: productStats,
        orders: orderStats,
        revenueByMonth: revenueStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  getVendors,
  approveVendor,
  rejectVendor,
  suspendVendor,
  getAllOrders,
  getAnalytics,
};
