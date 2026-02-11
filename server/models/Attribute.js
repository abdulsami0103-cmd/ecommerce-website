const mongoose = require('mongoose');

const attributeOptionSchema = new mongoose.Schema({
  value: { type: String, required: true },
  label: { type: String, required: true },
  colorHex: { type: String }, // For color type attributes
  sortOrder: { type: Number, default: 0 },
});

const attributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Attribute name is required'],
      trim: true,
      maxlength: [100, 'Attribute name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ['text', 'number', 'select', 'multi_select', 'boolean', 'color', 'date'],
      required: [true, 'Attribute type is required'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    // Options for select/multi_select types
    options: [attributeOptionSchema],
    // Validation rules
    validation: {
      min: { type: Number },        // For number type
      max: { type: Number },        // For number type
      minLength: { type: Number },  // For text type
      maxLength: { type: Number },  // For text type
      pattern: { type: String },    // Regex pattern for text
    },
    // Display and filtering options
    isFilterable: { type: Boolean, default: false },
    isSearchable: { type: Boolean, default: false },
    isVisibleOnProduct: { type: Boolean, default: true },
    isRequired: { type: Boolean, default: false }, // Global default
    // Ordering
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Generate slug from name before saving
attributeSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes
attributeSchema.index({ slug: 1 });
attributeSchema.index({ isFilterable: 1, isActive: 1 });
attributeSchema.index({ type: 1 });
attributeSchema.index({ sortOrder: 1 });

// Static method to get filterable attributes
attributeSchema.statics.getFilterableAttributes = function () {
  return this.find({ isFilterable: true, isActive: true }).sort('sortOrder');
};

module.exports = mongoose.model('Attribute', attributeSchema);
