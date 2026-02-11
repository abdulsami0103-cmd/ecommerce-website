const mongoose = require('mongoose');

const licenseKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  usedAt: {
    type: Date,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
}, { _id: true });

const digitalAssetSchema = new mongoose.Schema(
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
    // File information
    filename: {
      type: String,
      required: [true, 'Filename is required'],
    },
    originalName: {
      type: String,
    },
    mimeType: {
      type: String,
    },
    size: {
      type: Number, // bytes
    },
    // Storage information
    storageProvider: {
      type: String,
      enum: ['cloudinary_private', 's3', 'local'],
      default: 'cloudinary_private',
    },
    storagePath: {
      type: String,
      required: [true, 'Storage path is required'],
    },
    // Cloudinary public_id for deletion
    publicId: {
      type: String,
    },
    // Delivery settings
    downloadLimit: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    expiryHours: {
      type: Number,
      default: 0, // 0 = never expires
    },
    // License keys for software products
    licenseKeys: [licenseKeySchema],
    // Asset type
    assetType: {
      type: String,
      enum: ['file', 'license_key', 'both'],
      default: 'file',
    },
    // Version tracking
    version: {
      type: String,
      default: '1.0',
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Description/notes for this asset
    description: {
      type: String,
      maxlength: 500,
    },
    // Sort order (for multiple assets per product)
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
digitalAssetSchema.index({ product: 1, sortOrder: 1 });
digitalAssetSchema.index({ vendor: 1, createdAt: -1 });
digitalAssetSchema.index({ 'licenseKeys.isUsed': 1 });

// Static: Get assets for a product
digitalAssetSchema.statics.getProductAssets = async function (productId) {
  return this.find({ product: productId, isActive: true }).sort('sortOrder');
};

// Static: Add license keys in bulk
digitalAssetSchema.statics.addLicenseKeys = async function (assetId, keys) {
  const keysArray = keys
    .split(/[\n,]/)
    .map(k => k.trim())
    .filter(Boolean)
    .map(key => ({ key, isUsed: false }));

  return this.findByIdAndUpdate(
    assetId,
    { $push: { licenseKeys: { $each: keysArray } } },
    { new: true }
  );
};

// Static: Get next available license key
digitalAssetSchema.statics.getAvailableLicenseKey = async function (assetId) {
  const asset = await this.findOne({
    _id: assetId,
    'licenseKeys.isUsed': false,
  });

  if (!asset) return null;

  return asset.licenseKeys.find(k => !k.isUsed);
};

// Static: Assign license key to user/order
digitalAssetSchema.statics.assignLicenseKey = async function (assetId, userId, orderId) {
  const asset = await this.findOneAndUpdate(
    {
      _id: assetId,
      'licenseKeys.isUsed': false,
    },
    {
      $set: {
        'licenseKeys.$.isUsed': true,
        'licenseKeys.$.usedBy': userId,
        'licenseKeys.$.usedAt': new Date(),
        'licenseKeys.$.orderId': orderId,
      },
    },
    { new: true }
  );

  if (!asset) return null;

  // Return the assigned key
  return asset.licenseKeys.find(
    k => k.orderId?.toString() === orderId.toString()
  );
};

// Static: Get license key stats
digitalAssetSchema.statics.getLicenseKeyStats = async function (assetId) {
  const asset = await this.findById(assetId);
  if (!asset) return null;

  const total = asset.licenseKeys.length;
  const used = asset.licenseKeys.filter(k => k.isUsed).length;
  const available = total - used;

  return { total, used, available };
};

// Instance method: Check if has available keys
digitalAssetSchema.methods.hasAvailableKeys = function () {
  if (this.assetType === 'file') return true;
  return this.licenseKeys.some(k => !k.isUsed);
};

// Instance method: Get file extension
digitalAssetSchema.methods.getFileExtension = function () {
  if (!this.filename) return null;
  const parts = this.filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : null;
};

// Instance method: Format file size
digitalAssetSchema.methods.getFormattedSize = function () {
  if (!this.size) return 'Unknown';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = this.size;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

module.exports = mongoose.model('DigitalAsset', digitalAssetSchema);
