const TaxZone = require('../models/TaxZone');
const TaxRate = require('../models/TaxRate');
const TaxCategoryOverride = require('../models/TaxCategoryOverride');
const TaxExemption = require('../models/TaxExemption');
const Category = require('../models/Category');
const Vendor = require('../models/Vendor');

// ============ TAX ZONES ============

// @desc    Get all tax zones
// @route   GET /api/tax/zones
// @access  Private (Admin)
exports.getTaxZones = async (req, res) => {
  try {
    const { countryCode, isActive, page = 1, limit = 50 } = req.query;

    const query = {};
    if (countryCode) query.countryCode = countryCode.toUpperCase();
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const zones = await TaxZone.find(query)
      .sort({ priority: -1, countryCode: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TaxZone.countDocuments(query);

    res.json({
      success: true,
      data: zones,
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

// @desc    Get single tax zone
// @route   GET /api/tax/zones/:id
// @access  Private (Admin)
exports.getTaxZone = async (req, res) => {
  try {
    const zone = await TaxZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Tax zone not found' });
    }

    // Get rates for this zone
    const rates = await TaxRate.find({ zone: zone._id, isActive: true });

    res.json({
      success: true,
      data: { ...zone.toObject(), rates },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create tax zone
// @route   POST /api/tax/zones
// @access  Private (Admin)
exports.createTaxZone = async (req, res) => {
  try {
    const { name, description, countryCode, stateCode, city, zipPatterns, priority, isDefault } = req.body;

    if (!name || !countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Name and country code are required',
      });
    }

    const zone = await TaxZone.create({
      name,
      description,
      countryCode: countryCode.toUpperCase(),
      stateCode: stateCode?.toUpperCase(),
      city,
      zipPatterns,
      priority: priority || 0,
      isDefault: isDefault || false,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Tax zone created',
      data: zone,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update tax zone
// @route   PUT /api/tax/zones/:id
// @access  Private (Admin)
exports.updateTaxZone = async (req, res) => {
  try {
    const zone = await TaxZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Tax zone not found' });
    }

    const allowedUpdates = ['name', 'description', 'stateCode', 'city', 'zipPatterns', 'priority', 'isDefault', 'isActive'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        zone[field] = req.body[field];
      }
    });

    zone.updatedBy = req.user._id;
    await zone.save();

    res.json({
      success: true,
      message: 'Tax zone updated',
      data: zone,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete tax zone
// @route   DELETE /api/tax/zones/:id
// @access  Private (Admin)
exports.deleteTaxZone = async (req, res) => {
  try {
    const zone = await TaxZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Tax zone not found' });
    }

    // Check if zone has rates
    const ratesCount = await TaxRate.countDocuments({ zone: zone._id });
    if (ratesCount > 0) {
      // Soft delete
      zone.isActive = false;
      await zone.save();
      return res.json({
        success: true,
        message: 'Tax zone deactivated (has associated rates)',
      });
    }

    await zone.deleteOne();

    res.json({
      success: true,
      message: 'Tax zone deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ TAX RATES ============

// @desc    Get all tax rates
// @route   GET /api/tax/rates
// @access  Private (Admin)
exports.getTaxRates = async (req, res) => {
  try {
    const { zone, taxType, isActive, page = 1, limit = 50 } = req.query;

    const query = {};
    if (zone) query.zone = zone;
    if (taxType) query.taxType = taxType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const rates = await TaxRate.find(query)
      .populate('zone', 'name countryCode')
      .populate('categories', 'name slug')
      .sort({ priority: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TaxRate.countDocuments(query);

    res.json({
      success: true,
      data: rates,
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

// @desc    Create tax rate
// @route   POST /api/tax/rates
// @access  Private (Admin)
exports.createTaxRate = async (req, res) => {
  try {
    const {
      name, description, zone, taxType, rate, appliesTo,
      categories, isInclusive, isCompound, compoundOrder,
      displayName, showOnInvoice, showOnCheckout, startDate, endDate,
      legalReference, priority,
    } = req.body;

    if (!name || !zone || !taxType || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, zone, tax type, and rate are required',
      });
    }

    // Verify zone exists
    const zoneExists = await TaxZone.findById(zone);
    if (!zoneExists) {
      return res.status(404).json({ success: false, message: 'Tax zone not found' });
    }

    const taxRate = await TaxRate.create({
      name,
      description,
      zone,
      taxType,
      rate,
      appliesTo: appliesTo || 'all',
      categories,
      isInclusive: isInclusive || false,
      isCompound: isCompound || false,
      compoundOrder: compoundOrder || 0,
      displayName,
      showOnInvoice: showOnInvoice !== false,
      showOnCheckout: showOnCheckout !== false,
      startDate,
      endDate,
      legalReference,
      priority: priority || 0,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Tax rate created',
      data: taxRate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update tax rate
// @route   PUT /api/tax/rates/:id
// @access  Private (Admin)
exports.updateTaxRate = async (req, res) => {
  try {
    const taxRate = await TaxRate.findById(req.params.id);
    if (!taxRate) {
      return res.status(404).json({ success: false, message: 'Tax rate not found' });
    }

    const allowedUpdates = [
      'name', 'description', 'rate', 'appliesTo', 'categories',
      'isInclusive', 'isCompound', 'compoundOrder', 'displayName',
      'showOnInvoice', 'showOnCheckout', 'startDate', 'endDate',
      'legalReference', 'priority', 'isActive',
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        taxRate[field] = req.body[field];
      }
    });

    taxRate.updatedBy = req.user._id;
    await taxRate.save();

    res.json({
      success: true,
      message: 'Tax rate updated',
      data: taxRate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete tax rate
// @route   DELETE /api/tax/rates/:id
// @access  Private (Admin)
exports.deleteTaxRate = async (req, res) => {
  try {
    const taxRate = await TaxRate.findById(req.params.id);
    if (!taxRate) {
      return res.status(404).json({ success: false, message: 'Tax rate not found' });
    }

    // Soft delete
    taxRate.isActive = false;
    await taxRate.save();

    res.json({
      success: true,
      message: 'Tax rate deactivated',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ CATEGORY OVERRIDES ============

// @desc    Get category overrides
// @route   GET /api/tax/category-overrides
// @access  Private (Admin)
exports.getCategoryOverrides = async (req, res) => {
  try {
    const { zone, category, page = 1, limit = 50 } = req.query;

    const query = { isActive: true };
    if (zone) query.zone = zone;
    if (category) query.category = category;

    const overrides = await TaxCategoryOverride.find(query)
      .populate('category', 'name slug')
      .populate('zone', 'name countryCode')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TaxCategoryOverride.countDocuments(query);

    res.json({
      success: true,
      data: overrides,
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

// @desc    Create category override
// @route   POST /api/tax/category-overrides
// @access  Private (Admin)
exports.createCategoryOverride = async (req, res) => {
  try {
    const { category, zone, overrideType, customRate, includeSubcategories, reason, legalReference } = req.body;

    if (!category || !overrideType) {
      return res.status(400).json({
        success: false,
        message: 'Category and override type are required',
      });
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const override = await TaxCategoryOverride.create({
      category,
      zone: zone || null,
      overrideType,
      customRate,
      includeSubcategories: includeSubcategories !== false,
      reason,
      legalReference,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Category override created',
      data: override,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Override already exists for this category and zone',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update category override
// @route   PUT /api/tax/category-overrides/:id
// @access  Private (Admin)
exports.updateCategoryOverride = async (req, res) => {
  try {
    const override = await TaxCategoryOverride.findById(req.params.id);
    if (!override) {
      return res.status(404).json({ success: false, message: 'Override not found' });
    }

    const allowedUpdates = ['overrideType', 'customRate', 'includeSubcategories', 'reason', 'legalReference', 'startDate', 'endDate', 'isActive'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        override[field] = req.body[field];
      }
    });

    override.updatedBy = req.user._id;
    await override.save();

    res.json({
      success: true,
      message: 'Category override updated',
      data: override,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete category override
// @route   DELETE /api/tax/category-overrides/:id
// @access  Private (Admin)
exports.deleteCategoryOverride = async (req, res) => {
  try {
    const override = await TaxCategoryOverride.findById(req.params.id);
    if (!override) {
      return res.status(404).json({ success: false, message: 'Override not found' });
    }

    override.isActive = false;
    await override.save();

    res.json({
      success: true,
      message: 'Category override deactivated',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ TAX EXEMPTIONS ============

// @desc    Get exemptions
// @route   GET /api/tax/exemptions
// @access  Private (Admin)
exports.getExemptions = async (req, res) => {
  try {
    const { entityType, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (entityType) query.entityType = entityType;
    if (status) query.status = status;

    const exemptions = await TaxExemption.find(query)
      .populate('entityRef', 'storeName email profile')
      .populate('zones', 'name countryCode')
      .populate('verifiedBy', 'email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TaxExemption.countDocuments(query);

    res.json({
      success: true,
      data: exemptions,
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

// @desc    Apply for exemption (Vendor)
// @route   POST /api/tax/exemptions
// @access  Private (Vendor)
exports.applyForExemption = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const {
      exemptionType, partialRate, certificateNumber, certificateType,
      certificateFile, issuingAuthority, issueDate, validFrom, validUntil,
      zones, taxTypes, notes,
    } = req.body;

    if (!certificateNumber || !validFrom || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Certificate number, valid from, and valid until dates are required',
      });
    }

    const exemption = await TaxExemption.create({
      entityType: 'vendor',
      entityRef: vendor._id,
      exemptionType: exemptionType || 'full',
      partialRate,
      certificateNumber,
      certificateType,
      certificateFile,
      issuingAuthority,
      issueDate,
      validFrom,
      validUntil,
      zones: zones || [],
      taxTypes: taxTypes || [],
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Exemption application submitted',
      data: exemption,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify exemption (Admin)
// @route   PUT /api/admin/tax/exemptions/:id/verify
// @access  Private (Admin)
exports.verifyExemption = async (req, res) => {
  try {
    const { notes } = req.body;

    const exemption = await TaxExemption.findById(req.params.id);
    if (!exemption) {
      return res.status(404).json({ success: false, message: 'Exemption not found' });
    }

    await exemption.verify(req.user._id, notes);

    res.json({
      success: true,
      message: 'Exemption verified',
      data: exemption,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject exemption (Admin)
// @route   PUT /api/admin/tax/exemptions/:id/reject
// @access  Private (Admin)
exports.rejectExemption = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const exemption = await TaxExemption.findById(req.params.id);
    if (!exemption) {
      return res.status(404).json({ success: false, message: 'Exemption not found' });
    }

    await exemption.reject(req.user._id, reason);

    res.json({
      success: true,
      message: 'Exemption rejected',
      data: exemption,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ TAX CALCULATION ============

// @desc    Calculate tax for cart/order
// @route   POST /api/tax/calculate
// @access  Public
exports.calculateTax = async (req, res) => {
  try {
    const { items, shippingAddress, customerId, vendorId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required',
      });
    }

    if (!shippingAddress || !shippingAddress.country) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address with country is required',
      });
    }

    // Determine tax zone
    const zone = await TaxZone.findMatchingZone(shippingAddress);

    if (!zone) {
      return res.json({
        success: true,
        data: {
          zoneNotFound: true,
          totalTax: 0,
          breakdown: [],
          message: 'No tax zone found for the shipping address',
        },
      });
    }

    // Check for customer exemption
    let customerExemption = null;
    if (customerId) {
      const exemptionCheck = await TaxExemption.checkExemption('customer', customerId, zone._id);
      if (exemptionCheck.isExempt) {
        customerExemption = exemptionCheck.exemption;
      }
    }

    // Check for vendor exemption
    let vendorExemption = null;
    if (vendorId) {
      const exemptionCheck = await TaxExemption.checkExemption('vendor', vendorId, zone._id);
      if (exemptionCheck.isExempt) {
        vendorExemption = exemptionCheck.exemption;
      }
    }

    // Calculate tax using TaxRate model
    const taxResult = await TaxRate.calculateTax(zone._id, items, {
      shippingAmount: shippingAddress.shippingCost || 0,
    });

    // Apply exemptions if any
    let adjustedTotalTax = taxResult.totalTax;
    const adjustedBreakdown = [...taxResult.breakdown];

    if (customerExemption) {
      const exemptionRate = customerExemption.rate / 100;
      adjustedTotalTax = adjustedTotalTax * (1 - exemptionRate);
      adjustedBreakdown.forEach(item => {
        item.exemptionApplied = customerExemption.rate;
        item.originalTaxAmount = item.taxAmount;
        item.taxAmount = item.taxAmount * (1 - exemptionRate);
      });
    }

    res.json({
      success: true,
      data: {
        zone: {
          id: zone._id,
          name: zone.name,
          countryCode: zone.countryCode,
        },
        totalTax: Math.round(adjustedTotalTax * 100) / 100,
        breakdown: adjustedBreakdown,
        rates: taxResult.rates,
        exemptions: {
          customer: customerExemption,
          vendor: vendorExemption,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get applicable rates for an address
// @route   GET /api/tax/rates-for-address
// @access  Public
exports.getRatesForAddress = async (req, res) => {
  try {
    const { country, state, city, zipCode } = req.query;

    if (!country) {
      return res.status(400).json({ success: false, message: 'Country is required' });
    }

    const zone = await TaxZone.findMatchingZone({ country, state, city, zipCode });

    if (!zone) {
      return res.json({
        success: true,
        data: {
          zoneNotFound: true,
          rates: [],
        },
      });
    }

    const rates = await TaxRate.getRatesForZone(zone._id);

    res.json({
      success: true,
      data: {
        zone: {
          id: zone._id,
          name: zone.name,
          countryCode: zone.countryCode,
        },
        rates: rates.map(r => ({
          id: r._id,
          name: r.effectiveName,
          type: r.taxType,
          rate: r.rate,
          isInclusive: r.isInclusive,
          appliesTo: r.appliesTo,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Setup Pakistan defaults
// @route   POST /api/tax/setup-pakistan
// @access  Private (Admin)
exports.setupPakistanDefaults = async (req, res) => {
  try {
    const zone = await TaxZone.setupPakistanDefaults();
    const rate = await TaxRate.setupPakistanDefaults(zone._id);

    res.json({
      success: true,
      message: 'Pakistan tax defaults configured',
      data: { zone, rate },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
