const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    // Original uploaded URL
    url: {
      type: String,
      required: true,
    },
    // Cloudinary public_id for deletion
    publicId: {
      type: String,
    },
    // SEO alt text
    altText: {
      type: String,
      maxlength: [255, 'Alt text cannot exceed 255 characters'],
      default: '',
    },
    // Sort order for display (0 = first)
    sortOrder: {
      type: Number,
      default: 0,
    },
    // Primary image flag
    isPrimary: {
      type: Boolean,
      default: false,
    },
    // Pre-generated thumbnails
    thumbnails: {
      small: { type: String },   // 150px
      medium: { type: String },  // 600px
      full: { type: String },    // 1200px
    },
    // Image metadata
    metadata: {
      width: { type: Number },
      height: { type: Number },
      format: { type: String },
      size: { type: Number }, // bytes
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
productImageSchema.index({ product: 1, sortOrder: 1 });
productImageSchema.index({ vendor: 1, createdAt: -1 });

// Ensure only one primary image per product
productImageSchema.pre('save', async function (next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    // Unset other primary images for this product
    await this.constructor.updateMany(
      { product: this.product, _id: { $ne: this._id } },
      { isPrimary: false }
    );
  }
  next();
});

// Static method to get all images for a product
productImageSchema.statics.getProductImages = async function (productId) {
  return this.find({ product: productId }).sort('sortOrder');
};

// Static method to set primary image
productImageSchema.statics.setPrimaryImage = async function (productId, imageId) {
  // First, unset all primary flags for this product
  await this.updateMany({ product: productId }, { isPrimary: false });
  // Then set the new primary
  return this.findByIdAndUpdate(imageId, { isPrimary: true }, { new: true });
};

// Static method to reorder images
productImageSchema.statics.reorderImages = async function (productId, imageIds) {
  const bulkOps = imageIds.map((imageId, index) => ({
    updateOne: {
      filter: { _id: imageId, product: productId },
      update: { sortOrder: index },
    },
  }));
  return this.bulkWrite(bulkOps);
};

// Static method to get primary image URL
productImageSchema.statics.getPrimaryImageUrl = async function (productId, size = 'medium') {
  const primaryImage = await this.findOne({ product: productId, isPrimary: true });
  if (primaryImage) {
    return primaryImage.thumbnails?.[size] || primaryImage.url;
  }
  // Fallback to first image
  const firstImage = await this.findOne({ product: productId }).sort('sortOrder');
  return firstImage ? (firstImage.thumbnails?.[size] || firstImage.url) : null;
};

module.exports = mongoose.model('ProductImage', productImageSchema);
