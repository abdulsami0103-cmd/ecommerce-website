const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const downloadHistorySchema = new mongoose.Schema({
  downloadedAt: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, { _id: false });

const downloadLogSchema = new mongoose.Schema(
  {
    digitalAsset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DigitalAsset',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Download tracking
    downloadCount: {
      type: Number,
      default: 0,
    },
    downloadLimit: {
      type: Number,
      default: 0, // 0 = unlimited (copied from asset at creation)
    },
    firstDownloadAt: {
      type: Date,
    },
    lastDownloadAt: {
      type: Date,
    },
    // Access token for secure downloads
    accessToken: {
      type: String,
      unique: true,
      index: true,
    },
    tokenExpiresAt: {
      type: Date,
    },
    // Download history
    downloadHistory: [downloadHistorySchema],
    // License key assigned (if applicable)
    assignedLicenseKey: {
      type: String,
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
downloadLogSchema.index({ order: 1, digitalAsset: 1 }, { unique: true });
downloadLogSchema.index({ accessToken: 1, isActive: 1 });

// Pre-save: Generate access token if not present
downloadLogSchema.pre('save', function (next) {
  if (!this.accessToken) {
    this.accessToken = uuidv4();
  }
  next();
});

// Static: Create download log for order
downloadLogSchema.statics.createForOrder = async function (orderId, userId, productId, digitalAssetId, downloadLimit, expiryHours) {
  // Calculate expiry
  let tokenExpiresAt = null;
  if (expiryHours > 0) {
    tokenExpiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  }

  return this.create({
    digitalAsset: digitalAssetId,
    order: orderId,
    user: userId,
    product: productId,
    downloadLimit,
    tokenExpiresAt,
  });
};

// Static: Find by access token
downloadLogSchema.statics.findByToken = async function (token) {
  return this.findOne({ accessToken: token, isActive: true })
    .populate('digitalAsset')
    .populate('product', 'name slug');
};

// Static: Get downloads for order
downloadLogSchema.statics.getOrderDownloads = async function (orderId) {
  return this.find({ order: orderId, isActive: true })
    .populate('digitalAsset')
    .populate('product', 'name slug images');
};

// Static: Get downloads for user
downloadLogSchema.statics.getUserDownloads = async function (userId) {
  return this.find({ user: userId, isActive: true })
    .populate('digitalAsset')
    .populate('product', 'name slug images')
    .populate('order', 'orderNumber')
    .sort('-createdAt');
};

// Instance method: Check if download is allowed
downloadLogSchema.methods.canDownload = function () {
  // Check if active
  if (!this.isActive) {
    return { allowed: false, reason: 'Download access has been revoked' };
  }

  // Check expiry
  if (this.tokenExpiresAt && new Date() > this.tokenExpiresAt) {
    return { allowed: false, reason: 'Download link has expired' };
  }

  // Check download limit
  if (this.downloadLimit > 0 && this.downloadCount >= this.downloadLimit) {
    return { allowed: false, reason: 'Download limit reached' };
  }

  return { allowed: true };
};

// Instance method: Record download
downloadLogSchema.methods.recordDownload = async function (ipAddress, userAgent) {
  const now = new Date();

  if (!this.firstDownloadAt) {
    this.firstDownloadAt = now;
  }
  this.lastDownloadAt = now;
  this.downloadCount += 1;
  this.downloadHistory.push({
    downloadedAt: now,
    ipAddress,
    userAgent,
  });

  // Keep only last 100 downloads in history
  if (this.downloadHistory.length > 100) {
    this.downloadHistory = this.downloadHistory.slice(-100);
  }

  return this.save();
};

// Instance method: Refresh token
downloadLogSchema.methods.refreshToken = async function (expiryHours = 24) {
  this.accessToken = uuidv4();
  if (expiryHours > 0) {
    this.tokenExpiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  }
  return this.save();
};

// Instance method: Get remaining downloads
downloadLogSchema.methods.getRemainingDownloads = function () {
  if (this.downloadLimit === 0) return 'Unlimited';
  return Math.max(0, this.downloadLimit - this.downloadCount);
};

// Instance method: Check if token is expired
downloadLogSchema.methods.isTokenExpired = function () {
  if (!this.tokenExpiresAt) return false;
  return new Date() > this.tokenExpiresAt;
};

module.exports = mongoose.model('DownloadLog', downloadLogSchema);
