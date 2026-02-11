const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');

/**
 * @desc    Create a new coupon
 * @route   POST /api/coupons
 * @access  Admin/Vendor
 */
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      scope,
      applicableCategories,
      applicableProducts,
      minPurchase,
      maxDiscount,
      startsAt,
      expiresAt,
      usageLimit,
      perUserLimit,
      stackable,
      autoApply,
      commissionAbsorber,
      buyXGetY,
      firstOrderOnly,
      customerGroups,
      minItems,
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists',
      });
    }

    const couponData = {
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      scope: scope || 'platform',
      applicableCategories: applicableCategories || [],
      applicableProducts: applicableProducts || [],
      minPurchase: minPurchase || 0,
      maxDiscount,
      startsAt: startsAt || new Date(),
      expiresAt,
      usageLimit,
      perUserLimit: perUserLimit || 1,
      stackable: stackable || false,
      autoApply: autoApply || false,
      commissionAbsorber: commissionAbsorber || 'platform',
      firstOrderOnly: firstOrderOnly || false,
      customerGroups: customerGroups || [],
      minItems: minItems || 0,
    };

    // If vendor is creating, set vendor and scope
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor profile not found',
        });
      }
      couponData.vendor = vendor._id;
      couponData.scope = 'vendor';
      // Vendors can only absorb their own discounts
      couponData.commissionAbsorber = 'vendor';
    }

    // Handle buy X get Y type
    if (type === 'buy_x_get_y' && buyXGetY) {
      couponData.buyXGetY = {
        buyQuantity: buyXGetY.buyQuantity || 0,
        getQuantity: buyXGetY.getQuantity || 0,
        getDiscount: buyXGetY.getDiscount || 100,
      };
    }

    const coupon = await Coupon.create(couponData);

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating coupon',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all coupons (admin)
 * @route   GET /api/coupons
 * @access  Admin
 */
exports.getCoupons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      scope,
      vendor,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Status filter
    if (status === 'active') {
      query.isActive = true;
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.expiresAt = { $lt: new Date() };
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Scope filter
    if (scope) {
      query.scope = scope;
    }

    // Vendor filter
    if (vendor) {
      query.vendor = vendor;
    }

    // Search by code or name
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate('vendor', 'storeName businessName')
        .populate('applicableCategories', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Coupon.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: coupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupons',
      error: error.message,
    });
  }
};

/**
 * @desc    Get vendor's coupons
 * @route   GET /api/vendor/coupons
 * @access  Vendor
 */
exports.getVendorCoupons = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
      });
    }

    const { page = 1, limit = 20, status } = req.query;

    const query = { vendor: vendor._id };

    if (status === 'active') {
      query.isActive = true;
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.expiresAt = { $lt: new Date() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Coupon.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: coupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupons',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single coupon
 * @route   GET /api/coupons/:id
 * @access  Admin/Vendor
 */
exports.getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('vendor', 'storeName businessName')
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'name images');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    // Check vendor access
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (!vendor || coupon.vendor?.toString() !== vendor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this coupon',
        });
      }
    }

    res.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupon',
      error: error.message,
    });
  }
};

/**
 * @desc    Validate coupon code (public for checkout)
 * @route   GET /api/coupons/validate/:code
 * @access  Public
 */
exports.validateCouponCode = async (req, res) => {
  try {
    const { code } = req.params;
    const { cartTotal, cartItems, vendorId } = req.query;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code',
      });
    }

    // Check if it's a vendor coupon and matches the vendor
    if (coupon.vendor && vendorId && coupon.vendor.toString() !== vendorId) {
      return res.status(400).json({
        success: false,
        message: 'This coupon is not valid for this vendor',
      });
    }

    // Check user's first order status
    let isFirstOrder = true;
    if (req.user) {
      const orderCount = await Order.countDocuments({
        customer: req.user._id,
        status: { $ne: 'cancelled' },
      });
      isFirstOrder = orderCount === 0;
    }

    // Parse cart items if provided
    let parsedCartItems = [];
    if (cartItems) {
      try {
        parsedCartItems = JSON.parse(cartItems);
      } catch (e) {
        // Ignore parse errors
      }
    }

    const validation = coupon.isValid(req.user?._id, parseFloat(cartTotal) || 0, {
      cartItems: parsedCartItems,
      isFirstOrder,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // Calculate potential discount
    const discount = coupon.calculateDiscount(parseFloat(cartTotal) || 0, {
      cartItems: parsedCartItems,
    });

    res.json({
      success: true,
      data: {
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discount,
        minPurchase: coupon.minPurchase,
        maxDiscount: coupon.maxDiscount,
        expiresAt: coupon.expiresAt,
        stackable: coupon.stackable,
      },
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating coupon',
      error: error.message,
    });
  }
};

/**
 * @desc    Apply coupon to cart
 * @route   POST /api/coupons/apply
 * @access  Customer
 */
exports.applyCoupon = async (req, res) => {
  try {
    const { code, cartTotal, cartItems, shippingCost, vendorId } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code',
      });
    }

    // Check vendor restriction
    if (coupon.vendor && vendorId && coupon.vendor.toString() !== vendorId) {
      return res.status(400).json({
        success: false,
        message: 'This coupon is not valid for this vendor',
      });
    }

    // Check user's first order status
    let isFirstOrder = true;
    if (req.user) {
      const orderCount = await Order.countDocuments({
        customer: req.user._id,
        status: { $ne: 'cancelled' },
      });
      isFirstOrder = orderCount === 0;
    }

    const validation = coupon.isValid(req.user._id, cartTotal, {
      cartItems,
      isFirstOrder,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const discount = coupon.calculateDiscount(cartTotal, {
      cartItems,
      shippingCost,
    });

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        discount,
        stackable: coupon.stackable,
        couponId: coupon._id,
      },
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying coupon',
      error: error.message,
    });
  }
};

/**
 * @desc    Get auto-apply coupons for checkout
 * @route   GET /api/coupons/auto-apply
 * @access  Customer
 */
exports.getAutoApplyCoupons = async (req, res) => {
  try {
    const { cartTotal, vendorId } = req.query;

    const coupons = await Coupon.findAutoApplyCoupons({
      vendorId,
      cartTotal: parseFloat(cartTotal) || 0,
    });

    // Filter valid coupons for user
    const validCoupons = [];
    for (const coupon of coupons) {
      const validation = coupon.isValid(req.user?._id, parseFloat(cartTotal) || 0);
      if (validation.valid) {
        const discount = coupon.calculateDiscount(parseFloat(cartTotal) || 0);
        validCoupons.push({
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value,
          discount,
          stackable: coupon.stackable,
        });
      }
    }

    res.json({
      success: true,
      data: validCoupons,
    });
  } catch (error) {
    console.error('Error fetching auto-apply coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupons',
      error: error.message,
    });
  }
};

/**
 * @desc    Update coupon
 * @route   PUT /api/coupons/:id
 * @access  Admin/Vendor
 */
exports.updateCoupon = async (req, res) => {
  try {
    let coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    // Check vendor access
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (!vendor || coupon.vendor?.toString() !== vendor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this coupon',
        });
      }
    }

    // Don't allow changing code if coupon has been used
    if (req.body.code && coupon.usedCount > 0 && req.body.code.toUpperCase() !== coupon.code) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change coupon code after it has been used',
      });
    }

    const allowedUpdates = [
      'name',
      'description',
      'value',
      'minPurchase',
      'maxDiscount',
      'startsAt',
      'expiresAt',
      'usageLimit',
      'perUserLimit',
      'stackable',
      'autoApply',
      'isActive',
      'applicableCategories',
      'applicableProducts',
      'firstOrderOnly',
      'customerGroups',
      'minItems',
    ];

    // Admin can update more fields
    if (req.user.role === 'admin') {
      allowedUpdates.push('type', 'scope', 'commissionAbsorber', 'buyXGetY', 'vendor');
    }

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating coupon',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete coupon
 * @route   DELETE /api/coupons/:id
 * @access  Admin/Vendor
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    // Check vendor access
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (!vendor || coupon.vendor?.toString() !== vendor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this coupon',
        });
      }
    }

    // Don't delete if coupon has been used, just deactivate
    if (coupon.usedCount > 0) {
      coupon.isActive = false;
      await coupon.save();
      return res.json({
        success: true,
        message: 'Coupon has been deactivated (cannot delete used coupons)',
      });
    }

    await coupon.deleteOne();

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting coupon',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle coupon status
 * @route   PUT /api/coupons/:id/toggle
 * @access  Admin/Vendor
 */
exports.toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    // Check vendor access
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (!vendor || coupon.vendor?.toString() !== vendor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this coupon',
        });
      }
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: coupon,
    });
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating coupon',
      error: error.message,
    });
  }
};

/**
 * @desc    Get coupon statistics
 * @route   GET /api/coupons/:id/stats
 * @access  Admin/Vendor
 */
exports.getCouponStats = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    // Check vendor access
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (!vendor || coupon.vendor?.toString() !== vendor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this coupon',
        });
      }
    }

    const stats = await CouponUsage.getCouponStats(coupon._id);

    // Get usage over time
    const usageOverTime = await CouponUsage.aggregate([
      { $match: { coupon: coupon._id } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$usedAt' },
          },
          count: { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    res.json({
      success: true,
      data: {
        coupon: {
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value,
          usageLimit: coupon.usageLimit,
          usedCount: coupon.usedCount,
          expiresAt: coupon.expiresAt,
          isActive: coupon.isActive,
        },
        stats,
        usageOverTime,
      },
    });
  } catch (error) {
    console.error('Error fetching coupon stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Record coupon usage (called from order creation)
 * @access  Internal
 */
exports.recordCouponUsage = async (couponId, data) => {
  const { customerId, orderId, subOrderId, vendorId, discountAmount, orderTotal, absorbedBy } = data;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) return;

  // Create usage record
  await CouponUsage.create({
    coupon: couponId,
    customer: customerId,
    order: orderId,
    subOrder: subOrderId,
    vendor: vendorId,
    couponCode: coupon.code,
    discountAmount,
    orderTotal,
    discountType: coupon.type,
    absorbedBy: absorbedBy || coupon.commissionAbsorber,
    platformAbsorption: absorbedBy === 'platform' ? discountAmount : (absorbedBy === 'split' ? discountAmount / 2 : 0),
    vendorAbsorption: absorbedBy === 'vendor' ? discountAmount : (absorbedBy === 'split' ? discountAmount / 2 : 0),
  });

  // Update coupon usedCount and usedBy
  coupon.usedCount += 1;

  const existingUsage = coupon.usedBy.find(u => u.user?.toString() === customerId.toString());
  if (existingUsage) {
    existingUsage.count += 1;
  } else {
    coupon.usedBy.push({ user: customerId, count: 1 });
  }

  await coupon.save();
};

/**
 * @desc    Get coupon dashboard stats (admin)
 * @route   GET /api/admin/coupons/stats
 * @access  Admin
 */
exports.getCouponDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      platformCoupons,
      vendorCoupons,
      totalUsage,
    ] = await Promise.all([
      Coupon.countDocuments(),
      Coupon.countDocuments({ isActive: true, expiresAt: { $gt: now } }),
      Coupon.countDocuments({ expiresAt: { $lt: now } }),
      Coupon.countDocuments({ vendor: null }),
      Coupon.countDocuments({ vendor: { $ne: null } }),
      CouponUsage.aggregate([
        {
          $group: {
            _id: null,
            totalUsage: { $sum: 1 },
            totalDiscount: { $sum: '$discountAmount' },
            totalRevenue: { $sum: '$orderTotal' },
          },
        },
      ]),
    ]);

    // Top performing coupons
    const topCoupons = await CouponUsage.aggregate([
      {
        $group: {
          _id: '$coupon',
          usageCount: { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' },
          totalRevenue: { $sum: '$orderTotal' },
        },
      },
      { $sort: { usageCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'coupons',
          localField: '_id',
          foreignField: '_id',
          as: 'coupon',
        },
      },
      { $unwind: '$coupon' },
      {
        $project: {
          code: '$coupon.code',
          name: '$coupon.name',
          usageCount: 1,
          totalDiscount: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        platformCoupons,
        vendorCoupons,
        totalUsage: totalUsage[0]?.totalUsage || 0,
        totalDiscount: totalUsage[0]?.totalDiscount || 0,
        totalRevenue: totalUsage[0]?.totalRevenue || 0,
        topCoupons,
      },
    });
  } catch (error) {
    console.error('Error fetching coupon dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};
