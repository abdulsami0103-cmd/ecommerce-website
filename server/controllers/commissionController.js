const CommissionRule = require('../models/CommissionRule');
const OrderCommission = require('../models/OrderCommission');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');

// @desc    Get all commission rules
// @route   GET /api/commission/rules
// @access  Private (Admin)
exports.getCommissionRules = async (req, res) => {
  try {
    const { scope, type, isActive, page = 1, limit = 50 } = req.query;

    const query = {};
    if (scope) query.scope = scope;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const rules = await CommissionRule.find(query)
      .populate('scopeRef', 'name storeName slug')
      .sort({ scope: 1, priority: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CommissionRule.countDocuments(query);

    res.json({
      success: true,
      data: rules,
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

// @desc    Get single commission rule
// @route   GET /api/commission/rules/:id
// @access  Private (Admin)
exports.getCommissionRule = async (req, res) => {
  try {
    const rule = await CommissionRule.findById(req.params.id)
      .populate('scopeRef', 'name storeName slug')
      .populate('createdBy', 'email profile');

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Commission rule not found' });
    }

    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create commission rule
// @route   POST /api/commission/rules
// @access  Private (Admin)
exports.createCommissionRule = async (req, res) => {
  try {
    const {
      name,
      description,
      scope,
      scopeRef,
      type,
      value,
      tiers,
      tierPeriod,
      includeSubcategories,
      startDate,
      endDate,
      priority,
    } = req.body;

    // Validation
    if (!name || !scope || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name, scope, and type are required',
      });
    }

    // Validate scope reference
    if (scope !== 'platform' && !scopeRef) {
      return res.status(400).json({
        success: false,
        message: 'Scope reference is required for non-platform rules',
      });
    }

    // Validate type-specific fields
    if (type === 'tiered' && (!tiers || tiers.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Tiers are required for tiered commission type',
      });
    }

    if (['fixed', 'percentage'].includes(type) && (value === undefined || value === null)) {
      return res.status(400).json({
        success: false,
        message: 'Value is required for fixed/percentage commission type',
      });
    }

    const rule = await CommissionRule.create({
      name,
      description,
      scope,
      scopeRef: scope === 'platform' ? null : scopeRef,
      type,
      value,
      tiers,
      tierPeriod,
      includeSubcategories,
      startDate,
      endDate,
      priority: priority || 0,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Commission rule created',
      data: rule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update commission rule
// @route   PUT /api/commission/rules/:id
// @access  Private (Admin)
exports.updateCommissionRule = async (req, res) => {
  try {
    const rule = await CommissionRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Commission rule not found' });
    }

    const allowedUpdates = [
      'name', 'description', 'type', 'value', 'tiers', 'tierPeriod',
      'includeSubcategories', 'startDate', 'endDate', 'isActive', 'priority',
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        rule[field] = req.body[field];
      }
    });

    rule.updatedBy = req.user._id;
    await rule.save();

    res.json({
      success: true,
      message: 'Commission rule updated',
      data: rule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete commission rule
// @route   DELETE /api/commission/rules/:id
// @access  Private (Admin)
exports.deleteCommissionRule = async (req, res) => {
  try {
    const rule = await CommissionRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Commission rule not found' });
    }

    // Check if rule is in use
    const inUse = await OrderCommission.countDocuments({ commissionRule: rule._id });
    if (inUse > 0) {
      // Soft delete - just deactivate
      rule.isActive = false;
      await rule.save();
      return res.json({
        success: true,
        message: 'Commission rule deactivated (has historical usage)',
      });
    }

    await rule.deleteOne();

    res.json({
      success: true,
      message: 'Commission rule deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get applicable rule for a product
// @route   GET /api/commission/rules/product/:productId
// @access  Private (Admin/Vendor)
exports.getProductRule = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate('category', 'name ancestors');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const rule = await CommissionRule.findApplicableRule(
      product._id,
      product.category._id,
      product.category.ancestors,
      product.vendor
    );

    if (!rule) {
      // Return vendor's plan default
      const vendor = await Vendor.findById(product.vendor).populate('currentPlan');
      const defaultRate = vendor?.currentPlan?.commissionRate || 10;

      return res.json({
        success: true,
        data: {
          source: 'plan_default',
          type: 'percentage',
          value: defaultRate,
          name: `${vendor?.currentPlan?.name || 'Default'} Plan Rate`,
        },
      });
    }

    res.json({
      success: true,
      data: {
        source: rule.scope,
        type: rule.type,
        value: rule.type === 'tiered' ? null : rule.value,
        tiers: rule.type === 'tiered' ? rule.tiers : null,
        name: rule.name,
        ruleId: rule._id,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Preview/calculate commission for order items
// @route   POST /api/commission/calculate
// @access  Private (Admin/Vendor)
exports.calculateCommission = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required',
      });
    }

    const results = [];
    let totalSaleAmount = 0;
    let totalCommission = 0;
    let totalVendorEarning = 0;

    for (const item of items) {
      const { productId, quantity, price, vendorId } = item;

      const product = await Product.findById(productId)
        .populate('category', 'name ancestors');

      if (!product) {
        results.push({
          productId,
          error: 'Product not found',
        });
        continue;
      }

      const vendor = await Vendor.findById(vendorId || product.vendor)
        .populate('currentPlan');

      // Find applicable rule
      let rule = await CommissionRule.findApplicableRule(
        product._id,
        product.category._id,
        product.category.ancestors,
        vendor._id
      );

      // Get vendor's period sales for tiered calculation
      let periodSales = 0;
      if (rule?.type === 'tiered') {
        periodSales = await OrderCommission.getVendorPeriodSales(
          vendor._id,
          rule.tierPeriod
        );
      }

      // Calculate using rule or plan default
      const saleAmount = (price || product.price.amount) * quantity;
      let calculation;

      if (rule) {
        calculation = rule.calculateCommission(saleAmount, periodSales);
      } else {
        // Plan default
        const rate = vendor?.currentPlan?.commissionRate || 10;
        calculation = {
          commissionAmount: Math.round((saleAmount * rate / 100) * 100) / 100,
          vendorEarning: Math.round((saleAmount * (100 - rate) / 100) * 100) / 100,
          appliedRate: rate,
          tierLevel: null,
        };
      }

      results.push({
        productId,
        productName: product.name,
        vendorId: vendor._id,
        vendorName: vendor.storeName,
        quantity,
        unitPrice: price || product.price.amount,
        saleAmount,
        rule: rule ? {
          id: rule._id,
          name: rule.name,
          scope: rule.scope,
          type: rule.type,
        } : { name: 'Plan Default', type: 'percentage' },
        ...calculation,
      });

      totalSaleAmount += saleAmount;
      totalCommission += calculation.commissionAmount;
      totalVendorEarning += calculation.vendorEarning;
    }

    res.json({
      success: true,
      data: {
        items: results,
        summary: {
          totalSaleAmount: Math.round(totalSaleAmount * 100) / 100,
          totalCommission: Math.round(totalCommission * 100) / 100,
          totalVendorEarning: Math.round(totalVendorEarning * 100) / 100,
          effectiveRate: totalSaleAmount > 0
            ? Math.round((totalCommission / totalSaleAmount * 100) * 100) / 100
            : 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vendor commission summary
// @route   GET /api/commission/vendor/:vendorId/summary
// @access  Private (Admin/Vendor)
exports.getVendorCommissionSummary = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify access
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (!vendor || vendor._id.toString() !== vendorId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const summary = await OrderCommission.getVendorCommissionSummary(vendorId, startDate, endDate);

    // Get monthly breakdown
    const monthlyBreakdown = await OrderCommission.aggregate([
      {
        $match: {
          vendor: require('mongoose').Types.ObjectId(vendorId),
          status: { $nin: ['cancelled'] },
          ...(startDate && { createdAt: { $gte: new Date(startDate) } }),
          ...(endDate && { createdAt: { $lte: new Date(endDate) } }),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          sales: { $sum: '$saleAmount' },
          commission: { $sum: '$commissionAmount' },
          earnings: { $sum: '$vendorEarning' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      data: {
        summary,
        monthlyBreakdown: monthlyBreakdown.map(m => ({
          period: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          ...m,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order commission details
// @route   GET /api/commission/order/:orderId
// @access  Private (Admin/Vendor)
exports.getOrderCommissions = async (req, res) => {
  try {
    const commissions = await OrderCommission.find({ order: req.params.orderId })
      .populate('product', 'name slug images')
      .populate('vendor', 'storeName')
      .populate('commissionRule', 'name scope type');

    res.json({
      success: true,
      data: commissions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to calculate and store commissions for an order
// Called from orderController when order is created
exports.calculateOrderCommissions = async (order) => {
  const commissions = [];

  for (const item of order.items) {
    const product = await Product.findById(item.product)
      .populate('category', 'ancestors');

    const vendor = await Vendor.findById(item.vendor)
      .populate('currentPlan');

    // Find applicable rule
    let rule = await CommissionRule.findApplicableRule(
      product._id,
      product.category._id,
      product.category.ancestors,
      vendor._id
    );

    // Get vendor's period sales for tiered calculation
    let periodSales = 0;
    if (rule?.type === 'tiered') {
      periodSales = await OrderCommission.getVendorPeriodSales(
        vendor._id,
        rule.tierPeriod
      );
    }

    // Calculate commission
    const saleAmount = item.price * item.quantity;
    let calculation;
    let commissionType;

    if (rule) {
      calculation = rule.calculateCommission(saleAmount, periodSales);
      commissionType = rule.type;
    } else {
      // Plan default
      const rate = vendor?.currentPlan?.commissionRate || 10;
      calculation = {
        commissionAmount: Math.round((saleAmount * rate / 100) * 100) / 100,
        vendorEarning: Math.round((saleAmount * (100 - rate) / 100) * 100) / 100,
        appliedRate: rate,
        tierLevel: null,
      };
      commissionType = 'plan_default';
    }

    // Create commission record
    const commission = await OrderCommission.create({
      order: order._id,
      orderItem: item._id,
      vendor: vendor._id,
      product: product._id,
      saleAmount,
      quantity: item.quantity,
      unitPrice: item.price,
      commissionRule: rule?._id,
      commissionType,
      commissionRate: calculation.appliedRate,
      tierLevel: calculation.tierLevel,
      commissionAmount: calculation.commissionAmount,
      vendorEarning: calculation.vendorEarning,
      appliedRuleSnapshot: rule ? {
        name: rule.name,
        scope: rule.scope,
        type: rule.type,
        value: rule.value,
        ruleId: rule._id,
      } : {
        name: 'Plan Default',
        scope: 'platform',
        type: 'percentage',
        value: calculation.appliedRate,
      },
    });

    commissions.push(commission);
  }

  return commissions;
};
