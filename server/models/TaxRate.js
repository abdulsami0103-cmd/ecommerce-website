const mongoose = require('mongoose');

const taxRateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  }, // e.g., "Pakistan GST", "Punjab Sales Tax"
  description: {
    type: String,
    maxlength: 500,
  },

  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaxZone',
    required: true,
  },

  taxType: {
    type: String,
    enum: ['vat', 'sales_tax', 'gst', 'service_tax', 'custom'],
    required: true,
  },

  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  }, // Percentage (e.g., 17 = 17%)

  // What does this tax apply to
  appliesTo: {
    type: String,
    enum: ['all', 'products_only', 'shipping_only', 'specific_categories'],
    default: 'all',
  },

  // Categories this rate applies to (when appliesTo = 'specific_categories')
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],

  // Whether price already includes this tax
  isInclusive: { type: Boolean, default: false },

  // Compound tax (applied after other taxes)
  isCompound: { type: Boolean, default: false },
  compoundOrder: { type: Number, default: 0 }, // Order of application for compound taxes

  // Display settings
  displayName: { type: String, maxlength: 50 }, // Short name for invoices
  showOnInvoice: { type: Boolean, default: true },
  showOnCheckout: { type: Boolean, default: true },

  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 }, // Higher = applied first (for non-compound)

  // Validity period
  startDate: { type: Date },
  endDate: { type: Date },

  // Metadata
  legalReference: { type: String }, // Reference to tax law/regulation
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// Indexes
taxRateSchema.index({ zone: 1, isActive: 1 });
taxRateSchema.index({ taxType: 1 });
taxRateSchema.index({ zone: 1, appliesTo: 1, isActive: 1 });
taxRateSchema.index({ isCompound: 1, compoundOrder: 1 });

// Virtual for display rate
taxRateSchema.virtual('displayRate').get(function() {
  return `${this.rate}%`;
});

// Virtual for effective name (for display)
taxRateSchema.virtual('effectiveName').get(function() {
  return this.displayName || this.name;
});

// Static method to get applicable rates for a zone
taxRateSchema.statics.getRatesForZone = async function(zoneId, options = {}) {
  const now = new Date();

  const query = {
    zone: zoneId,
    isActive: true,
    $or: [
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $gte: now } },
    ],
  };

  if (options.appliesTo) {
    query.appliesTo = { $in: ['all', options.appliesTo] };
  }

  if (options.category) {
    query.$or = [
      { appliesTo: { $ne: 'specific_categories' } },
      { categories: options.category },
    ];
  }

  return this.find(query)
    .sort({ isCompound: 1, priority: -1, compoundOrder: 1 })
    .populate('categories', 'name slug');
};

// Static method to calculate tax for an amount
taxRateSchema.statics.calculateTax = async function(zoneId, items, options = {}) {
  const rates = await this.getRatesForZone(zoneId, options);

  if (rates.length === 0) {
    return {
      totalTax: 0,
      breakdown: [],
      rates: [],
    };
  }

  const breakdown = [];
  let totalTax = 0;
  let runningTotal = 0; // For compound tax calculation

  // Calculate base total
  const baseTotal = items.reduce((sum, item) => sum + (item.amount || item.price * item.quantity), 0);
  runningTotal = baseTotal;

  // Apply non-compound taxes first
  const nonCompoundRates = rates.filter(r => !r.isCompound);
  const compoundRates = rates.filter(r => r.isCompound);

  for (const rate of nonCompoundRates) {
    let taxableAmount = baseTotal;

    // Check if rate applies to specific categories
    if (rate.appliesTo === 'specific_categories') {
      taxableAmount = items
        .filter(item => rate.categories.some(c => c._id.toString() === item.categoryId?.toString()))
        .reduce((sum, item) => sum + (item.amount || item.price * item.quantity), 0);
    } else if (rate.appliesTo === 'shipping_only') {
      taxableAmount = options.shippingAmount || 0;
    } else if (rate.appliesTo === 'products_only') {
      taxableAmount = baseTotal - (options.shippingAmount || 0);
    }

    let taxAmount;
    if (rate.isInclusive) {
      // Tax is included: extract from price
      taxAmount = taxableAmount - (taxableAmount / (1 + rate.rate / 100));
    } else {
      // Tax added on top
      taxAmount = (taxableAmount * rate.rate) / 100;
    }

    taxAmount = Math.round(taxAmount * 100) / 100;

    if (taxAmount > 0) {
      breakdown.push({
        rateId: rate._id,
        rateName: rate.effectiveName,
        taxType: rate.taxType,
        rate: rate.rate,
        taxableAmount,
        taxAmount,
        isInclusive: rate.isInclusive,
        isCompound: false,
      });

      if (!rate.isInclusive) {
        totalTax += taxAmount;
        runningTotal += taxAmount;
      }
    }
  }

  // Apply compound taxes (on total including previous taxes)
  for (const rate of compoundRates) {
    const taxAmount = Math.round((runningTotal * rate.rate) / 100 * 100) / 100;

    if (taxAmount > 0) {
      breakdown.push({
        rateId: rate._id,
        rateName: rate.effectiveName,
        taxType: rate.taxType,
        rate: rate.rate,
        taxableAmount: runningTotal,
        taxAmount,
        isInclusive: false,
        isCompound: true,
      });

      totalTax += taxAmount;
      runningTotal += taxAmount;
    }
  }

  return {
    totalTax: Math.round(totalTax * 100) / 100,
    breakdown,
    rates: rates.map(r => ({
      id: r._id,
      name: r.effectiveName,
      type: r.taxType,
      rate: r.rate,
    })),
  };
};

// Static method to setup Pakistan 17% GST
taxRateSchema.statics.setupPakistanDefaults = async function(zoneId) {
  const existing = await this.findOne({ zone: zoneId, taxType: 'gst' });
  if (existing) return existing;

  return this.create({
    name: 'Pakistan GST',
    description: 'General Sales Tax - Pakistan',
    zone: zoneId,
    taxType: 'gst',
    rate: 17,
    appliesTo: 'all',
    isInclusive: false,
    displayName: 'GST (17%)',
    showOnInvoice: true,
    showOnCheckout: true,
    isActive: true,
    legalReference: 'Sales Tax Act, 1990',
  });
};

taxRateSchema.set('toJSON', { virtuals: true });
taxRateSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TaxRate', taxRateSchema);
