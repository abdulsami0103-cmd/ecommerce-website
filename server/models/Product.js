const mongoose = require('mongoose');

const variantOptionSchema = new mongoose.Schema({
  value: { type: String, required: true },
  priceModifier: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
});

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  options: [variantOptionSchema],
});

const productSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['physical', 'digital'],
      default: 'physical',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    subcategory: { type: String },
    images: [{ type: String }],
    digitalFile: {
      url: { type: String },
      filename: { type: String },
    },
    price: {
      amount: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative'],
      },
      currency: { type: String, default: 'USD' },
      compareAt: { type: Number }, // Original price for sales
    },
    inventory: {
      quantity: { type: Number, default: 0 },
      sku: { type: String },
      trackInventory: { type: Boolean, default: true },
      lowStockThreshold: { type: Number, default: 10 },
      outOfStockBehavior: {
        type: String,
        enum: ['hide', 'show_badge', 'allow_backorder'],
        default: 'show_badge',
      },
      reservedQuantity: { type: Number, default: 0 },
      lastRestockedAt: { type: Date },
      isDisabledDueToStock: { type: Boolean, default: false },
    },
    variants: [variantSchema],
    // New variant system (Shopify-style options)
    options: [{
      name: { type: String, required: true },  // e.g., "Size", "Color"
      values: [{ type: String }],               // e.g., ["S", "M", "L"]
      position: { type: Number, default: 0 },
    }],
    hasVariants: {
      type: Boolean,
      default: false,
    },
    // SEO fields
    seo: {
      metaTitle: {
        type: String,
        maxlength: [70, 'Meta title cannot exceed 70 characters'],
      },
      metaDescription: {
        type: String,
        maxlength: [160, 'Meta description cannot exceed 160 characters'],
      },
      urlHandle: {
        type: String,
        lowercase: true,
      },
    },
    // Reference to primary image (from ProductImage model)
    primaryImageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductImage',
    },
    // Count of images (for quick access)
    imageCount: {
      type: Number,
      default: 0,
    },
    shipping: {
      weight: { type: Number }, // in kg
      dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number },
      },
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive'],
      default: 'draft',
    },
    // Product moderation system
    moderation: {
      status: {
        type: String,
        enum: ['draft', 'pending_review', 'approved', 'published', 'rejected', 'changes_requested'],
        default: 'draft',
      },
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectionReason: { type: String },
      changesRequested: { type: String },
      autoApproved: { type: Boolean, default: false },
      reviewCount: { type: Number, default: 0 },
    },
    // Dynamic category attributes
    attributes: [{
      attribute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attribute',
        required: true,
      },
      value: mongoose.Schema.Types.Mixed,
    }],
    tags: [{ type: String }],
    viewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Create slug from name before saving
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    const timestamp = Date.now().toString(36);
    this.slug = `${this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${timestamp}`;
  }
  next();
});

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Index for filtering
productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'price.amount': 1 });
// Index for moderation queue
productSchema.index({ 'moderation.status': 1, 'moderation.submittedAt': 1 });
// Index for inventory alerts
productSchema.index({ 'inventory.quantity': 1, 'inventory.lowStockThreshold': 1 });
// Index for variant products
productSchema.index({ hasVariants: 1, status: 1 });
// Index for SEO URL handle
productSchema.index({ 'seo.urlHandle': 1 });

// Virtual to get images from ProductImage model
productSchema.virtual('productImages', {
  ref: 'ProductImage',
  localField: '_id',
  foreignField: 'product',
  options: { sort: { sortOrder: 1 } },
});

// Virtual to get variants from ProductVariant model
productSchema.virtual('productVariants', {
  ref: 'ProductVariant',
  localField: '_id',
  foreignField: 'product',
  options: { sort: { position: 1 } },
});

// Virtual to get digital assets
productSchema.virtual('digitalAssets', {
  ref: 'DigitalAsset',
  localField: '_id',
  foreignField: 'product',
  options: { sort: { sortOrder: 1 } },
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
