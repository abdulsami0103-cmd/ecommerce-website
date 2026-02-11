const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Register as vendor
// @route   POST /api/vendors/register
// @access  Private
const registerVendor = async (req, res, next) => {
  try {
    const { storeName, description, contactEmail, contactPhone, address } = req.body;

    // Check if user is already a vendor
    const existingVendor = await Vendor.findOne({ user: req.user.id });
    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered as a vendor',
      });
    }

    // Create vendor
    const vendor = await Vendor.create({
      user: req.user.id,
      storeName,
      description,
      contactEmail: contactEmail || req.user.email,
      contactPhone,
      address,
    });

    // Update user role to vendor
    await User.findByIdAndUpdate(req.user.id, { role: 'vendor' });

    res.status(201).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Public
const getVendors = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { isApproved: true, isActive: true };

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

// @desc    Get vendor by slug
// @route   GET /api/vendors/:slug
// @access  Public
const getVendorBySlug = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({
      storeSlug: req.params.slug,
      isApproved: true,
      isActive: true,
    }).populate('user', 'email profile');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    // Get product count
    const productCount = await Product.countDocuments({
      vendor: vendor._id,
      status: 'active',
    });

    res.status(200).json({
      success: true,
      data: {
        ...vendor.toObject(),
        productCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private (Vendor)
const updateVendorProfile = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
      });
    }

    const allowedFields = [
      'storeName',
      'description',
      'logo',
      'banner',
      'contactEmail',
      'contactPhone',
      'address',
      'shipping',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        vendor[field] = req.body[field];
      }
    });

    await vendor.save();

    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor dashboard stats
// @route   GET /api/vendors/dashboard
// @access  Private (Vendor)
const getDashboard = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
      });
    }

    // Get stats
    const [productCount, orderStats, recentOrders] = await Promise.all([
      Product.countDocuments({ vendor: vendor._id }),
      Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.vendor': vendor._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$items.status', 'pending'] }, 1, 0] },
            },
          },
        },
      ]),
      Order.find({ 'items.vendor': vendor._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customer', 'profile.firstName profile.lastName'),
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        vendor,
        stats: {
          products: productCount,
          orders: stats.totalOrders,
          revenue: stats.totalRevenue,
          pendingOrders: stats.pendingOrders,
          payoutBalance: vendor.payoutBalance,
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor's own profile
// @route   GET /api/vendors/me
// @access  Private (Vendor)
const getMyVendorProfile = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id }).populate(
      'user',
      'email profile'
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
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

module.exports = {
  registerVendor,
  getVendors,
  getVendorBySlug,
  updateVendorProfile,
  getDashboard,
  getMyVendorProfile,
};
