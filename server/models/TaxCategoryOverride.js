const mongoose = require('mongoose');

const taxCategoryOverrideSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },

  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaxZone',
  }, // null = applies to all zones

  // Override type
  overrideType: {
    type: String,
    enum: ['exempt', 'reduced_rate', 'custom_rate', 'zero_rated'],
    required: true,
  },

  // Custom rate (for reduced_rate or custom_rate)
  customRate: {
    type: Number,
    min: 0,
    max: 100,
  },

  // Applies to subcategories
  includeSubcategories: { type: Boolean, default: true },

  // Reason for override (for compliance)
  reason: {
    type: String,
    maxlength: 500,
  }, // e.g., "Essential goods exemption", "Export zero-rated"

  // Legal reference
  legalReference: { type: String },

  // Validity period
  startDate: { type: Date },
  endDate: { type: Date },

  isActive: { type: Boolean, default: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// Indexes
taxCategoryOverrideSchema.index({ category: 1, zone: 1 });
taxCategoryOverrideSchema.index({ zone: 1, isActive: 1 });
taxCategoryOverrideSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Compound unique index to prevent duplicates
taxCategoryOverrideSchema.index(
  { category: 1, zone: 1 },
  { unique: true, partialFilterExpression: { zone: { $type: 'objectId' } } }
);

// Validation
taxCategoryOverrideSchema.pre('save', function(next) {
  if (['reduced_rate', 'custom_rate'].includes(this.overrideType)) {
    if (this.customRate === undefined || this.customRate === null) {
      return next(new Error('Custom rate is required for reduced_rate or custom_rate override'));
    }
  }
  next();
});

// Virtual for effective rate
taxCategoryOverrideSchema.virtual('effectiveRate').get(function() {
  switch (this.overrideType) {
    case 'exempt':
    case 'zero_rated':
      return 0;
    case 'reduced_rate':
    case 'custom_rate':
      return this.customRate;
    default:
      return null;
  }
});

// Static method to find override for a category and zone
taxCategoryOverrideSchema.statics.findOverride = async function(categoryId, categoryAncestors, zoneId) {
  const now = new Date();

  const dateFilter = {
    $or: [
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $gte: now } },
    ],
  };

  // Check category-specific override first
  const categoryIds = [categoryId, ...(categoryAncestors || [])];

  // Check for zone-specific override
  let override = await this.findOne({
    category: { $in: categoryIds },
    zone: zoneId,
    isActive: true,
    ...dateFilter,
  }).populate('category', 'name');

  if (override) {
    // If found on ancestor, check includeSubcategories
    if (override.category._id.toString() !== categoryId.toString() && !override.includeSubcategories) {
      override = null;
    }
  }

  // If no zone-specific, check for global (zone = null)
  if (!override) {
    override = await this.findOne({
      category: { $in: categoryIds },
      zone: null,
      isActive: true,
      ...dateFilter,
    }).populate('category', 'name');

    if (override && override.category._id.toString() !== categoryId.toString() && !override.includeSubcategories) {
      override = null;
    }
  }

  return override;
};

// Static method to get all overrides for a zone
taxCategoryOverrideSchema.statics.getOverridesForZone = async function(zoneId) {
  return this.find({
    $or: [{ zone: zoneId }, { zone: null }],
    isActive: true,
  })
    .populate('category', 'name slug')
    .populate('zone', 'name countryCode');
};

// Static method to get exempt categories
taxCategoryOverrideSchema.statics.getExemptCategories = async function(zoneId = null) {
  const query = {
    overrideType: { $in: ['exempt', 'zero_rated'] },
    isActive: true,
  };

  if (zoneId) {
    query.$or = [{ zone: zoneId }, { zone: null }];
  }

  return this.find(query).populate('category', 'name slug ancestors');
};

taxCategoryOverrideSchema.set('toJSON', { virtuals: true });
taxCategoryOverrideSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TaxCategoryOverride', taxCategoryOverrideSchema);
