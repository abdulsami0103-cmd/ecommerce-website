const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema({
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number }, // null = unlimited
  rate: { type: Number, required: true }, // percentage or fixed amount
}, { _id: false });

const commissionRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
  },

  // Scope determines priority: product > category > vendor > platform
  scope: {
    type: String,
    enum: ['platform', 'vendor', 'category', 'product'],
    required: true,
  },

  // Reference based on scope
  scopeRef: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'scopeModel',
  },
  scopeModel: {
    type: String,
    enum: ['Product', 'Category', 'Vendor', null],
  },

  // Commission type
  type: {
    type: String,
    enum: ['fixed', 'percentage', 'tiered'],
    required: true,
  },

  // For fixed type: value is the fixed amount per unit
  // For percentage type: value is the percentage (e.g., 10 = 10%)
  value: { type: Number },

  // For tiered type - tiers based on sales volume
  tiers: [tierSchema],
  tierPeriod: {
    type: String,
    enum: ['per_order', 'monthly', 'yearly'],
    default: 'monthly',
  },

  // Category inheritance - apply to all subcategories
  includeSubcategories: { type: Boolean, default: true },

  // Validity period
  startDate: { type: Date },
  endDate: { type: Date },

  isActive: { type: Boolean, default: true },

  // Higher priority = checked first within same scope
  priority: { type: Number, default: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// Indexes for efficient rule lookup
commissionRuleSchema.index({ scope: 1, isActive: 1 });
commissionRuleSchema.index({ scopeRef: 1, scope: 1 });
commissionRuleSchema.index({ scope: 1, priority: -1 });
commissionRuleSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Validation: ensure value or tiers based on type
commissionRuleSchema.pre('save', function(next) {
  if (this.type === 'tiered') {
    if (!this.tiers || this.tiers.length === 0) {
      return next(new Error('Tiers are required for tiered commission type'));
    }
    // Sort tiers by minAmount
    this.tiers.sort((a, b) => a.minAmount - b.minAmount);
  } else {
    if (this.value === undefined || this.value === null) {
      return next(new Error('Value is required for fixed/percentage commission type'));
    }
  }

  // Set scopeModel based on scope
  if (this.scope === 'product') {
    this.scopeModel = 'Product';
  } else if (this.scope === 'category') {
    this.scopeModel = 'Category';
  } else if (this.scope === 'vendor') {
    this.scopeModel = 'Vendor';
  } else {
    this.scopeModel = null;
    this.scopeRef = null;
  }

  next();
});

// Static method to find applicable rule for a product
commissionRuleSchema.statics.findApplicableRule = async function(productId, categoryId, categoryAncestors, vendorId) {
  const now = new Date();

  const dateFilter = {
    $or: [
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $gte: now } },
    ],
  };

  // 1. Check product-specific rule
  let rule = await this.findOne({
    scope: 'product',
    scopeRef: productId,
    isActive: true,
    ...dateFilter,
  }).sort({ priority: -1 });

  if (rule) return rule;

  // 2. Check category rules (including ancestors)
  const categoryIds = [categoryId, ...(categoryAncestors || [])];
  rule = await this.findOne({
    scope: 'category',
    scopeRef: { $in: categoryIds },
    isActive: true,
    ...dateFilter,
  }).sort({ priority: -1 });

  if (rule) return rule;

  // 3. Check vendor-specific rule
  rule = await this.findOne({
    scope: 'vendor',
    scopeRef: vendorId,
    isActive: true,
    ...dateFilter,
  }).sort({ priority: -1 });

  if (rule) return rule;

  // 4. Check platform default
  rule = await this.findOne({
    scope: 'platform',
    isActive: true,
    ...dateFilter,
  }).sort({ priority: -1 });

  return rule;
};

// Instance method to calculate commission for an amount
commissionRuleSchema.methods.calculateCommission = function(saleAmount, vendorPeriodSales = 0) {
  let commissionAmount = 0;
  let appliedRate = 0;
  let tierLevel = null;

  switch (this.type) {
    case 'fixed':
      commissionAmount = this.value;
      appliedRate = this.value;
      break;

    case 'percentage':
      commissionAmount = (saleAmount * this.value) / 100;
      appliedRate = this.value;
      break;

    case 'tiered':
      // Find applicable tier based on cumulative sales
      const totalSales = vendorPeriodSales + saleAmount;
      let applicableTier = this.tiers[0]; // Default to first tier

      for (const tier of this.tiers) {
        if (totalSales >= tier.minAmount) {
          if (!tier.maxAmount || totalSales <= tier.maxAmount) {
            applicableTier = tier;
          }
        }
      }

      commissionAmount = (saleAmount * applicableTier.rate) / 100;
      appliedRate = applicableTier.rate;
      tierLevel = `${applicableTier.minAmount}-${applicableTier.maxAmount || 'unlimited'}`;
      break;
  }

  return {
    commissionAmount: Math.round(commissionAmount * 100) / 100,
    vendorEarning: Math.round((saleAmount - commissionAmount) * 100) / 100,
    appliedRate,
    tierLevel,
  };
};

module.exports = mongoose.model('CommissionRule', commissionRuleSchema);
