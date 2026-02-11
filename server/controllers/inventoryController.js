const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const InventoryAlert = require('../models/InventoryAlert');
const InventoryLog = require('../models/InventoryLog');

// @desc    Get inventory alerts for vendor
// @route   GET /api/vendors/inventory/alerts
// @access  Private (Vendor)
exports.getVendorAlerts = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const { type, status = 'active', page = 1, limit = 20 } = req.query;

    const alerts = await InventoryAlert.getVendorAlerts(vendor._id, {
      type,
      status,
      limit: parseInt(limit),
      skip: (page - 1) * limit,
    });

    const total = await InventoryAlert.countDocuments({
      vendor: vendor._id,
      ...(status !== 'all' && { status }),
      ...(type && { type }),
    });

    res.json({
      success: true,
      data: alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread alert count
// @route   GET /api/vendors/inventory/alerts/count
// @access  Private (Vendor)
exports.getUnreadAlertCount = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const count = await InventoryAlert.getUnreadCount(vendor._id);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Acknowledge an alert
// @route   PATCH /api/vendors/inventory/alerts/:id/acknowledge
// @access  Private (Vendor)
exports.acknowledgeAlert = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const alert = await InventoryAlert.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const updatedAlert = await InventoryAlert.acknowledge(alert._id, req.user._id);

    res.json({
      success: true,
      message: 'Alert acknowledged',
      data: updatedAlert,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get low stock products
// @route   GET /api/vendors/inventory/low-stock
// @access  Private (Vendor)
exports.getLowStockProducts = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const { page = 1, limit = 20, includeOutOfStock = true } = req.query;

    const query = {
      vendor: vendor._id,
      'inventory.trackInventory': true,
      $expr: {
        $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'],
      },
    };

    if (!includeOutOfStock || includeOutOfStock === 'false') {
      query['inventory.quantity'] = { $gt: 0 };
    }

    const products = await Product.find(query)
      .select('name slug images inventory price status')
      .sort({ 'inventory.quantity': 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Adjust product inventory
// @route   POST /api/vendors/products/:id/inventory/adjust
// @access  Private (Vendor)
exports.adjustInventory = async (req, res) => {
  try {
    const { adjustment, reason, type = 'adjustment' } = req.body;

    if (typeof adjustment !== 'number') {
      return res.status(400).json({ success: false, message: 'Adjustment must be a number' });
    }

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const quantityBefore = product.inventory.quantity;
    const newQuantity = quantityBefore + adjustment;

    // Prevent negative inventory unless allowing backorders
    if (newQuantity < 0 && product.inventory.outOfStockBehavior !== 'allow_backorder') {
      return res.status(400).json({
        success: false,
        message: 'Adjustment would result in negative inventory',
      });
    }

    // Update product inventory
    product.inventory.quantity = newQuantity;
    if (adjustment > 0) {
      product.inventory.lastRestockedAt = new Date();
    }

    // Re-enable product if it was disabled due to stock
    if (newQuantity > 0 && product.inventory.isDisabledDueToStock) {
      product.inventory.isDisabledDueToStock = false;
    }

    await product.save();

    // Log the inventory change
    const log = await InventoryLog.logChange({
      product: product._id,
      vendor: vendor._id,
      type,
      quantityBefore,
      quantityChange: adjustment,
      reason,
      performedBy: req.user._id,
    });

    // Check and create alerts if needed
    await InventoryAlert.checkAndCreateAlert(product, vendor._id);

    res.json({
      success: true,
      message: 'Inventory adjusted',
      data: {
        product: {
          _id: product._id,
          name: product.name,
          inventory: product.inventory,
        },
        log,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get inventory logs for a product
// @route   GET /api/vendors/products/:id/inventory/logs
// @access  Private (Vendor)
exports.getProductInventoryLogs = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { type, page = 1, limit = 50, dateFrom, dateTo } = req.query;

    const logs = await InventoryLog.getProductHistory(product._id, {
      type,
      limit: parseInt(limit),
      skip: (page - 1) * limit,
      dateFrom,
      dateTo,
    });

    const total = await InventoryLog.countDocuments({
      product: product._id,
      ...(type && { type }),
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product inventory settings
// @route   PUT /api/vendors/products/:id/inventory
// @access  Private (Vendor)
exports.updateInventorySettings = async (req, res) => {
  try {
    const { lowStockThreshold, outOfStockBehavior, trackInventory } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (lowStockThreshold !== undefined) {
      product.inventory.lowStockThreshold = lowStockThreshold;
    }
    if (outOfStockBehavior !== undefined) {
      product.inventory.outOfStockBehavior = outOfStockBehavior;
    }
    if (trackInventory !== undefined) {
      product.inventory.trackInventory = trackInventory;
    }

    await product.save();

    // Check for alerts with new threshold
    await InventoryAlert.checkAndCreateAlert(product, vendor._id);

    res.json({
      success: true,
      message: 'Inventory settings updated',
      data: {
        _id: product._id,
        name: product.name,
        inventory: product.inventory,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get global low stock report
// @route   GET /api/admin/inventory/low-stock-report
// @access  Private (Admin)
exports.getGlobalLowStockReport = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    // Get summary stats
    const summaryPipeline = [
      {
        $match: {
          'inventory.trackInventory': true,
        },
      },
      {
        $addFields: {
          isLowStock: {
            $and: [
              { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] },
              { $gt: ['$inventory.quantity', 0] },
            ],
          },
          isOutOfStock: { $lte: ['$inventory.quantity', 0] },
        },
      },
      {
        $group: {
          _id: null,
          totalLowStock: { $sum: { $cond: ['$isLowStock', 1, 0] } },
          totalOutOfStock: { $sum: { $cond: ['$isOutOfStock', 1, 0] } },
        },
      },
    ];

    const [summary] = await Product.aggregate(summaryPipeline);

    // By vendor
    const byVendorPipeline = [
      {
        $match: {
          'inventory.trackInventory': true,
          $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] },
        },
      },
      {
        $addFields: {
          isOutOfStock: { $lte: ['$inventory.quantity', 0] },
        },
      },
      {
        $group: {
          _id: '$vendor',
          lowStock: { $sum: { $cond: [{ $not: '$isOutOfStock' }, 1, 0] } },
          outOfStock: { $sum: { $cond: ['$isOutOfStock', 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorInfo',
        },
      },
      { $unwind: '$vendorInfo' },
      {
        $project: {
          vendor: {
            _id: '$vendorInfo._id',
            storeName: '$vendorInfo.storeName',
          },
          lowStock: 1,
          outOfStock: 1,
        },
      },
      { $sort: { outOfStock: -1, lowStock: -1 } },
      { $limit: 10 },
    ];

    const byVendor = await Product.aggregate(byVendorPipeline);

    // Get products list
    const products = await Product.find({
      'inventory.trackInventory': true,
      $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] },
    })
      .populate('vendor', 'storeName')
      .populate('category', 'name')
      .select('name slug images inventory price vendor category')
      .sort({ 'inventory.quantity': 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments({
      'inventory.trackInventory': true,
      $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] },
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalLowStock: summary?.totalLowStock || 0,
          totalOutOfStock: summary?.totalOutOfStock || 0,
        },
        byVendor,
        products,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
