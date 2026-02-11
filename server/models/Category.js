const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    // For efficient hierarchical queries
    ancestors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
    level: { type: Number, default: 0 },
    path: { type: String, default: '' },
    icon: { type: String, default: '' },
    image: { type: String, default: '' },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    sortOrder: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    // SEO metadata
    metadata: {
      seoTitle: { type: String },
      seoDescription: { type: String },
      seoKeywords: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from name before saving
categorySchema.pre('save', async function (next) {
  // Generate slug from name
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Calculate ancestors, level, and path when parent changes
  if (this.isModified('parent') || this.isNew) {
    if (this.parent) {
      const parentCategory = await this.constructor.findById(this.parent);
      if (parentCategory) {
        this.ancestors = [...(parentCategory.ancestors || []), parentCategory._id];
        this.level = (parentCategory.level || 0) + 1;
        this.path = `${parentCategory.path || ''}/${this.slug}`;
      }
    } else {
      this.ancestors = [];
      this.level = 0;
      this.path = `/${this.slug}`;
    }
  } else if (this.isModified('slug') && this.path) {
    // Update path if slug changes
    const pathParts = this.path.split('/');
    pathParts[pathParts.length - 1] = this.slug;
    this.path = pathParts.join('/');
  }

  next();
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// Indexes for efficient queries
categorySchema.index({ parent: 1, sortOrder: 1 });
categorySchema.index({ ancestors: 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ level: 1, isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
